require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan'); // logging middleware
const helmet = require('helmet'); // security headers
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

// Swagger setup
const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }', // hide top bar
};

// Routes imports
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const staffAdminRoutes = require('./routes/staff');
const orderRoutes = require('./routes/orders');
const menuItemsRoutes = require('./routes/menu');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json()); // built-in body parser for JSON
app.use(express.urlencoded({ extended: true })); // for form data
app.use(morgan('dev')); // log requests

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument,options=swaggerOptions));

// Routes mount
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff-admin', staffAdminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuItemsRoutes);

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// MongoDB connection & server start
const PORT = process.env.PORT || 4969;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app; // for testing purposes if needed
