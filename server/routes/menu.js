const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  createMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');

const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);

// Protected admin routes
router.post('/', ensureAuthenticated, ensureAdmin,upload.single('file'), createMenuItem);
router.put('/:id', ensureAuthenticated, ensureAdmin, updateMenuItem);
router.delete('/:id', ensureAuthenticated, ensureAdmin, deleteMenuItem);

module.exports = router;
