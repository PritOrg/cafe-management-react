// Test each route file individually to find the issue
try {
    console.log('Testing auth routes...');
    const authRoutes = require('./routes/auth');
    console.log('✓ Auth routes loaded successfully');
    
    console.log('Testing customer routes...');
    const customerRoutes = require('./routes/customers');
    console.log('✓ Customer routes loaded successfully');
    
    console.log('Testing staff routes...');
    const staffRoutes = require('./routes/staff');
    console.log('✓ Staff routes loaded successfully');
    
    console.log('Testing order routes...');
    const orderRoutes = require('./routes/orders');
    console.log('✓ Order routes loaded successfully');
    
    console.log('Testing menu routes...');
    const menuRoutes = require('./routes/menu');
    console.log('✓ Menu routes loaded successfully');
    
    console.log('All route files loaded successfully!');
    
} catch (error) {
    console.error('Route loading error:', error.message);
    console.error('Stack:', error.stack);
}
