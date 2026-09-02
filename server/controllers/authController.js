const supabase = require('../config/supabase');
const { logActivity } = require('../services/activityService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please add all fields (name, email, password)');
    }

    // Create user via admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      res.status(400);
      throw new Error(authError.message);
    }

    // Insert into profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
         id: authData.user.id,
         name,
         email: email.toLowerCase()
      })
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
};
