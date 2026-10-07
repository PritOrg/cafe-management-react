const express = require('express');
const router = express.Router();
const ordersRouter = express.Router();
const {
    issueForOrder,
    listInvoices,
    getInvoice,
    getInvoicePdf,
    voidInvoice,
} = require('../controllers/invoiceController');
const { ensureAuthenticated, ensureAdmin, ensureAdminOrStaff } = require('../middleware/auth');

router.use(ensureAuthenticated);
router.get('/', ensureAdminOrStaff, listInvoices);
router.get('/:id', ensureAdminOrStaff, getInvoice);
router.get('/:id/pdf', ensureAdminOrStaff, getInvoicePdf);
router.post('/:id/void', ensureAdmin, voidInvoice);

module.exports = router;
