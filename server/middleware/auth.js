const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Standardized response helper
const sendResponse = (res, statusCode, success, message, data = null) => {
    const response = {
        success,
        message,
        timestamp: new Date().toISOString(),
    };

    if (data) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

// Enhanced authentication middleware with better error handling
const ensureAuthenticated = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendResponse(res, 401, false, 'Access token is required. Please provide a valid Bearer token.');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return sendResponse(res, 401, false, 'Access token is missing.');
        }

        jwt.verify(token, process.env.JWT_SECRET || 'newSecret', (err, decoded) => {
            if (err) {
                console.error('JWT verification failed:', {
                    error: err.message,
                    timestamp: new Date().toISOString(),
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });

                if (err.name === 'TokenExpiredError') {
                    return sendResponse(res, 401, false, 'Access token has expired. Please login again.');
                } else if (err.name === 'JsonWebTokenError') {
                    return sendResponse(res, 401, false, 'Invalid access token. Please login again.');
                } else {
                    return sendResponse(res, 401, false, 'Token verification failed. Please login again.');
                }
            }

            // Validate token payload
            if (!decoded.id || !decoded.email) {
                return sendResponse(res, 401, false, 'Invalid token payload. Please login again.');
            }

            req.userId = decoded.id;
            req.userEmail = decoded.email;
            req.role = decoded.role; // Include role for RBAC
            next();
        });
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return sendResponse(res, 500, false, 'Authentication service error. Please try again later.');
    }
};

// Enhanced admin role middleware
const ensureAdmin = (req, res, next) => {
    try {
        if (!req.role) {
            return sendResponse(res, 403, false, 'User role not found. Please login again.');
        }

        if (req.role !== 'admin') {
            console.warn('Unauthorized admin access attempt:', {
                userId: req.userId,
                userEmail: req.userEmail,
                role: req.role,
                timestamp: new Date().toISOString(),
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            return sendResponse(res, 403, false, 'Access denied. Administrator privileges required.');
        }
        next();
    } catch (error) {
        console.error('Admin authorization middleware error:', error);
        return sendResponse(res, 500, false, 'Authorization service error. Please try again later.');
    }
};

// Enhanced staff/admin role middleware
const ensureAdminOrStaff = (req, res, next) => {
    try {
        if (!req.role) {
            return sendResponse(res, 403, false, 'User role not found. Please login again.');
        }

        if (!['admin', 'staff'].includes(req.role)) {
            console.warn('Unauthorized staff access attempt:', {
                userId: req.userId,
                userEmail: req.userEmail,
                role: req.role,
                timestamp: new Date().toISOString(),
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            return sendResponse(res, 403, false, 'Access denied. Staff or administrator privileges required.');
        }
        next();
    } catch (error) {
        console.error('Staff authorization middleware error:', error);
        return sendResponse(res, 500, false, 'Authorization service error. Please try again later.');
    }
};

// Rate limiting middleware for API endpoints
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message,
            timestamp: new Date().toISOString(),
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            console.warn('Rate limit exceeded:', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
                endpoint: req.originalUrl
            });
            sendResponse(res, 429, false, message);
        }
    });
};

// Different rate limiters for different endpoints
const authRateLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many authentication attempts. Please try again in 15 minutes.'
);

const generalRateLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many requests. Please try again in 15 minutes.'
);

const strictRateLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    10, // 10 requests
    'Too many requests to this endpoint. Please try again in 15 minutes.'
);

module.exports = {
    ensureAuthenticated,
    ensureAdmin,
    ensureAdminOrStaff,
    authRateLimiter,
    generalRateLimiter,
    strictRateLimiter,
    sendResponse
};
