const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  addStaff,
  updateStaff,
  removeStaff,
} = require('../controllers/staffController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Core staff management
router.get('/', ensureAuthenticated, ensureAdmin, getAllStaff);
router.post('/', ensureAuthenticated, ensureAdmin, addStaff);
router.put('/:id', ensureAuthenticated, ensureAdmin, updateStaff);
router.delete('/:id', ensureAuthenticated, ensureAdmin, removeStaff);

module.exports = router;
