const jwt = require('jsonwebtoken');

const ensureAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check if authorization header exists and is in the expected format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Extract token from the header
    const token = authHeader.split(' ')[1];

    // Verify the token using JWT
    jwt.verify(token, 'newSecret', (err, decoded) => {
        if (err) {
            console.error('Error verifying JWT:', err);
            return res.status(403).json({ message: 'Invalid or expired token' }); // Use 403 for authorization failure
        }

        // Successful verification, attach user ID to request object (assuming 'id' field in payload)
        req.userId = decoded.id;
        next();
    });
};

module.exports = { ensureAuthenticated };
