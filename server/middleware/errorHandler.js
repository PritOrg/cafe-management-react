const mongoose = require('mongoose');

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

// Custom error class for application-specific errors
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Handle MongoDB CastError (invalid ObjectId)
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

// Handle MongoDB duplicate field error
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

// Handle MongoDB validation error
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () =>
    new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again.', 401);

// Send error response for development
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        error: err,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
};

// Send error response for production
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        return sendResponse(res, err.statusCode, false, err.message);
    }
    
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    return sendResponse(res, 500, false, 'Something went wrong!');
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error details
    console.error('Error occurred:', {
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        // Handle specific error types
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

// Async error wrapper to catch async errors
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

// Handle unhandled routes
const handleNotFound = (req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(err);
};

// Graceful shutdown handlers
const handleUncaughtException = () => {
    process.on('uncaughtException', (err) => {
        console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        process.exit(1);
    });
};

const handleUnhandledRejection = (server) => {
    process.on('unhandledRejection', (err) => {
        console.log('UNHANDLED REJECTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        server.close(() => {
            process.exit(1);
        });
    });
};

// Handle SIGTERM
const handleSigterm = (server) => {
    process.on('SIGTERM', () => {
        console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
        server.close(() => {
            console.log('💥 Process terminated!');
        });
    });
};

module.exports = {
    AppError,
    globalErrorHandler,
    catchAsync,
    handleNotFound,
    handleUncaughtException,
    handleUnhandledRejection,
    handleSigterm,
    sendResponse
};
