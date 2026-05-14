const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const http = require('http');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Middleware & Security
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Configure CORS properly at the very top of the middleware stack
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://172.16.0.2:3000',
      'https://eduvisionai.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow requests with:
    // 1. No origin (mobile apps, curl, server-to-server)
    // 2. Explicitly allowed list
    // 3. LocalTunnel subdomains
    // 4. Ngrok subdomains
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      origin.endsWith('.loca.lt') || 
      origin.includes('ngrok-free.app') ||
      origin.includes('ngrok.io')
    ) {
      callback(null, true);
    } else {
      console.error(`❌ CORS Refused: Origin ${origin} is not allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Use Helmet for security headers
app.use(helmet());

// Body parsing MUST come before sanitization
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitize data against NoSQL injection (Disabled due to Express 5 compatibility crash)
// app.use(mongoSanitize());

// Prevent XSS attacks (Disabled due to Express 5 compatibility crash)
// app.use(xss());

// Use Compression to reduce payload size by 70-80%
app.use(compression());

// Global Rate Limiting to prevent DDoS and API abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for heavy video uploads
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

const rooms = new Map();
const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: new Set(), videoState: null });
    }
    const room = rooms.get(roomId);
    room.users.add(username);
    socket.roomId = roomId;
    socket.username = username;
    
    io.to(roomId).emit('room-update', Array.from(room.users));
    socket.to(roomId).emit('user-joined', { username });
    if (room.videoState) {
      socket.emit('video-sync', room.videoState);
    }
  });

  socket.on('room-chat', (data) => {
    io.to(data.roomId).emit('room-message', data);
  });

  socket.on('video-play', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.videoState = { isPlaying: true, currentTime, timestamp: Date.now() };
      socket.to(roomId).emit('video-sync', room.videoState);
    }
  });

  socket.on('video-pause', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.videoState = { isPlaying: false, currentTime, timestamp: Date.now() };
      socket.to(roomId).emit('video-sync', room.videoState);
    }
  });

  socket.on('video-seek', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.videoState = { isPlaying: room.videoState?.isPlaying || false, currentTime, timestamp: Date.now() };
      socket.to(roomId).emit('video-sync', room.videoState);
    }
  });

  socket.on('room-tab-change', ({ roomId, tab }) => {
    const room = rooms.get(roomId);
    if (room) {
      if(!room.videoState) room.videoState = {};
      room.videoState.activeTab = tab;
      socket.to(roomId).emit('room-tab-changed', { tab });
    }
  });

  socket.on('leave-room', ({ roomId, username }) => {
    socket.leave(roomId);
    const room = rooms.get(roomId);
    if (room) {
      room.users.delete(username);
      if (room.users.size === 0) {
        rooms.delete(roomId);
      } else {
        io.to(roomId).emit('room-update', Array.from(room.users));
        socket.to(roomId).emit('user-left', { username });
      }
    }
  });

  socket.on('register', (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
  });

  socket.on('send-invite', ({ toUserId, roomId, videoTitle, fromUsername }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive-invite', { roomId, videoTitle, fromUsername });
    }
  });

  socket.on('disconnect', () => {
    // Remove from global map if registered
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
    }

    if (socket.roomId && socket.username) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.users.delete(socket.username);
        if (room.users.size === 0) {
          rooms.delete(socket.roomId);
        } else {
          io.to(socket.roomId).emit('room-update', Array.from(room.users));
          socket.to(socket.roomId).emit('user-left', { username: socket.username });
        }
      }
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'EduVisionAI API is running!'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully!');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`
    🚀 ================================ 🚀
      EduVisionAI Server is Running!
      Port: ${PORT}
      Environment: ${process.env.NODE_ENV}
      URL: http://localhost:${PORT}
      Socket.io: ${io ? 'Enabled' : 'Disabled'}
    🚀 ================================ 🚀
    `);
  });
};

startServer();

module.exports = app;