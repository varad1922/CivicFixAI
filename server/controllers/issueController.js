const supabase = require('../config/supabase');
const { logActivity } = require('../services/activityService');
const socketService = require('../services/socketService');

// Map Supabase rows to the frontend contract
const mapIssue = (issue) => {
  if (!issue) return null;

  return {
    _id: issue.id,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    createdAt: issue.created_at,
    location: {
      type: 'Point',
      coordinates: [Number(issue.lng), Number(issue.lat)],
      address: issue.address
    },
    images: issue.images || [],
    reportedBy: issue.reportedBy
      ? {
          _id: issue.reportedBy.id,
          name: issue.reportedBy.name,
          avatar: issue.reportedBy.avatar
        }
      : issue.reported_by,
    assignedAuthority: issue.assigned_authority_id,
    aiAnalysis: {
      category: issue.ai_category,
      severity: issue.ai_severity,
      confidence: issue.ai_confidence,
      suggestedTitle: issue.ai_suggested_title,
      suggestedDescription: issue.ai_suggested_description,
      safetyImpact: issue.ai_safety_impact
    },
    timeline: (issue.timeline || []).map(t => ({
      status: t.status,
      timestamp: t.timestamp,
      user: t.user_id,
      note: t.note
    }))
  };
};

// Map Category to Department
const categoryToDepartment = (category) => {
  const map = {
    'Pothole': 'Road Authority',
    'Damaged Road': 'Road Authority',
    'Garbage Accumulation': 'Sanitation Authority',
    'Illegal Dumping': 'Sanitation Authority',
    'Water Leakage': 'Water Authority',
    'Drainage Issue': 'Water Authority',
    'Broken Streetlight': 'Electrical Authority',
    'Traffic Signal Issue': 'Electrical Authority',
    'Public Property Damage': 'Parks Authority'
  };
  return map[category] || 'General Civic Authority';
};

const findAppropriateAuthority = async (department, address = '') => {
  const { data: authorities, error } = await supabase
    .from('profiles')
    .select('id, jurisdiction, created_at')
    .eq('role', 'authority')
    .eq('verification_status', 'verified')
    .eq('is_active', true)
    .eq('department', department)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Authority lookup failed: ${error.message}`);
  if (!authorities?.length) return null;

  const normalizedAddress = String(address || '').toLowerCase();
  const ranked = authorities.map(authority => {
    const jurisdiction = String(authority.jurisdiction || '').toLowerCase().trim();
    let jurisdictionScore = 0;
    if (jurisdiction && normalizedAddress) {
      if (normalizedAddress === jurisdiction) jurisdictionScore = 3;
      else if (normalizedAddress.includes(jurisdiction)) jurisdictionScore = 2;
      else if (jurisdiction.includes(normalizedAddress)) jurisdictionScore = 1;
    }
    return { ...authority, jurisdictionScore };
  });

  // Prefer an authority whose declared jurisdiction appears in the report
  // address. If no textual jurisdiction match exists, balance the workload
  // across verified active authorities in the correct department.
  const maxScore = Math.max(...ranked.map(a => a.jurisdictionScore));
  const candidates = ranked.filter(a => a.jurisdictionScore === maxScore);
  if (candidates.length === 1) return candidates[0].id;

  const candidateIds = candidates.map(a => a.id);
  const { data: activeIssues, error: loadError } = await supabase
    .from('issues')
    .select('assigned_authority_id')
    .in('assigned_authority_id', candidateIds)
    .not('status', 'in', '(\"Resolved\",\"Closed\")');

  if (loadError) throw new Error(`Authority workload lookup failed: ${loadError.message}`);

  const load = new Map(candidateIds.map(id => [id, 0]));
  (activeIssues || []).forEach(issue => load.set(issue.assigned_authority_id, (load.get(issue.assigned_authority_id) || 0) + 1));
  candidates.sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0));
  return candidates[0].id;
};

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      images,
      location,
      aiAnalysis
    } = req.body;

    const coordinates = location?.coordinates;
    if (
      !title?.trim() ||
      !description?.trim() ||
      !category ||
      !severity ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      !Number.isFinite(Number(coordinates[0])) ||
      !Number.isFinite(Number(coordinates[1])) ||
      Number(coordinates[0]) < -180 || Number(coordinates[0]) > 180 ||
      Number(coordinates[1]) < -90 || Number(coordinates[1]) > 90
    ) {
      res.status(400);
      throw new Error(
        'Please provide all required fields including location coordinates'
      );
    }

    const department = categoryToDepartment(category);
    const assignedAuthorityId = await findAppropriateAuthority(department, location.address);

    // Do not create operational complaints that nobody can own. Admins verify
    // authorities; they are not a forwarding queue.
    if (!assignedAuthorityId) {
      res.status(503);
      throw new Error(`No verified active ${department} is available for this report yet.`);
    }

    const { data: issue, error } = await supabase
      .from('issues')
      .insert({
        title,
        description,
        category,
        severity,
        location: `SRID=4326;POINT(${Number(coordinates[0])} ${Number(coordinates[1])})`,
        lng: Number(coordinates[0]),
        lat: Number(coordinates[1]),
        address: location.address || '',
        reported_by: req.user.id,
        assigned_authority_id: assignedAuthorityId,
        ai_category: aiAnalysis?.category,
        ai_severity: aiAnalysis?.severity,
        ai_confidence: aiAnalysis?.confidence,
        ai_suggested_title: aiAnalysis?.suggestedTitle,
        ai_suggested_description: aiAnalysis?.suggestedDescription,
        ai_safety_impact: aiAnalysis?.safetyImpact
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (images && images.length > 0) {
      const { error: imgError } = await supabase
        .from('issue_images')
        .insert(
          images.map(img => ({
            issue_id: issue.id,
            url: img.url,
            public_id: img.public_id
          }))
        );

      if (imgError) {
        console.error('Image Insert Error:', imgError);
      }
    }

    await supabase.from('issue_timeline').insert({
      issue_id: issue.id,
      status: 'Reported',
      user_id: req.user.id,
      note: 'Issue reported'
    });

    await logActivity(
      'ISSUE_SUBMITTED',
      req.user.id,
      issue.id,
      { category, severity }
    );

    // Send back formatted response
    issue.images = images || [];

    const formattedIssue = mapIssue(issue);

    // Real-time events
    socketService.emitToAll(
      'issue:map:new',
      formattedIssue
    );

    if (assignedAuthorityId) {
      socketService.emitToUser(
        assignedAuthorityId,
        'issue:assigned',
        formattedIssue
      );

      socketService.emitToUser(
        assignedAuthorityId,
        'notification:authority',
        {
          type: 'NEW_ISSUE',
          issue: formattedIssue,
          message: `New issue assigned to you: ${title}`
        }
      );
    } else {
      socketService.emitToAuthorities(
        'notification:authority',
        {
          type: 'UNASSIGNED_ISSUE',
          issue: formattedIssue,
          message: `New unassigned issue reported: ${title}`
        }
      );
    }

    res.status(201).json(formattedIssue);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issues
// @route   GET /api/issues
// @access  Public
const getIssues = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        reportedBy:profiles(id, name, avatar),
        images:issue_images(url, public_id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json(data.map(mapIssue));
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user issues
// @route   GET /api/issues/my-issues
// @access  Private
const getMyIssues = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        reportedBy:profiles(id, name, avatar),
        images:issue_images(url, public_id)
      `)
      .eq('reported_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json(data.map(mapIssue));
  } catch (error) {
    next(error);
  }
};

// @desc    Get issue by ID
// @route   GET /api/issues/:id
// @access  Public
const getIssueById = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        reportedBy:profiles(id, name, avatar),
        images:issue_images(url, public_id),
        timeline:issue_timeline(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      res.status(404);
      throw new Error('Issue not found');
    }

    res.json(mapIssue(data));
  } catch (error) {
    next(error);
  }
};

// @desc    Check for duplicate issues nearby
// @route   POST /api/issues/check-duplicates
// @access  Private
const checkDuplicates = async (req, res, next) => {
  try {
    const { coordinates, category } = req.body;

    if (!coordinates || !category) {
      res.status(400);
      throw new Error('Coordinates and category are required');
    }

    // Call RPC function find_nearby_issues
    const { data, error } = await supabase.rpc(
      'find_nearby_issues',
      {
        lon: coordinates[0],
        lat: coordinates[1],
        radius_meters: 100
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    // Filter by category and status
    const duplicates = data
      .filter(
        issue =>
          issue.category === category &&
          issue.status !== 'Resolved' &&
          issue.status !== 'Closed'
      )
      .slice(0, 3)
      .map(mapIssue);

    res.json(duplicates);
  } catch (error) {
    next(error);
  }
};

// @desc    Get queue for authority
// @route   GET /api/issues/queue
// @access  Private (Authority)
const getQueue = async (req, res, next) => {
  try {
    let query = supabase
      .from('issues')
      .select(`
        *,
        reportedBy:profiles(id, name, avatar)
      `)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    // Authorities only see work explicitly assigned to them. There is no
    // admin-forwarding or shared unassigned queue in the operational flow.
    query = query.eq('assigned_authority_id', req.user.id);

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    res.json(data.map(mapIssue));
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue status
// @route   PATCH /api/issues/:id/status
// @access  Private (Authority)
const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      res.status(400);
      throw new Error('Status is required');
    }

    const { data: issue, error: fetchError } = await supabase
      .from('issues')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !issue) {
      res.status(404);
      throw new Error('Issue not found');
    }

    if (issue.assigned_authority_id !== req.user.id) {
      res.status(403);
      throw new Error('You can only update issues assigned to your authority account.');
    }

    const allowedTransitions = {
      'Reported': ['Under Review', 'Assigned', 'In Progress', 'Resolved'],
      'Under Review': ['Assigned', 'In Progress', 'Resolved'],
      'Assigned': ['In Progress', 'Resolved'],
      'In Progress': ['Resolved', 'Closed'],
      'Resolved': ['Closed'],
      'Closed': []
    };
    if (!allowedTransitions[issue.status]?.includes(status)) {
      res.status(400);
      throw new Error(`Invalid status transition from ${issue.status} to ${status}`);
    }

    const { error: updateError } = await supabase
      .from('issues')
      .update({ status })
      .eq('id', req.params.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await supabase.from('issue_timeline').insert({
      issue_id: req.params.id,
      status,
      user_id: req.user.id,
      note: note || `Status updated to ${status}`
    });

    if (status === 'Resolved' || status === 'Closed') {
      await logActivity(
        'ISSUE_VERIFIED',
        req.user.id,
        req.params.id,
        { status }
      );
    }

    // Return the updated issue mapped
    const updatedIssue = mapIssue({
      ...issue,
      status
    });

    // Real-time events
    socketService.emitToAll(
      'issue:updated',
      updatedIssue
    );

    socketService.emitToUser(
      issue.reported_by,
      'notification:citizen',
      {
        type: 'STATUS_UPDATED',
        issue: updatedIssue,
        message: `Your issue "${issue.title}" status changed to ${status}`
      }
    );

    res.json(updatedIssue);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIssue,
  getIssues,
  getMyIssues,
  getIssueById,
  checkDuplicates,
  getQueue,
  updateStatus
};