const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerCustomer, registerStaffOrAdmin, login, updateProfile, deleteProfile } = require('../controllers/authController');
const { ensureAuthenticated, authRateLimiter, generalRateLimiter } = require('../middleware/auth');

// Enhanced multer configuration with file validation
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only one file allowed
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
        }
    }
});

// Multer error handling will be done in the global error handler

/**
 * @swagger
 * /api/auth/register/customer:
 *   post:
 *     summary: Register a new customer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Customer already exists
 */
router.post('/register/customer',
    authRateLimiter,
    upload.single('profilePhoto'),
    registerCustomer
);

/**
 * @swagger
 * /api/auth/register/staff:
 *   post:
 *     summary: Register a new staff member or admin
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [staff, admin]
 *               phone:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Staff/Admin registered successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: User already exists
 */
router.post('/register/staff',
    authRateLimiter,
    upload.single('profilePhoto'),
    registerStaffOrAdmin
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authRateLimiter, login);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/profile',
    generalRateLimiter,
    ensureAuthenticated,
    upload.single('profilePhoto'),
    updateProfile
);

/**
 * @swagger
 * /api/auth/profile:
 *   delete:
 *     summary: Delete user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/profile',
    generalRateLimiter,
    ensureAuthenticated,
    deleteProfile
);

module.exports = router;
