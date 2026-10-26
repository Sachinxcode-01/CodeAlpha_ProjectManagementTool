require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const initDb = require('./src/models/initDb');

// Ensure database schema is initialized
initDb();

const app = express();
const PORT = process.env.PORT || 3000;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets
app.use(express.static(path.join(__dirname, 'public')));

// Public Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TaskFlow API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// API Routers
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/projects', require('./src/routes/projectRoutes'));
app.use('/api', require('./src/routes/taskRoutes'));
app.use('/api', require('./src/routes/commentRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));

// Fallback to SPA index.html for browser routes (excluding /api)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public/index.html'));
  }
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found.' });
  }
  next();
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 TaskFlow Server active at http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});

module.exports = app;
