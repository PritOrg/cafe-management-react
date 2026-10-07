const crypto = require('crypto');

const REQUEST_ID_HEADER = 'X-Request-Id';

const isValidRequestId = (value) =>
    typeof value === 'string' && value.length > 0 && value.length <= 128 && /^[A-Za-z0-9._-]+$/.test(value);

// Assign/propagate X-Request-Id early — every response carries it back to the client
const requestId = (req, res, next) => {
    const incoming = req.get(REQUEST_ID_HEADER);
    req.id = isValidRequestId(incoming) ? incoming : crypto.randomUUID();
    res.setHeader(REQUEST_ID_HEADER, req.id);
    next();
};

module.exports = { requestId, REQUEST_ID_HEADER };
