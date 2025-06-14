const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const { registerCustomer, registerStaffOrAdmin, login, updateProfile, deleteProfile } = require('../controllers/authController');
const { ensureAuthenticated } = require('../middleware/auth');

// Auth routes
router.post('/register/customer', upload.single('profilePhoto'), registerCustomer);
router.post('/register/staff', upload.single('profilePhoto'), registerStaffOrAdmin);
router.post('/login', login);
router.put('/profile', ensureAuthenticated, upload.single('profilePhoto'), updateProfile);
router.delete('/profile', ensureAuthenticated, deleteProfile);

module.exports = router;
