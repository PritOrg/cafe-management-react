// utils/handleError.js
const handleError = (res, error, status = 500, message = 'Internal server error') => {
    console.error(error);
    return res.status(status).json({ message });
};

module.exports = handleError;
