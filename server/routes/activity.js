const express = require('express');
const router = express.Router();
const { listActivities, getEntityHistory } = require('../controllers/activityController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

router.use(ensureAuthenticated, ensureAdmin);
router.get('/', listActivities);
router.get('/entity/:type/:id', getEntityHistory);

module.exports = router;
