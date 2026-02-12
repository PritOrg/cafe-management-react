require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan'); // logging middleware
const helmet = require('helmet'); // security headers
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const compression = require('compression');

// Import middleware
const { globalErrorHandler, handleNotFound, handleUncaughtException, handleUnhandledRejection, handleSigterm } = require('./middleware/errorHandler');
const { requestLogger, logger, securityLogger } = require('./middleware/logger');
const { generalRateLimiter } = require('./middleware/auth');
const { attachApiResponse, responseTimeTracker } = require('./middleware/apiResponse');
const { trackRequestMetrics, healthCheckHandler, metricsHandler } = require('./middleware/healthMonitor');

// Handle uncaught exceptions before anything else
handleUncaughtException();

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Enhanced Swagger setup
const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }', // hide top bar
  customSiteTitle: 'Cafe Management System API',
  swaggerOptions: {
    persistAuthorization: true,
  }
};

// Routes imports
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const staffAdminRoutes = require('./routes/staff');
const orderRoutes = require('./routes/orders');
const menuItemsRoutes = require('./routes/menu');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : ['http://localhost:3000','http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // built-in body parser for JSON with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // for form data with size limit

// Enhanced middleware
app.use(attachApiResponse); // Attach enhanced API response utilities
app.use(responseTimeTracker); // Track response times
app.use(trackRequestMetrics); // Track request metrics for health monitoring

// Custom logging middleware
app.use(requestLogger);

// Morgan for additional HTTP logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting for all API routes
app.use('/api/', generalRateLimiter);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff-admin', staffAdminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuItemsRoutes);

// Enhanced health check endpoints
app.get('/health', healthCheckHandler);
app.get('/metrics', metricsHandler);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Cafe Management System API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 for unmatched routes
app.all('*', handleNotFound);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// MongoDB connection & server start
const PORT = process.env.PORT || 4969;

// Enhanced MongoDB connection with options
const mongoOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// Database connection with enhanced error handling
mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name
    });

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`,
        docs: `http://localhost:${PORT}/api/docs`
      });
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('Server error', { error: error.message, stack: error.stack });
    });

    // Graceful shutdown handlers
    handleUnhandledRejection(server);
    handleSigterm(server);

    // Export server for testing
    module.exports = { app, server };
  })
  .catch((err) => {
    logger.error('MongoDB connection failed', {
      error: err.message,
      stack: err.stack
    });
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    logger.info('Mongoose connection closed due to app termination');
    process.exit(0);
  });
});
