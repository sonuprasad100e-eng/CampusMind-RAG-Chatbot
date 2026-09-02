const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const documentRoutes = require('./routes/documentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

// Security and utility middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(compression());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded documents & complaints
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/documents', express.static(env.UPLOAD_DIR));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CampusMind API & RAG Engine',
    version: '1.0.0',
    providers: {
      openrouter: !!env.OPENROUTER_API_KEY,
      openai: !!env.OPENAI_API_KEY,
      gemini: !!env.GEMINI_API_KEY,
      offlineFallback: true,
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin/documents', documentRoutes);
app.use('/api/admin/analytics', analyticsRoutes);

// 404 Handler for undefined routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server.`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();

  httpServer.listen(env.PORT, () => {
    console.log(`=========================================`);
    console.log(` ðŸŽ“ CampusMind Backend Server Running `);
    console.log(` Port: ${env.PORT} | Environment: ${env.NODE_ENV}`);
    console.log(` API Endpoint: http://localhost:${env.PORT}/api`);
    console.log(` Client URL: ${env.CLIENT_URL}`);
    console.log(`=========================================`);
  });
};

startServer();

module.exports = { app, httpServer };
