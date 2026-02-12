
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
const { ensureAuthenticated, ensureAdminOrStaff } = require('../middleware/auth');

router.post('/', placeOrder);
router.get('/mine', ensureAuthenticated, getMyOrders);
router.get('/:id', ensureAuthenticated, getOrderById);
router.put('/:id/status', ensureAdminOrStaff, updateOrderStatus);
router.get('/', ensureAdminOrStaff, getOrders);

// Staff order-related functionalities
router.get('/orders/today', ensureAdminOrStaff, getTodaysOrders);
router.get('/orders/status/:status', ensureAdminOrStaff, getOrdersByStatus);
module.exports = router;
