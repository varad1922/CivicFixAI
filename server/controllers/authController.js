const supabase = require('../config/supabase');
const { logActivity } = require('../services/activityService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'citizen', department, jurisdiction } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please add all fields (name, email, password)');
    }

    if (role === 'authority') {
      if (!department || !jurisdiction) {
        res.status(400);
        throw new Error('Department and jurisdiction are required for authority registration');
      }
    }

    if (role === 'admin') {
      res.status(403);
      throw new Error('Cannot register as admin');
    }
    
    if (role !== 'citizen' && role !== 'authority') {
      res.status(400);
      throw new Error('Invalid role specified');
    }

    const verification_status = role === 'authority' ? 'pending' : 'verified';

    // Create user via admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (authError) {
      res.status(400);
      throw new Error(authError.message);
    }

    const profileData = {
      id: authData.user.id,
      name,
      email: email.toLowerCase(),
      role,
      verification_status
    };

    if (role === 'authority') {
      profileData.department = department;
      profileData.jurisdiction = jurisdiction;
    }

    // Insert into profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      res.status(400);
      throw new Error(profileError.message);
    }

    // Now sign in to get token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (sessionError) {
      res.status(400);
      throw new Error(sessionError.message);
    }

    await logActivity('USER_REGISTERED', profile.id, null, { method: 'email' });

    res.status(201).json({
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar,
      verification_status: profile.verification_status,
      department: profile.department,
      jurisdiction: profile.jurisdiction,
      token: sessionData.session.access_token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (error) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile || !profile.is_active) {
      res.status(401);
      throw new Error('Account is deactivated or not found');
    }

    // Check authority verification
    if (profile.role === 'authority' && profile.verification_status === 'pending') {
      res.status(403);
      throw new Error('Your authority account is awaiting admin verification.');
    }
    if (profile.role === 'authority' && profile.verification_status === 'rejected') {
      res.status(403);
      throw new Error('Your authority account verification was rejected.');
    }
    if (profile.verification_status === 'suspended') {
      res.status(403);
      throw new Error('Your account is suspended.');
    }

    // Update lastLogin tracking
    await supabase.from('profiles').update({
       last_login: new Date().toISOString(),
       last_active: new Date().toISOString()
    }).eq('id', profile.id);

    await logActivity('USER_LOGGED_IN', profile.id, null, { method: 'email' });

    res.json({
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar,
      verification_status: profile.verification_status,
      token: data.session.access_token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user is set in authMiddleware and contains the Supabase profile
    const user = req.user;

    // Update last active on any protected request
    await supabase.from('profiles').update({
       last_active: new Date().toISOString()
    }).eq('id', user.id);

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      verification_status: user.verification_status,
      phone: user.phone || '',
      city: user.city || '',
      created_at: user.created_at
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, city, avatar } = req.body;
    const user = req.user;

    // Update basic fields in profiles table
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;

    if (Object.keys(updateData).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (profileError) {
        res.status(400);
        throw new Error(profileError.message);
      }
    }

    // Update metadata (phone, city) in auth.users
    const metadataUpdate = {};
    if (phone !== undefined) metadataUpdate.phone = phone;
    if (city !== undefined) metadataUpdate.city = city;

    if (Object.keys(metadataUpdate).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: metadataUpdate
      });
      
      if (authError) {
        res.status(400);
        throw new Error(authError.message);
      }
    }

    res.json({
      _id: user.id,
      name: name || user.name,
      email: user.email,
      role: user.role,
      avatar: avatar || user.avatar,
      phone: phone !== undefined ? phone : user.phone,
      city: city !== undefined ? city : user.city
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400);
      throw new Error('Google token is required');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token
    });

    if (error) {
      res.status(401);
      throw new Error(error.message);
    }

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      const { user } = data;
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
           id: user.id,
           name: user.user_metadata.full_name || 'Google User',
           email: user.email,
           avatar: user.user_metadata.avatar_url || '',
           auth_provider: 'google'
        })
        .select()
        .single();
        
      if (profileError) {
        res.status(400);
        throw new Error(profileError.message);
      }
      profile = newProfile;
      await logActivity('USER_REGISTERED', profile.id, null, { method: 'google' });
    }

    if (!profile.is_active) {
      res.status(401);
      throw new Error('Account is deactivated');
    }

    await supabase.from('profiles').update({
       last_login: new Date().toISOString(),
       last_active: new Date().toISOString()
    }).eq('id', profile.id);

    await logActivity('USER_LOGGED_IN', profile.id, null, { method: 'google' });

    res.json({
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar,
      verification_status: profile.verification_status,
      token: data.session.access_token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleAuth,
  updateProfile
};
