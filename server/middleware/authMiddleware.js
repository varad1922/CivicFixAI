const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new Error('Not authorized, token failed');
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!profile) {
        res.status(401);
        throw new Error('Not authorized, profile not found');
      }
      
      if (!profile.is_active) {
        res.status(401);
        throw new Error('Not authorized, account is inactive');
      }

      // Merge user_metadata phone and city if they exist
      req.user = { 
        ...profile, 
        phone: user.user_metadata?.phone || '', 
        city: user.user_metadata?.city || '' 
      };
      
      // We map _id to id for backward compatibility
      req.user._id = profile.id;

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

module.exports = { protect };
