const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Standardized response helper — includes requestId when available for client correlation
const sendResponse = (res, statusCode, success, message, data = null) => {
    const response = {
        success,
        message,
        timestamp: new Date().toISOString(),
    };

    if (res.req && res.req.id) {
        response.requestId = res.req.id;
    }

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
            req.role = decoded.role;
            req.tenantId = decoded.tenantId;
            req.isPlatformAdmin = !!decoded.isPlatformAdmin;

            if (
                decoded.tenantId &&
                req.tenantId &&
                decoded.tenantId.toString() !== req.tenantId.toString()
            ) {
                return sendResponse(res, 403, false, 'Token tenant does not match request tenant');
            }
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

// Different rate limiters for different endpoints (disabled under NODE_ENV=test)
const authRateLimiter = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : createRateLimiter(
        15 * 60 * 1000,
        5,
        'Too many authentication attempts. Please try again in 15 minutes.'
    );

const generalRateLimiter = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : createRateLimiter(
        15 * 60 * 1000,
        100,
        'Too many requests. Please try again in 15 minutes.'
    );

const strictRateLimiter = process.env.NODE_ENV === 'test'
    ? (req, res, next) => next()
    : createRateLimiter(
        15 * 60 * 1000,
        10,
        'Too many requests to this endpoint. Please try again in 15 minutes.'
    );

const ensurePlatformAdmin = (req, res, next) => {
    try {
        if (!req.isPlatformAdmin) {
            return sendResponse(res, 403, false, 'Platform administrator privileges required');
        }
        next();
    } catch (error) {
        console.error('Platform admin authorization middleware error:', error);
        return sendResponse(res, 500, false, 'Authorization service error. Please try again later.');
    }
};

/**
 * Attach the user from a Bearer token when present, but never reject.
 * Used on public endpoints (e.g. POST /orders) so staff actions are attributed
 * while guest/customer requests (no token) still succeed.
 */
const attachUserIfPresent = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
        const token = authHeader.split(' ')[1];
        if (!token) return next();
        return jwt.verify(token, process.env.JWT_SECRET || 'newSecret', (err, decoded) => {
            if (!err && decoded) {
                req.userId = decoded.id;
                req.userEmail = decoded.email;
                req.role = decoded.role;
                req.isPlatformAdmin = !!decoded.isPlatformAdmin;
            }
            return next();
        });
    } catch {
        return next();
    }
};

module.exports = {
    ensureAuthenticated,
    ensureAdmin,
    ensureAdminOrStaff,
    ensurePlatformAdmin,
    attachUserIfPresent,
    authRateLimiter,
    generalRateLimiter,
    strictRateLimiter,
    sendResponse
};
