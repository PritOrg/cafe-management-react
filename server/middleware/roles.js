
// Allowed roles example: ['admin', 'kitchen', 'waiter']
const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
        }
        next();
    };
};

module.exports = { allowRoles };
