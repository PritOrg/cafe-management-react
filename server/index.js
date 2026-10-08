require('node:dns').setDefaultResultOrder('ipv4first');
const net = require('node:net');
if (typeof net.setDefaultAutoSelectFamily === 'function') {
    net.setDefaultAutoSelectFamily(false);
}
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // security headers
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const compression = require('compression');
const { getDb } = require('./db/pool');

// Import middleware
const { globalErrorHandler, handleNotFound, handleUncaughtException, handleUnhandledRejection, handleSigterm } = require('./middleware/errorHandler');
const { requestLogger, logger } = require('./middleware/logger');
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

// CORS configuration — dynamic origins: configured + *.localhost + registered domain suffixes
const corsAllowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const publicDomain = (process.env.PUBLIC_DOMAIN || '').toLowerCase();

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (corsAllowedOrigins.includes(origin)) return true;
    try {
        const url = new URL(origin);
        const host = url.hostname.toLowerCase();
        if (host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1') return true;
        if (publicDomain && (host === publicDomain || host.endsWith(`.${publicDomain}`))) return true;
    } catch {
        /* ignore malformed origin */
    }
    return false;
};

const corsOptions = {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Response-Time'],
};

// Request ID first — every response carries X-Request-Id for client/server correlation
const { requestId } = require('./middleware/requestId');
app.use(requestId);

app.use(cors(corsOptions));
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // built-in body parser for JSON with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // for form data with size limit

// Enhanced middleware
app.use(attachApiResponse); // Attach enhanced API response utilities
app.use(responseTimeTracker); // Track response times
app.use(trackRequestMetrics); // Track request metrics for health monitoring

// Structured access logs (request + response with requestId, user, tenant)
app.use(requestLogger);

// API version prefix — all product endpoints live under /api/v1
const API_PREFIX = '/api/v1';

// Rate limiting for all API routes
app.use(API_PREFIX, generalRateLimiter);

// Tenant resolution (subdomain slug → req.tenant / req.tenantId)
const { resolveTenant } = require('./middleware/tenant');
app.use(API_PREFIX, resolveTenant);

// Local storage driver serves uploads statically
const { resolveStorageDriver } = require('./utils/storage');
if (resolveStorageDriver() === 'local') {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// API Documentation
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// API Routes (v1)
const tenantRoutes = require('./routes/tenants');
const settingsRoutes = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');
const invoicesRoutes = require('./routes/invoices');
const inventoryRoutes = require('./routes/inventory');
const categoriesRoutes = require('./routes/categories');
const modifiersRoutes = require('./routes/modifiers');
const kitchenRoutes = require('./routes/kitchen');
const discountsRoutes = require('./routes/discounts');
const activityRoutes = require('./routes/activity');
app.use(`${API_PREFIX}/tenants`, tenantRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/invoices`, invoicesRoutes);
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/categories`, categoriesRoutes);
app.use(`${API_PREFIX}/modifiers`, modifiersRoutes);
app.use(`${API_PREFIX}/kitchen`, kitchenRoutes);
app.use(`${API_PREFIX}/discounts`, discountsRoutes);
app.use(`${API_PREFIX}/activity`, activityRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/staff-admin`, staffAdminRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/menu`, menuItemsRoutes);

// Enhanced health check endpoints (unversioned — infra)
app.get('/health', healthCheckHandler);
app.get(`${API_PREFIX}/health`, healthCheckHandler);
app.get('/metrics', metricsHandler);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Cafe Management System API',
    apiVersion: 'v1',
    endpoints: {
      api: API_PREFIX,
      docs: `${API_PREFIX}/docs`,
      health: '/health',
    },
    timestamp: new Date().toISOString(),
  });
});

// Handle 404 for unmatched routes
app.all('*', handleNotFound);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Postgres (Knex) connection & server start
const PORT = process.env.PORT || 4969;

getDb().raw('SELECT 1')
  .then(async () => {
    const pool = getDb().client.pool;
    const dbLabel = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    console.log('');
    console.log('──────────────────────────────────────────────');
    console.log(' Cafe API — Postgres connected');
    console.log(`   mode:  ${dbLabel}`);
    console.log(`   pool:  ${pool && typeof pool.numUsed === 'function' ? pool.numUsed() : 0} active`);
    console.log('──────────────────────────────────────────────');

    const server = app.listen(PORT, () => {
      const addr = server.address();
      const boundPort = typeof addr === 'object' && addr ? addr.port : PORT;
      console.log('');
      console.log('══════════════════════════════════════════════');
      console.log(` ✅  Cafe API listening on http://localhost:${boundPort}`);
      console.log(`     Health:  http://localhost:${boundPort}/health`);
      console.log(`     API v1:  http://localhost:${boundPort}${API_PREFIX}`);
      console.log(`     Docs:    http://localhost:${boundPort}${API_PREFIX}/docs`);
      console.log('══════════════════════════════════════════════');
      console.log('');
      logger.info('Server started successfully', {
        port: boundPort,
        apiPrefix: API_PREFIX,
        environment: process.env.NODE_ENV || 'development',
      });
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error.message);
      logger.error('Server error', { error: error.message, stack: error.stack });
    });

    handleUnhandledRejection(server);
    handleSigterm(server);

    module.exports = { app, server };
  })
  .catch((err) => {
    console.error('');
    console.error('❌ Postgres connection failed:', err.message);
    console.error('   Check DATABASE_URL / DB_URI and that the database is reachable.');
    console.error('');
    logger.error('Postgres connection failed', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
