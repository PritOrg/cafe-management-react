const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  getCustomerOrders,
  getCustomerSummary,
  removeCustomer,
} = require('../controllers/customerController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

router.use(ensureAuthenticated);
router.use(ensureAdmin);
router.get('/', getAllCustomers);
router.get('/:id/orders', getCustomerOrders);
router.get('/:id/summary', getCustomerSummary);
router.get('/:id', getCustomerById);
router.delete('/:id', removeCustomer);

module.exports = router;
