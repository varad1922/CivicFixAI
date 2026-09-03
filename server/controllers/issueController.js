const supabase = require('../config/supabase');
const { logActivity } = require('../services/activityService');
const socketService = require('../services/socketService');

// Map Supabase rows to MongoDB-like JSON for the frontend
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
    reportedBy: issue.reportedBy ? { _id: issue.reportedBy.id, name: issue.reportedBy.name, avatar: issue.reportedBy.avatar } : issue.reported_by,
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

const socketService = require('../services/socketService');

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
    'Public Property Damage': 'Parks Authority' // Simple mapping
  };
  return map[category] || 'Other';
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

    if (!title || !description || !category || !severity || !location || !location.coordinates) {
      res.status(400);
      throw new Error('Please provide all required fields including location coordinates');
    }

    // Determine Appropriate Authority
    const department = categoryToDepartment(category);
    // Simple jurisdiction matching based on address for now.
    // In a real app, this would use PostGIS polygons.
    // Here we just look for an authority with the right department.
    let assignedAuthorityId = null;
    const { data: authorities } = await supabase
      .from('profiles')
      .select('id, jurisdiction')
      .eq('role', 'authority')
      .eq('verification_status', 'verified')
      .eq('is_active', true)
      .eq('department', department);

    if (authorities && authorities.length > 0) {
      // Find one whose jurisdiction matches the address, or just pick the first one
      const matched = authorities.find(a => location.address && location.address.toLowerCase().includes(a.jurisdiction.toLowerCase()));
      assignedAuthorityId = matched ? matched.id : authorities[0].id;
    }

    const { data: issue, error } = await supabase.from('issues').insert({
      title,
      description,
      category,
      severity,
      location: `SRID=4326;POINT(${location.coordinates[0]} ${location.coordinates[1]})`,
      lng: location.coordinates[0],
      lat: location.coordinates[1],
      address: location.address || '',
      reported_by: req.user.id,
      assigned_authority_id: assignedAuthorityId,
      ai_category: aiAnalysis?.category,
      ai_severity: aiAnalysis?.severity,
      ai_confidence: aiAnalysis?.confidence,
      ai_suggested_title: aiAnalysis?.suggestedTitle,
      ai_suggested_description: aiAnalysis?.suggestedDescription,
      ai_safety_impact: aiAnalysis?.safetyImpact
    }).select().single();

    if (error) throw new Error(error.message);

    if (images && images.length > 0) {
       const { error: imgError } = await supabase.from('issue_images').insert(
          images.map(img => ({ issue_id: issue.id, url: img.url, public_id: img.public_id }))
       );
       if (imgError) console.error('Image Insert Error:', imgError);
    }

    await supabase.from('issue_timeline').insert({
       issue_id: issue.id,
       status: 'Reported',
       user_id: req.user.id,
       note: 'Issue reported'
    });
    
    await logActivity('ISSUE_SUBMITTED', req.user.id, issue.id, { category, severity });

    // Send back formatted response
    issue.images = images || [];
    const formattedIssue = mapIssue(issue);
    
    // Real-time events
    socketService.emitToAll('issue:created', formattedIssue);
    
    if (assignedAuthorityId) {
      socketService.emitToUser(assignedAuthorityId, 'issue:assigned', formattedIssue);
      socketService.emitToUser(assignedAuthorityId, 'notification:authority', {
        type: 'NEW_ISSUE',
        issue: formattedIssue,
        message: `New issue assigned to you: ${title}`
      });
    } else {
      socketService.emitToAuthorities('notification:authority', {
        type: 'UNASSIGNED_ISSUE',
        issue: formattedIssue,
        message: `New unassigned issue reported: ${title}`
      });
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

    if (error) throw new Error(error.message);

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

    if (error) throw new Error(error.message);

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
    const { data, error } = await supabase
      .rpc('find_nearby_issues', {
        lon: coordinates[0],
        lat: coordinates[1],
        radius_meters: 100
      });
      
    if (error) throw new Error(error.message);

    // Filter by category and status
    const duplicates = data
      .filter(issue => issue.category === category && issue.status !== 'Resolved' && issue.status !== 'Closed')
      .slice(0, 3)
      .map(mapIssue);

    res.json(duplicates);
  } catch (error) {
    next(error);
  }
};

// @desc    Get queue for authority
// @route   GET /api/issues/queue
// @access  Private (Authority/Admin)
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

    // If user is authority, only show their assigned issues or unassigned
    if (req.user.role === 'authority') {
      query = query.or(`assigned_authority_id.eq.${req.user.id},assigned_authority_id.is.null`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    res.json(data.map(mapIssue));
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue status
// @route   PATCH /api/issues/:id/status
// @access  Private (Authority/Admin)
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

    const { error: updateError } = await supabase
      .from('issues')
      .update({ status })
      .eq('id', req.params.id);

    if (updateError) throw new Error(updateError.message);

    await supabase.from('issue_timeline').insert({
      issue_id: req.params.id,
      status,
      user_id: req.user.id,
      note: note || `Status updated to ${status}`
    });
    
    if (status === 'Resolved' || status === 'Closed') {
      await logActivity('ISSUE_VERIFIED', req.user.id, req.params.id, { status });
    }
    
    // Return the updated issue mapped
    const updatedIssue = mapIssue({ ...issue, status });
    
    // Real-time events
    socketService.emitToAll('issue:updated', updatedIssue);
    socketService.emitToUser(issue.reported_by, 'notification:citizen', {
      type: 'STATUS_UPDATED',
      issue: updatedIssue,
      message: `Your issue "${issue.title}" status changed to ${status}`
    });

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
