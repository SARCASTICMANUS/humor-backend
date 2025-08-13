import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

// Connect to DB
connectDB();

const app = express();
const PORT = process.env.PORT;

// CORS configuration (removed trailing slash in origin)
app.use(cors({
  origin: ['https://humor-frontend.vercel.app'],
  credentials: true
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Humor Backend API is running!',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: 'connected' // You can later add actual DB status check here
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Humor Backend Server is running!`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Using default (insecure)'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/signup');
  console.log('  GET  /api/posts');
  console.log('  GET  /api/notifications');
  console.log('  GET  /api/notifications/unread-count');
  console.log('');
});
