const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return next(Object.assign(new Error('Not authorized, no token'), { statusCode: 401 }));
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    return next(Object.assign(new Error('Not authorized, no token'), { statusCode: 401 }));
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return next(Object.assign(new Error('Not authorized, token failed'), { statusCode: 401 }));
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return next(Object.assign(new Error('Not authorized, profile not found'), { statusCode: 401 }));
    }

    if (!profile.is_active || profile.verification_status === 'suspended' || (profile.role === 'authority' && profile.verification_status !== 'verified')) {
      return next(Object.assign(new Error('Not authorized, account is inactive or not verified'), { statusCode: 401 }));
    }

    req.user = {
      ...profile,
      role: String(profile.role || '').toLowerCase(),
      phone: user.user_metadata?.phone || '',
      city: user.user_metadata?.city || '',
      _id: profile.id
    };

    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return next(Object.assign(new Error('Not authorized, token failed'), { statusCode: 401 }));
  }
};

module.exports = { protect };
