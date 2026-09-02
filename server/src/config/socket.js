const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

let ioInstance = null;

const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // Allow unauthenticated connection for guest info or let it proceed with guest id
      socket.user = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.warn('[Socket] Invalid token in handshake:', err.message);
      socket.user = null;
      next();
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.user ? socket.user.email : 'Guest'})`);

    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      if (socket.user.role === 'admin') {
        socket.join('admin-room');
      }
    }

    socket.on('join:conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
        console.log(`[Socket] ${socket.id} joined conversation:${conversationId}`);
      }
    });

    socket.on('leave:conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized! Call initSocket first.');
  }
  return ioInstance;
};

module.exports = { initSocket, getIO };
