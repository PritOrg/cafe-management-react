const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getOrderHistory,
  getOrderById,
  updateOrderStatus,
  assignOrder,
  getOrders,
  getOrdersByStatus,
  getTodaysOrders,
} = require('../controllers/orderController');
const { ensureAuthenticated, ensureAdminOrStaff, attachUserIfPresent, generalRateLimiter } = require('../middleware/auth');
const { issueForOrder } = require('../controllers/invoiceController');

router.post('/', attachUserIfPresent, placeOrder);
router.post('/:id/invoice', ensureAuthenticated, ensureAdminOrStaff, issueForOrder);
router.get('/history', generalRateLimiter, getOrderHistory);
router.get('/orders/today', ensureAuthenticated, ensureAdminOrStaff, getTodaysOrders);
router.get('/orders/status/:status', ensureAuthenticated, ensureAdminOrStaff, getOrdersByStatus);
router.get('/:id', ensureAuthenticated, getOrderById);
router.put('/:id/status', ensureAuthenticated, ensureAdminOrStaff, updateOrderStatus);
router.put('/:id/assign', ensureAuthenticated, ensureAdminOrStaff, assignOrder);
router.get('/', ensureAuthenticated, ensureAdminOrStaff, getOrders);

module.exports = router;
