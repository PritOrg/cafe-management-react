const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Create log file paths
const getLogFilePath = (level) => {
    const date = new Date().toISOString().split('T')[0];
    return path.join(logsDir, `${level.toLowerCase()}-${date}.log`);
};

// Format log message
const formatLogMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...meta
    };
    return JSON.stringify(logEntry) + '\n';
};

// Write log to file
const writeLog = (level, message, meta = {}) => {
    try {
        const logFilePath = getLogFilePath(level);
        const logMessage = formatLogMessage(level, message, meta);
        
        fs.appendFileSync(logFilePath, logMessage);
        
        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${level}] ${message}`, meta);
        }
    } catch (error) {
        console.error('Failed to write log:', error);
    }
};

// Logger object with different log levels
const logger = {
    error: (message, meta = {}) => writeLog(LOG_LEVELS.ERROR, message, meta),
    warn: (message, meta = {}) => writeLog(LOG_LEVELS.WARN, message, meta),
    info: (message, meta = {}) => writeLog(LOG_LEVELS.INFO, message, meta),
    debug: (message, meta = {}) => writeLog(LOG_LEVELS.DEBUG, message, meta)
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    logger.info('Incoming request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        userId: req.userId || 'anonymous'
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const duration = Date.now() - startTime;
        
        // Log response
        logger.info('Outgoing response', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength: res.get('Content-Length'),
            userId: req.userId || 'anonymous'
        });
        
        // Call original end method
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

// Security event logger
const securityLogger = {
    loginAttempt: (email, success, ip, userAgent) => {
        logger.info('Login attempt', {
            email,
            success,
            ip,
            userAgent,
            type: 'SECURITY_EVENT'
        });
    },
    
    loginSuccess: (userId, email, ip, userAgent) => {
        logger.info('Login successful', {
            userId,
            email,
            ip,
            userAgent,
            type: 'SECURITY_EVENT'
        });
    },
    
    loginFailure: (email, reason, ip, userAgent) => {
        logger.warn('Login failed', {
            email,
            reason,
            ip,
            userAgent,
            type: 'SECURITY_EVENT'
        });
    },
    
    unauthorizedAccess: (userId, resource, ip, userAgent) => {
        logger.warn('Unauthorized access attempt', {
            userId,
            resource,
            ip,
            userAgent,
            type: 'SECURITY_EVENT'
        });
    },
    
    rateLimitExceeded: (ip, endpoint, userAgent) => {
        logger.warn('Rate limit exceeded', {
            ip,
            endpoint,
            userAgent,
            type: 'SECURITY_EVENT'
        });
    },
    
    suspiciousActivity: (description, meta = {}) => {
        logger.error('Suspicious activity detected', {
            description,
            ...meta,
            type: 'SECURITY_EVENT'
        });
    }
};

// Database operation logger
const dbLogger = {
    query: (operation, collection, query, duration) => {
        logger.debug('Database query', {
            operation,
            collection,
            query: JSON.stringify(query),
            duration: `${duration}ms`,
            type: 'DATABASE_EVENT'
        });
    },
    
    error: (operation, collection, error) => {
        logger.error('Database error', {
            operation,
            collection,
            error: error.message,
            stack: error.stack,
            type: 'DATABASE_EVENT'
        });
    }
};

// Performance logger
const performanceLogger = {
    slowQuery: (query, duration, threshold = 1000) => {
        if (duration > threshold) {
            logger.warn('Slow query detected', {
                query: JSON.stringify(query),
                duration: `${duration}ms`,
                threshold: `${threshold}ms`,
                type: 'PERFORMANCE_EVENT'
            });
        }
    },
    
    highMemoryUsage: (usage, threshold = 100) => {
        if (usage > threshold) {
            logger.warn('High memory usage detected', {
                usage: `${usage}MB`,
                threshold: `${threshold}MB`,
                type: 'PERFORMANCE_EVENT'
            });
        }
    }
};

// Clean up old log files (keep last 30 days)
const cleanupOldLogs = () => {
    try {
        const files = fs.readdirSync(logsDir);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < thirtyDaysAgo) {
                fs.unlinkSync(filePath);
                logger.info('Cleaned up old log file', { file });
            }
        });
    } catch (error) {
        logger.error('Failed to cleanup old logs', { error: error.message });
    }
};

// Schedule log cleanup to run daily
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); // 24 hours

module.exports = {
    logger,
    requestLogger,
    securityLogger,
    dbLogger,
    performanceLogger,
    cleanupOldLogs
};
