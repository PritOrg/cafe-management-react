const express = require('express');
const router = express.Router();
const {
    getSummary,
    getSales,
    getOrderStats,
    getTopItems,
    getCategoryMix,
} = require('../controllers/analyticsController');
const { ensureAdminOrStaff } = require('../middleware/auth');

router.use(ensureAdminOrStaff);
router.get('/summary', getSummary);
router.get('/sales', getSales);
router.get('/orders', getOrderStats);
router.get('/top-items', getTopItems);
router.get('/category-mix', getCategoryMix);

module.exports = router;
