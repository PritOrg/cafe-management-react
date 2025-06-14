const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getOwnProfile,
  updateOwnProfile,
  deleteOwnAccount,
  uploadProfilePhoto
} = require('../controllers/customerController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', ensureAdmin, getAllCustomers);
router.get('/profile', ensureAuthenticated, getOwnProfile);
router.put('/profile', ensureAuthenticated, updateOwnProfile);
router.delete('/profile', ensureAuthenticated, deleteOwnAccount);
router.post('/photo', ensureAuthenticated, upload.single('profilePhoto'), uploadProfilePhoto);

module.exports = router;
