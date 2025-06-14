// utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d' // Set your preferred expiration
    });
};

module.exports = generateToken;
