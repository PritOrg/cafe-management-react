const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getOrderHistory,
  getOrderById,
  updateOrderStatus,
  getOrders,
  getOrdersByStatus,
  getTodaysOrders,
} = require('../controllers/orderController');
const { ensureAuthenticated, ensureAdminOrStaff, attachUserIfPresent, generalRateLimiter } = require('../middleware/auth');
const { issueForOrder } = require('../controllers/invoiceController');

router.post('/', attachUserIfPresent, placeOrder);
router.post('/:id/invoice', ensureAuthenticated, ensureAdminOrStaff, issueForOrder);
router.get('/history', generalRateLimiter, getOrderHistory);
router.get('/orders/today', ensureAdminOrStaff, getTodaysOrders);
router.get('/orders/status/:status', ensureAdminOrStaff, getOrdersByStatus);
router.get('/:id', ensureAuthenticated, getOrderById);
router.put('/:id/status', ensureAdminOrStaff, updateOrderStatus);
router.get('/', ensureAdminOrStaff, getOrders);

module.exports = router;
