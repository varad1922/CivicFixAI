const bcrypt = require('bcryptjs');

// Pre-hashed passwords for default accounts ('Citizen@123', 'Authority@123', 'Admin@123')
const salt = bcrypt.genSaltSync(10);
const citizenHash = bcrypt.hashSync('Citizen@123', salt);
const authorityHash = bcrypt.hashSync('Authority@123', salt);
const adminHash = bcrypt.hashSync('Admin@123', salt);

// In-memory persistent store for development & fallback resilience
const users = [
  {
    id: 'usr-citizen-default-01',
    name: 'Rahul Deshmukh',
    email: 'citizen@civicfix.org',
    passwordHash: citizenHash,
    role: 'citizen',
    verification_status: 'verified',
    is_active: true,
    phone: '9876543210',
    gender: 'male',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    auth_provider: 'email',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'usr-authority-default-02',
    name: 'Pooja Kulkarni',
    email: 'authority@civicfix.org',
    passwordHash: authorityHash,
    role: 'authority',
    department: 'Road Authority',
    jurisdiction: 'Pune Central',
    verification_status: 'verified',
    is_active: true,
    phone: '9876543211',
    gender: 'female',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    auth_provider: 'email',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: 'usr-authority-pending-03',
    name: 'Vikram Patil',
    email: 'pending.authority@civicfix.org',
    passwordHash: authorityHash,
    role: 'authority',
    department: 'Sanitation Authority',
    jurisdiction: 'Pune West',
    verification_status: 'pending',
    is_active: true,
    phone: '9876543215',
    gender: 'male',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200',
    auth_provider: 'email',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'usr-admin-default-04',
    name: 'Varad Admin',
    email: 'admin@civicfix.org',
    passwordHash: adminHash,
    role: 'admin',
    verification_status: 'verified',
    is_active: true,
    phone: '9876543212',
    gender: 'other',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    auth_provider: 'email',
    created_at: new Date(Date.now() - 86400000 * 60).toISOString()
  }
];

const isConnectivityError = (err) => {
  if (!err) return false;
  const msg = String(err.message || err || '').toLowerCase();
  const code = String(err.code || '').toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') ||
    msg.includes('network') ||
    msg.includes('connection refused') ||
    code === 'econnrefused' ||
    code === 'etimedout' ||
    code === 'enotfound'
  );
};

const findUserByEmail = (email) => {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  return users.find(u => u.email.toLowerCase() === normalized) || null;
};

const findUserById = (id) => {
  if (!id) return null;
  return users.find(u => u.id === id) || null;
};

const addUser = (userData) => {
  const existing = findUserByEmail(userData.email);
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const id = userData.id || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const passwordHash = userData.password ? bcrypt.hashSync(userData.password, 10) : null;

  const newUser = {
    id,
    name: userData.name,
    email: userData.email.toLowerCase().trim(),
    passwordHash,
    role: userData.role || 'citizen',
    department: userData.department || null,
    jurisdiction: userData.jurisdiction || null,
    verification_status: userData.verification_status || 'verified',
    is_active: userData.is_active !== undefined ? userData.is_active : true,
    phone: userData.phone || '',
    gender: userData.gender || 'other',
    avatar: userData.avatar || '',
    auth_provider: userData.auth_provider || 'email',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    last_active: new Date().toISOString()
  };

  users.push(newUser);
  return newUser;
};

const updateUser = (id, updates) => {
  const user = findUserById(id);
  if (!user) return null;

  Object.assign(user, updates);
  return user;
};

const getAllUsers = () => {
  return [...users];
};

const verifyPassword = (password, passwordHash) => {
  if (!password || !passwordHash) return false;
  return bcrypt.compareSync(password, passwordHash);
};

module.exports = {
  isConnectivityError,
  findUserByEmail,
  findUserById,
  addUser,
  updateUser,
  getAllUsers,
  verifyPassword
};
