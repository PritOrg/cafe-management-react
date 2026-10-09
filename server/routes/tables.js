const express = require('express');
const router = express.Router();
const { listTables } = require('../controllers/tableController');
const { ensureAuthenticated, ensureAdminOrStaff } = require('../middleware/auth');

router.get('/', ensureAuthenticated, ensureAdminOrStaff, listTables);

module.exports = router;
