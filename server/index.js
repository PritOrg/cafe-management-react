const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
// Import customer routes
const customerRoutes = require('./routes/customerRoutes');
const staffAdminRoutes = require('./routes/staffAdminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const menuItemsRoutes = require('./routes/menuItemRotes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors(
    { origin: '*', }
));

// Routes
app.use('/customer', customerRoutes);
app.use('/staff-admin', staffAdminRoutes);
app.use('/order', orderRoutes);
app.use('/menu',menuItemsRoutes)


// MongoDB connection
mongoose.connect('mongodb://localhost:27017/cafe-management')
    .then(() => {
        console.log('MongoDB connected');
        // Start the server after successfully connecting to MongoDB
        const PORT = process.env.PORT || 4969;
        app.listen(PORT, () => {
            console.log(`Server started http://localhost:${PORT}/`);
        });
    })
    .catch(err => console.error('MongoDB connection error:', err));
