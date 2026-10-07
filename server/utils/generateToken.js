// utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
    };
    if (user.tenantId) {
        payload.tenantId = user.tenantId.toString();
    }
    payload.isPlatformAdmin = !!user.isPlatformAdmin;

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

module.exports = generateToken;
