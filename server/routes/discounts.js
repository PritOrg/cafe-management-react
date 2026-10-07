const express = require('express');
const router = express.Router();
const {
    listDiscounts,
    createDiscount,
    removeDiscount,
} = require('../controllers/discountController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

router.use(ensureAuthenticated);
router.get('/', ensureAdmin, listDiscounts);
router.post('/', ensureAdmin, createDiscount);
router.delete('/:id', ensureAdmin, removeDiscount);

module.exports = router;
