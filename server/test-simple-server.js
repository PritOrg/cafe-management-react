require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 4970; // Use different port for testing

// Simple middleware
app.use(express.json());

// Simple route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// MongoDB connection
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

console.log('Starting simple server...');

mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log('✓ MongoDB connected successfully');
    
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running at http://localhost:${PORT}/`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
    });
    
  })
  .catch((err) => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });
