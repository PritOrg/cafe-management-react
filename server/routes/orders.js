
const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getOrders,
  getOrdersByStatus,
  getTodaysOrders
} = require('../controllers/orderController');
const { ensureAuthenticated, ensureAdminOrWaiter } = require('../middleware/auth');

router.post('/', placeOrder);
router.get('/mine', ensureAuthenticated, getMyOrders);
router.get('/:id', ensureAuthenticated, getOrderById);
router.put('/:id/status', ensureAdminOrWaiter, updateOrderStatus);
router.get('/', ensureAdminOrWaiter, getOrders);

// Staff order-related functionalities
router.get('/orders/today', ensureAdminOrWaiter, getTodaysOrders);
router.get('/orders/status/:status', ensureAdminOrWaiter, getOrdersByStatus);
module.exports = router;
