const jwt = require('jsonwebtoken');

const signToken = (user) => {
  const secret = process.env.JWT_SECRET || 'civicfix_super_secure_jwt_secret_2026_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';

  return jwt.sign(
    {
      id: user.id || user._id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn }
  );
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'civicfix_super_secure_jwt_secret_2026_production';
  return jwt.verify(token, secret);
};

module.exports = { signToken, verifyToken };
