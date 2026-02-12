// Test logger initialization
try {
    console.log('Testing logger imports...');
    const { logger, requestLogger, securityLogger } = require('./middleware/logger');
    
    console.log('✓ Logger imported successfully');
    
    // Test basic logging
    logger.info('Test log message');
    console.log('✓ Basic logging works');
    
    // Test security logging
    securityLogger.loginAttempt('test@example.com', true, '127.0.0.1', 'test-agent');
    console.log('✓ Security logging works');
    
    console.log('All logger tests passed!');
    
} catch (error) {
    console.error('Logger test failed:', error.message);
    console.error('Stack:', error.stack);
}
