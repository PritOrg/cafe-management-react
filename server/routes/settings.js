const express = require('express');
const router = express.Router();
const {
    getPublicSettings,
    getSettings,
    updateSettings,
    getIntegrations,
    sendTestEmail,
} = require('../controllers/settingsController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

router.get('/public', getPublicSettings);
router.get('/', ensureAuthenticated, ensureAdmin, getSettings);
router.put('/', ensureAuthenticated, ensureAdmin, updateSettings);
router.get('/integrations', ensureAuthenticated, ensureAdmin, getIntegrations);
router.post('/integrations/test-email', ensureAuthenticated, ensureAdmin, sendTestEmail);

module.exports = router;
