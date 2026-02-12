require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI);

const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log('✓ MongoDB connected successfully');
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    console.log('Database:', mongoose.connection.name);
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Set a timeout to prevent hanging
setTimeout(() => {
  console.log('Connection timeout - exiting');
  process.exit(1);
}, 10000);
