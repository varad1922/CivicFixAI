const { OAuth2Client } = require('google-auth-library');
const supabase = require('../config/supabase');
const { logActivity } = require('../services/activityService');
const { signToken } = require('../utils/tokenUtil');
const {
  isConnectivityError,
  findUserByEmail,
  findUserById,
  addUser,
  updateUser,
  verifyPassword
} = require('../utils/authFallbackStore');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || '147063810952-gdt7uun5266ab8v1ra8muumrh3395ed1.apps.googleusercontent.com'
);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role: requestedRole = 'citizen',
      department,
      jurisdiction,
      phone,
      gender
    } = req.body;
    const role = String(requestedRole).toLowerCase().trim();

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please add all required fields (name, email, password)');
    }

    // Email validation: must contain @ and have valid structure
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!trimmedEmail.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      res.status(400);
      throw new Error('A valid email address containing @ and domain is required');
    }

    // Phone number validation: exactly 10 digits compulsory
    const cleanedPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      res.status(400);
      throw new Error('Phone number must be exactly 10 digits');
    }

    // Gender validation: male, female, or other compulsory
    const normalizedGender = String(gender || '').toLowerCase().trim();
    if (!['male', 'female', 'other'].includes(normalizedGender)) {
      res.status(400);
      throw new Error('Please select a valid gender option (male, female, or other)');
    }

    if (role === 'authority') {
      if (!department || !jurisdiction) {
        res.status(400);
        throw new Error('Department and jurisdiction are required for authority registration');
      }
    }

    if (role === 'admin') {
      res.status(403);
      throw new Error('Cannot register as admin. Administrator accounts must be provisioned directly.');
    }

    if (role !== 'citizen' && role !== 'authority') {
      res.status(400);
      throw new Error('Invalid role specified. Only Citizen and Authority registrations are allowed.');
    }

    const verification_status = role === 'authority' ? 'pending' : 'verified';

    // 1. Try registering via Supabase Auth Admin
    let authData = null;
    let authError = null;
    let useFallback = false;

    try {
      const result = await supabase.auth.admin.createUser({
        email: trimmedEmail,
        password,
        email_confirm: true,
        user_metadata: { name, role, phone: cleanedPhone, gender: normalizedGender }
      });
      authData = result.data;
      authError = result.error;
    } catch (err) {
      if (isConnectivityError(err)) {
        useFallback = true;
      } else {
        res.status(400);
        throw err;
      }
    }

    if (authError) {
      if (isConnectivityError(authError)) {
        useFallback = true;
      } else {
        const errorMsg = authError.message || '';
        if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists')) {
          res.status(400);
          throw new Error('An account with this email address already exists. Please log in instead.');
        }
        res.status(400);
        throw new Error(errorMsg || 'Registration failed');
      }
    }

    // Fallback store when Supabase service is offline or paused
    if (useFallback) {
      const existing = findUserByEmail(trimmedEmail);
      if (existing) {
        res.status(400);
        throw new Error('An account with this email address already exists. Please log in instead.');
      }

      const newFallbackUser = addUser({
        name,
        email: trimmedEmail,
        password,
        role,
        department: role === 'authority' ? department : null,
        jurisdiction: role === 'authority' ? jurisdiction : null,
        verification_status,
        phone: cleanedPhone,
        gender: normalizedGender,
        is_active: true
      });

      if (role === 'authority') {
        res.status(403);
        throw new Error('Authority account created and submitted for admin verification. You can log in after approval.');
      }

      const token = signToken(newFallbackUser);
      return res.status(201).json({
        _id: newFallbackUser.id,
        name: newFallbackUser.name,
        email: newFallbackUser.email,
        role: newFallbackUser.role,
        avatar: newFallbackUser.avatar,
        verification_status: newFallbackUser.verification_status,
        department: newFallbackUser.department,
        jurisdiction: newFallbackUser.jurisdiction,
        token
      });
    }

    // Supabase success path: insert into profiles table
    const profileData = {
      id: authData.user.id,
      name,
      email: trimmedEmail,
      role,
      verification_status
    };

    if (role === 'authority') {
      profileData.department = department;
      profileData.jurisdiction = jurisdiction;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      res.status(400);
      throw new Error(profileError.message);
    }

    // Authority accounts require admin verification before login
    if (role === 'authority') {
      try {
        await logActivity('USER_REGISTERED', profile.id, null, { method: 'email', role });
      } catch (_) {}
      res.status(403);
      throw new Error('Authority account created and submitted for admin verification. You can log in after approval.');
    }

    // Citizen accounts: immediately sign in to get access token
    let sessionToken = null;
    try {
      const { data: sessionData } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });
      sessionToken = sessionData?.session?.access_token;
    } catch (_) {}

    if (!sessionToken) {
      sessionToken = signToken(profile);
    }

    try {
      await logActivity('USER_REGISTERED', profile.id, null, { method: 'email' });
    } catch (_) {}

    res.status(201).json({
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar,
      verification_status: profile.verification_status,
      department: profile.department,
      jurisdiction: profile.jurisdiction,
      token: sessionToken,
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
    const { email, password, requestedRole } = req.body;
    const normalizedRequestedRole = requestedRole ? String(requestedRole).toLowerCase() : null;

    if (normalizedRequestedRole && !['citizen', 'authority', 'admin'].includes(normalizedRequestedRole)) {
      res.status(400);
      throw new Error('Invalid login role selected');
    }

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Attempt Supabase Auth
    let supabaseUser = null;
    let supabaseSession = null;
    let isOffline = false;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error) {
        if (isConnectivityError(error)) {
          isOffline = true;
        } else {
          res.status(401);
          throw new Error('Invalid email or password');
        }
      } else if (data?.user && data?.session) {
        supabaseUser = data.user;
        supabaseSession = data.session;
      }
    } catch (err) {
      if (isConnectivityError(err)) {
        isOffline = true;
      } else {
        throw err;
      }
    }

    // 2. If Supabase is offline/paused, use resilient fallback credentials
    if (isOffline) {
      const fallbackUser = findUserByEmail(normalizedEmail);
      if (!fallbackUser) {
        res.status(503);
        throw new Error('Unable to reach the authentication service. Please check database connectivity or try again shortly.');
      }

      const isMatch = verifyPassword(password, fallbackUser.passwordHash);
      if (!isMatch) {
        res.status(401);
        throw new Error('Invalid email or password');
      }

      if (!fallbackUser.is_active) {
        res.status(401);
        throw new Error('Account is deactivated or not found');
      }

      if (normalizedRequestedRole && fallbackUser.role !== normalizedRequestedRole) {
        res.status(403);
        throw new Error(`Access denied. This account is registered as ${fallbackUser.role}.`);
      }

      if (fallbackUser.role === 'authority' && fallbackUser.verification_status === 'pending') {
        res.status(403);
        throw new Error('Your authority account is awaiting admin verification.');
      }
      if (fallbackUser.role === 'authority' && fallbackUser.verification_status === 'rejected') {
        res.status(403);
        throw new Error('Your authority account verification was rejected.');
      }
      if (fallbackUser.verification_status === 'suspended') {
        res.status(403);
        throw new Error('Your account is suspended.');
      }

      updateUser(fallbackUser.id, {
        last_login: new Date().toISOString(),
        last_active: new Date().toISOString()
      });

      const token = signToken(fallbackUser);

      return res.json({
        _id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        role: fallbackUser.role,
        avatar: fallbackUser.avatar,
        verification_status: fallbackUser.verification_status,
        department: fallbackUser.department,
        jurisdiction: fallbackUser.jurisdiction,
        token
      });
    }

    // 3. Supabase online: retrieve profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (profileErr || !profile || !profile.is_active) {
      res.status(401);
      throw new Error('Account is deactivated or not found');
    }

    if (normalizedRequestedRole && profile.role !== normalizedRequestedRole) {
      res.status(403);
      throw new Error(`Access denied. This account is registered as ${profile.role}.`);
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
    try {
      await supabase.from('profiles').update({
        last_login: new Date().toISOString(),
        last_active: new Date().toISOString()
      }).eq('id', profile.id);
    } catch (_) {}

    try {
      await logActivity('USER_LOGGED_IN', profile.id, null, { method: 'email' });
    } catch (_) {}

    res.json({
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar,
      verification_status: profile.verification_status,
      department: profile.department,
      jurisdiction: profile.jurisdiction,
      token: supabaseSession.access_token,
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
    const user = req.user;

    try {
      await supabase.from('profiles').update({
        last_active: new Date().toISOString()
      }).eq('id', user.id);
    } catch (_) {}

    res.json({
      _id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      verification_status: user.verification_status,
      phone: user.phone || '',
      city: user.city || '',
      department: user.department,
      jurisdiction: user.jurisdiction,
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

    const updateData = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;

    if (Object.keys(updateData).length > 0) {
      try {
        await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);
      } catch (_) {}
    }

    // Update in fallback store if present
    updateUser(user.id, {
      ...(name ? { name } : {}),
      ...(avatar ? { avatar } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(city !== undefined ? { city } : {})
    });

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
    const { token, requestedRole = 'citizen' } = req.body;
    const role = String(requestedRole).toLowerCase();

    if (!token) {
      res.status(400);
      throw new Error('Google authentication token is required');
    }
    if (!['citizen', 'authority', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Invalid login role selected');
    }

    // Step 1: Verify token with Google Auth Library
    let googleUser = null;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID || '147063810952-gdt7uun5266ab8v1ra8muumrh3395ed1.apps.googleusercontent.com'
      });
      const payload = ticket.getPayload();
      if (payload && payload.email) {
        googleUser = {
          id: payload.sub,
          email: payload.email.toLowerCase(),
          name: payload.name || payload.email.split('@')[0],
          avatar: payload.picture || '',
          email_verified: payload.email_verified
        };
      }
    } catch (gErr) {
      console.warn('Direct Google ID token verification notice:', gErr.message);
    }

    // Step 2: Try Supabase signInWithIdToken
    let supabaseSession = null;
    let profile = null;

    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token
      });

      if (!error && data?.user && data?.session) {
        supabaseSession = data.session;
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
        profile = p;
      }
    } catch (_) {}

    // Step 3: Handle profile resolution or creation
    const email = googleUser?.email || profile?.email;
    const name = googleUser?.name || profile?.name || 'Google User';
    const avatar = googleUser?.avatar || profile?.avatar || '';

    if (!email) {
      res.status(401);
      throw new Error('Google sign-in token could not be verified. Please ensure your Google Cloud OAuth Client is properly configured.');
    }

    // Check if user exists in fallback store or DB
    if (!profile) {
      const existingFallback = findUserByEmail(email);
      if (existingFallback) {
        profile = existingFallback;
      }
    }

    if (!profile) {
      if (role === 'admin') {
        res.status(403);
        throw new Error('Admin accounts must already exist and cannot be created through Google login.');
      }

      const verification_status = role === 'authority' ? 'pending' : 'verified';

      // Attempt Supabase insert
      try {
        const { data: newP, error: insertErr } = await supabase
          .from('profiles')
          .insert({
            name,
            email,
            avatar,
            auth_provider: 'google',
            role,
            verification_status,
            is_active: true
          })
          .select()
          .single();

        if (!insertErr && newP) {
          profile = newP;
        }
      } catch (_) {}

      // If Supabase insert failed or offline, save to fallback
      if (!profile) {
        profile = addUser({
          name,
          email,
          avatar,
          role,
          verification_status,
          auth_provider: 'google',
          is_active: true
        });
      }
    } else if (String(profile.role).toLowerCase() !== role) {
      res.status(403);
      throw new Error(`Access denied. This Google account is registered as ${profile.role}.`);
    }

    if (!profile.is_active || profile.verification_status === 'suspended') {
      res.status(403);
      throw new Error('Your account is inactive or suspended.');
    }
    if (profile.role === 'authority' && profile.verification_status === 'pending') {
      res.status(403);
      throw new Error('Your authority account is awaiting admin verification.');
    }
    if (profile.role === 'authority' && profile.verification_status === 'rejected') {
      res.status(403);
      throw new Error('Your authority account verification was rejected.');
    }

    const sessionToken = supabaseSession?.access_token || signToken(profile);

    try {
      await supabase.from('profiles').update({
        last_login: new Date().toISOString(),
        last_active: new Date().toISOString()
      }).eq('id', profile.id);
    } catch (_) {}

    try {
      await logActivity('USER_LOGGED_IN', profile.id, null, { method: 'google' });
    } catch (_) {}

    res.json({
      _id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      avatar: profile.avatar,
      verification_status: profile.verification_status,
      department: profile.department,
      jurisdiction: profile.jurisdiction,
      token: sessionToken
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
