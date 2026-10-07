const express = require('express');
const router = express.Router();
const { getActiveOrders } = require('../controllers/kitchenController');
const { ensureAuthenticated, ensureAdminOrStaff } = require('../middleware/auth');

router.use(ensureAuthenticated, ensureAdminOrStaff);
router.get('/orders', getActiveOrders);

module.exports = router;
