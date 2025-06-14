// middlewares/auth.js
const jwt = require('jsonwebtoken');

const ensureAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'newSecret', (err, decoded) => {
        if (err) {
            console.error('JWT verification failed:', err);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.userId = decoded.id;
        req.role = decoded.role; // Include role for RBAC
        next();
    });
};

// ✅ New middleware to ensure role is admin
const ensureAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};
const ensureAdminOrWaiter = (req, res, next) => {
    if (!['admin', 'waiter'].includes(req.role)) {
        return res.status(403).json({ message: 'Access denied: Admins and Waiters only' });
    }
    next();
};

module.exports = {
    ensureAuthenticated,
    ensureAdmin,
    ensureAdminOrWaiter
};
