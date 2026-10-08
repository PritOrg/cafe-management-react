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

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const handleDuplicateFieldsDB = (err) => {
    const message = err.detail || 'Duplicate field value. Please use another value!';
    return new AppError(message, 409);
};

const handleInvalidInputDB = (err) => {
    if (err.code === '22P02' || err.code === '22001' || err.code === '23514') {
        return new AppError('Invalid input data', 400);
    }
    return new AppError(err.message || 'Invalid input data', 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode || 500).json({
        success: false,
        error: err,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        return sendResponse(res, err.statusCode, false, err.message);
    }
    console.error('ERROR 💥', err);
    return sendResponse(res, 500, false, 'Something went wrong!');
};

const globalErrorHandler = (err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error('Error occurred:', {
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        if (error.code === '23505') error = handleDuplicateFieldsDB(error);
        else if (typeof error.code === 'string' && error.code.startsWith('22')) error = handleInvalidInputDB(error);
        else if (error.name === 'JsonWebTokenError') error = handleJWTError();
        else if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const handleNotFound = (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
};

let isShuttingDown = false;

const gracefulShutdown = async (server, exitCode = 0) => {
    if (isShuttingDown) {
        process.exit(1);
    }
    isShuttingDown = true;

    const forceExitTimer = setTimeout(() => {
        console.warn('⏰ Shutdown timed out — forcing exit');
        process.exit(exitCode || 1);
    }, 8000);

    try {
        if (server && server.listening) {
            await new Promise((resolve) => server.close(resolve));
            console.log('HTTP server closed.');
        }

        const { destroyDb } = require('../db/pool');
        await destroyDb();
        console.log('Postgres pool closed cleanly.');

        clearTimeout(forceExitTimer);
        process.exit(exitCode);
    } catch (err) {
        console.error('Error during graceful shutdown:', err);
        clearTimeout(forceExitTimer);
        process.exit(1);
    }
};

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
        gracefulShutdown(server, 1);
    });
};

const handleSigterm = (server) => {
    process.on('SIGTERM', () => {
        console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
        gracefulShutdown(server, 0);
    });
    process.on('SIGINT', () => {
        console.log('👋 SIGINT RECEIVED (Ctrl+C). Shutting down gracefully');
        gracefulShutdown(server, 0);
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
    gracefulShutdown,
    sendResponse,
};
