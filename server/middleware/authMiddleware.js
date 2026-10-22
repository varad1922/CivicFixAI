const supabase = require('../config/supabase');
const { verifyToken } = require('../utils/tokenUtil');
const { findUserById, isConnectivityError } = require('../utils/authFallbackStore');

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return next(Object.assign(new Error('Not authorized, no token provided'), { statusCode: 401 }));
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return next(Object.assign(new Error('Not authorized, no token provided'), { statusCode: 401 }));
  }

  try {
    let profile = null;
    let authUser = null;

    // 1. First attempt verification via Supabase Auth
    try {
      const { data, error: authError } = await supabase.auth.getUser(token);
      if (!authError && data?.user) {
        authUser = data.user;
        const { data: p, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!pError && p) {
          profile = p;
        }
      }
    } catch (supabaseErr) {
      // Supabase is either paused, experiencing network error, or the token is a custom JWT
      if (!isConnectivityError(supabaseErr)) {
        console.debug('Supabase token verification bypassed:', supabaseErr.message);
      }
    }

    // 2. If Supabase did not resolve profile, verify via local JWT
    if (!profile) {
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          // Check Supabase profiles first if online
          try {
            const { data: p } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', decoded.id)
              .single();
            if (p) profile = p;
          } catch (_) {
            // Ignore Supabase connection error
          }

          // Fallback to in-memory store
          if (!profile) {
            const fallbackUser = findUserById(decoded.id);
            if (fallbackUser) {
              profile = { ...fallbackUser };
            } else {
              profile = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role || 'citizen',
                name: decoded.name || 'User',
                verification_status: 'verified',
                is_active: true
              };
            }
          }
        }
      } catch (jwtErr) {
        return next(Object.assign(new Error('Not authorized, session token is invalid or expired'), { statusCode: 401 }));
      }
    }

    if (!profile) {
      return next(Object.assign(new Error('Not authorized, user profile not found'), { statusCode: 401 }));
    }

    if (!profile.is_active || profile.verification_status === 'suspended') {
      return next(Object.assign(new Error('Account is deactivated or suspended. Please contact administrator.'), { statusCode: 403 }));
    }

    if (profile.role === 'authority' && profile.verification_status !== 'verified') {
      return next(Object.assign(new Error('Authority account is pending verification and cannot perform this action.'), { statusCode: 403 }));
    }

    req.user = {
      ...profile,
      role: String(profile.role || '').toLowerCase(),
      phone: authUser?.user_metadata?.phone || profile.phone || '',
      gender: authUser?.user_metadata?.gender || profile.gender || '',
      city: authUser?.user_metadata?.city || profile.city || '',
      _id: profile.id
    };

    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return next(Object.assign(new Error('Not authorized, token verification failed'), { statusCode: 401 }));
  }
};

const optionalProtect = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    let profile = null;

    try {
      const { data, error: authError } = await supabase.auth.getUser(token);
      if (!authError && data?.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (p) profile = p;
      }
    } catch (_) {}

    if (!profile) {
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          profile = findUserById(decoded.id) || {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            is_active: true
          };
        }
      } catch (_) {}
    }

    if (profile && profile.is_active && profile.verification_status !== 'suspended') {
      req.user = {
        ...profile,
        role: String(profile.role || '').toLowerCase(),
        _id: profile.id
      };
    } else {
      req.user = null;
    }

    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};

module.exports = { protect, optionalProtect };
