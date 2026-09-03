const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({
  path: path.join(__dirname, '.env'),
});

const { errorHandler } = require('./middleware/errorMiddleware');
const { initSocket } = require('./services/socketService');

const app = express();
const server = http.createServer(app);



// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Basic Route
app.get('/', (req, res) => {
  res.send('CivicFix AI API is running...');
});

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0)`);
});