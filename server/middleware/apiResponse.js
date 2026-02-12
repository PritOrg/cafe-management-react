const { logger } = require('./logger');

/**
 * Enhanced API Response Utility
 * Provides consistent response formatting and automatic logging
 */

class ApiResponse {
    constructor(res, req) {
        this.res = res;
        this.req = req;
        this.startTime = Date.now();
    }

    /**
     * Send success response
     */
    success(data = null, message = 'Success', statusCode = 200, meta = {}) {
        const response = {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                requestId: this.req.id || this.generateRequestId(),
                responseTime: `${Date.now() - this.startTime}ms`,
                ...meta
            }
        };

        // Log successful response
        logger.info('API Success Response', {
            method: this.req.method,
            url: this.req.originalUrl,
            statusCode,
            responseTime: response.meta.responseTime,
            userId: this.req.userId || 'anonymous',
            requestId: response.meta.requestId
        });

        return this.res.status(statusCode).json(response);
    }

    /**
     * Send error response
     */
    error(message = 'Internal Server Error', statusCode = 500, errors = null, meta = {}) {
        const response = {
            success: false,
            message,
            meta: {
                timestamp: new Date().toISOString(),
                requestId: this.req.id || this.generateRequestId(),
                responseTime: `${Date.now() - this.startTime}ms`,
                ...meta
            }
        };

        // Include errors in development mode
        if (process.env.NODE_ENV === 'development' && errors) {
            response.errors = errors;
        }

        // Log error response
        logger.error('API Error Response', {
            method: this.req.method,
            url: this.req.originalUrl,
            statusCode,
            message,
            responseTime: response.meta.responseTime,
            userId: this.req.userId || 'anonymous',
            requestId: response.meta.requestId,
            errors: errors || 'No additional error details'
        });

        return this.res.status(statusCode).json(response);
    }

    /**
     * Send validation error response
     */
    validationError(errors, message = 'Validation failed') {
        return this.error(message, 422, errors, { type: 'validation_error' });
    }

    /**
     * Send not found response
     */
    notFound(message = 'Resource not found') {
        return this.error(message, 404, null, { type: 'not_found' });
    }

    /**
     * Send unauthorized response
     */
    unauthorized(message = 'Unauthorized access') {
        return this.error(message, 401, null, { type: 'unauthorized' });
    }

    /**
     * Send forbidden response
     */
    forbidden(message = 'Access forbidden') {
        return this.error(message, 403, null, { type: 'forbidden' });
    }

    /**
     * Send conflict response
     */
    conflict(message = 'Resource conflict', details = null) {
        return this.error(message, 409, details, { type: 'conflict' });
    }

    /**
     * Send rate limit exceeded response
     */
    rateLimitExceeded(message = 'Rate limit exceeded', retryAfter = null) {
        const meta = { type: 'rate_limit_exceeded' };
        if (retryAfter) {
            meta.retryAfter = retryAfter;
            this.res.set('Retry-After', retryAfter);
        }
        return this.error(message, 429, null, meta);
    }

    /**
     * Send paginated response
     */
    paginated(data, pagination, message = 'Success') {
        const meta = {
            pagination: {
                page: pagination.page || 1,
                limit: pagination.limit || 10,
                total: pagination.total || 0,
                pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
                hasNext: pagination.hasNext || false,
                hasPrev: pagination.hasPrev || false
            }
        };

        return this.success(data, message, 200, meta);
    }

    /**
     * Send created response
     */
    created(data, message = 'Resource created successfully') {
        return this.success(data, message, 201);
    }

    /**
     * Send accepted response
     */
    accepted(data = null, message = 'Request accepted for processing') {
        return this.success(data, message, 202);
    }

    /**
     * Send no content response
     */
    noContent() {
        logger.info('API No Content Response', {
            method: this.req.method,
            url: this.req.originalUrl,
            statusCode: 204,
            responseTime: `${Date.now() - this.startTime}ms`,
            userId: this.req.userId || 'anonymous'
        });

        return this.res.status(204).send();
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Middleware to attach ApiResponse to request object
 */
const attachApiResponse = (req, res, next) => {
    // Generate unique request ID
    req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Attach ApiResponse instance
    req.apiResponse = new ApiResponse(res, req);
    
    // Also attach to res for backward compatibility
    res.apiResponse = req.apiResponse;
    
    next();
};

/**
 * Response time tracking middleware
 */
const responseTimeTracker = (req, res, next) => {
    const startTime = Date.now();
    
    // Override res.end to calculate response time
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        // Add response time header
        res.set('X-Response-Time', `${responseTime}ms`);
        
        // Log slow responses
        if (responseTime > 1000) {
            logger.warn('Slow API Response', {
                method: req.method,
                url: req.originalUrl,
                responseTime: `${responseTime}ms`,
                statusCode: res.statusCode,
                userId: req.userId || 'anonymous'
            });
        }
        
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

module.exports = {
    ApiResponse,
    attachApiResponse,
    responseTimeTracker
};
