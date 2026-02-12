// Test server imports to find the issue
try {
    console.log('Testing error handler imports...');
    const errorHandler = require('./middleware/errorHandler');
    console.log('Error handler exports:', Object.keys(errorHandler));
    
    console.log('Testing logger imports...');
    const logger = require('./middleware/logger');
    console.log('Logger exports:', Object.keys(logger));
    
    console.log('Testing auth middleware imports...');
    const authMiddleware = require('./middleware/auth');
    console.log('Auth middleware exports:', Object.keys(authMiddleware));
    
    console.log('All imports successful!');
    
} catch (error) {
    console.error('Import error:', error.message);
    console.error('Stack:', error.stack);
}
