const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerStaffOrAdmin, login, changePassword } = require('../controllers/authController');
const { authRateLimiter, ensureAuthenticated } = require('../middleware/auth');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
        }
    }
});

router.post('/register/staff',
    authRateLimiter,
    upload.single('profilePhoto'),
    registerStaffOrAdmin
);

router.post('/login', authRateLimiter, login);

router.put('/password', ensureAuthenticated, changePassword);

module.exports = router;
