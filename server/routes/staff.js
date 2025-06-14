const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  addStaff,
  updateStaff,
  removeStaff,
} = require('../controllers/staffController');
const { ensureAdmin, ensureAdminOrWaiter } = require('../middleware/auth');

// Core staff management
router.get('/', ensureAdmin, getAllStaff);
router.post('/', ensureAdmin, addStaff);
router.put('/:id', ensureAdmin, updateStaff);
router.delete('/:id', ensureAdmin, removeStaff);

module.exports = router;
