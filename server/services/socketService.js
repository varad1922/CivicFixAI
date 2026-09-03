const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      
      // Verify with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(actualToken);
      
      if (error || !user) {
        return next(new Error('Authentication error: Invalid token'));
      }
      
      // Fetch profile to get role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!profile) {
        return next(new Error('Authentication error: Profile not found'));
      }
      if (!profile.is_active || profile.verification_status === 'suspended') {
        return next(new Error('Authentication error: Account is inactive or suspended'));
      }
      if (profile.role === 'authority' && profile.verification_status !== 'verified') {
        return next(new Error('Authentication error: Authority account is not verified'));
      }
      
      socket.user = profile;
      next();
    } catch (err) {
      next(new Error('Authentication error: Internal server error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user.id}, Role: ${socket.user.role})`);
    
    // Join a personal room
    socket.join(`user:${socket.user.id}`);
    
    // Join role-based room
    if (socket.user.role === 'authority') {
      socket.join('authority');
      // Could also join specific region or department room
    } else if (socket.user.role === 'admin') {
      socket.join('admin');
    }
    
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
    
    // Allow users to explicitly subscribe to specific issues
    socket.on('subscribe_issue', (issueId) => {
      socket.join(`issue:${issueId}`);
      console.log(`User ${socket.user.id} subscribed to issue ${issueId}`);
    });
    
    socket.on('unsubscribe_issue', (issueId) => {
      socket.leave(`issue:${issueId}`);
      console.log(`User ${socket.user.id} unsubscribed from issue ${issueId}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Emit event helper functions
const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

const emitToAuthorities = (event, data) => {
  if (io) io.to('authority').emit(event, data);
};

const emitToAdmins = (event, data) => {
  if (io) io.to('admin').emit(event, data);
};

const emitToIssueSubscribers = (issueId, event, data) => {
  if (io) io.to(`issue:${issueId}`).emit(event, data);
};

const emitToAll = (event, data) => {
  if (io) io.emit(event, data);
};

module.exports = {
  initSocket,
  getIo,
  emitToUser,
  emitToAuthorities,
  emitToAdmins,
  emitToIssueSubscribers,
  emitToAll
};
