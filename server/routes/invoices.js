const express = require('express');
const router = express.Router();
const {
    listInvoices,
    getInvoice,
    getInvoicePdf,
    getInvoicePrint,
    printEscPos,
    voidInvoice,
} = require('../controllers/invoiceController');
const { ensureAuthenticated, ensureAdmin, ensureAdminOrStaff, attachTokenFromQuery } = require('../middleware/auth');

router.use(attachTokenFromQuery);
router.use(ensureAuthenticated);
router.get('/', ensureAdminOrStaff, listInvoices);
router.get('/:id', ensureAdminOrStaff, getInvoice);
router.get('/:id/pdf', ensureAdminOrStaff, getInvoicePdf);
router.get('/:id/print', ensureAdminOrStaff, getInvoicePrint);
router.post('/:id/print-escpos', ensureAdminOrStaff, printEscPos);
router.post('/:id/void', ensureAdmin, voidInvoice);

module.exports = router;
