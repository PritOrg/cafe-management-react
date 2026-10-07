const { sendResponse } = require('../middleware/auth');
const handleError = (res, error, status = 500, message = 'Internal server error') => {
    console.error(error);
    return sendResponse(res, status, false, message);
};

module.exports = handleError;
