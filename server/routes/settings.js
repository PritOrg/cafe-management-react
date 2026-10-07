const express = require('express');
const router = express.Router();
const { getPublicSettings, getSettings, updateSettings } = require('../controllers/settingsController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

router.get('/public', getPublicSettings);
router.get('/', ensureAuthenticated, ensureAdmin, getSettings);
router.put('/', ensureAuthenticated, ensureAdmin, updateSettings);

module.exports = router;
