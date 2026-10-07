const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
};

const getLogFilePath = (level) => {
    const date = new Date().toISOString().split('T')[0];
    return path.join(logsDir, `${level.toLowerCase()}-${date}.log`);
};

const formatLogMessage = (level, message, meta = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
    };
    return `${JSON.stringify(logEntry)}\n`;
};

const writeLog = (level, message, meta = {}) => {
    try {
        fs.appendFileSync(getLogFilePath(level), formatLogMessage(level, message, meta));
    } catch (error) {
        console.error('Failed to write log:', error.message);
    }
};

const logger = {
    error: (message, meta = {}) => writeLog(LOG_LEVELS.ERROR, message, meta),
    warn: (message, meta = {}) => writeLog(LOG_LEVELS.WARN, message, meta),
    info: (message, meta = {}) => writeLog(LOG_LEVELS.INFO, message, meta),
    debug: (message, meta = {}) => writeLog(LOG_LEVELS.DEBUG, message, meta),
};

const userContext = (req) => ({
    requestId: req.id || null,
    userId: req.userId || null,
    tenantId: req.tenantId || null,
    tenantSlug: req.tenantSlug || null,
    role: req.role || null,
    isPlatformAdmin: req.isPlatformAdmin || false,
});

// Compact one-line access log for humans (stdout)
const accessLine = ({ req, statusCode, durationMs, error }) => {
    const id = req.id || '-';
    const user = req.userId || '-';
    const tenant = req.tenantSlug || req.tenantId || '-';
    const base = `${id} ${req.method} ${req.originalUrl} → ${statusCode} ${durationMs}ms user=${user} tenant=${tenant}`;
    return error ? `${base} error=${error}` : base;
};

/**
 * Logs every API call in and out.
 * Outgoing log includes requestId, user, tenant, status, duration.
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    logger.info('request', {
        ...userContext(req),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent') || null,
        contentType: req.get('Content-Type') || null,
    });

    const originalEnd = res.end;
    res.end = function endWithAccessLog(chunk, encoding) {
        const durationMs = Date.now() - startTime;
        const statusCode = res.statusCode;
        const failed = statusCode >= 400;

        const meta = {
            ...userContext(req),
            method: req.method,
            url: req.originalUrl,
            statusCode,
            durationMs,
            ip: req.ip,
            userAgent: req.get('User-Agent') || null,
        };

        if (failed) {
            logger.warn('response', meta);
        } else {
            logger.info('response', meta);
        }

        // Always show access line on console (all environments) for live debugging
        const line = accessLine({ req, statusCode, durationMs });
        if (failed) {
            console.warn(`[http] ${line}`);
        } else {
            console.log(`[http] ${line}`);
        }

        originalEnd.call(this, chunk, encoding);
    };

    next();
};

const securityLogger = {
    loginAttempt: (email, success, ip, userAgent, requestId) => {
        logger.info('Login attempt', { email, success, ip, userAgent, requestId, type: 'SECURITY_EVENT' });
    },
    loginSuccess: (userId, email, ip, userAgent, requestId) => {
        logger.info('Login successful', { userId, email, ip, userAgent, requestId, type: 'SECURITY_EVENT' });
    },
    loginFailure: (email, reason, ip, userAgent, requestId) => {
        logger.warn('Login failed', { email, reason, ip, userAgent, requestId, type: 'SECURITY_EVENT' });
    },
    unauthorized: (req, reason) => {
        logger.warn('Unauthorized access', {
            ...userContext(req),
            method: req.method,
            url: req.originalUrl,
            reason,
            type: 'SECURITY_EVENT',
        });
    },
};

const performanceLogger = {
    slowQuery: (query, durationMs, thresholdMs = 200) => {
        logger.warn('Slow query', { query, durationMs, thresholdMs, type: 'PERFORMANCE' });
    },
    highMemoryUsage: (memoryUsageMB, thresholdMB = 200) => {
        logger.warn('High memory usage', { memoryUsageMB, thresholdMB, type: 'PERFORMANCE' });
    },
};

module.exports = {
    logger,
    requestLogger,
    securityLogger,
    performanceLogger,
    LOG_LEVELS,
};
