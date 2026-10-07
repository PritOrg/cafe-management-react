const express = require('express');
const router = express.Router();
const { listTenants, createTenant, updateTenant } = require('../controllers/tenantController');
const { ensureAuthenticated, ensurePlatformAdmin } = require('../middleware/auth');

router.use(ensureAuthenticated, ensurePlatformAdmin);
router.get('/', listTenants);
router.post('/', createTenant);
router.patch('/:id', updateTenant);

module.exports = router;
