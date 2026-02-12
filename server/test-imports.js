// Test imports to find the issue
try {
    console.log('Testing auth controller imports...');
    const authController = require('./controllers/authController');
    console.log('Auth controller exports:', Object.keys(authController));
    
    console.log('Testing middleware imports...');
    const middleware = require('./middleware/auth');
    console.log('Middleware exports:', Object.keys(middleware));
    
    console.log('Testing routes imports...');
    const authRoutes = require('./routes/auth');
    console.log('Auth routes loaded successfully');
    
} catch (error) {
    console.error('Import error:', error.message);
    console.error('Stack:', error.stack);
}
