const { sendResponse } = require('../middleware/auth');
const invoiceService = require('../services/invoiceService');
const invoiceRepo = require('../repositories/invoiceRepo');

exports.issueForOrder = async (req, res) => {
    try {
        const { interState } = req.body || {};
        const result = await invoiceService.issueForOrder(req.tenantId, req.params.id, {
            interState: !!interState,
            actorId: req.userId,
            actorType: req.role,
        });
        return sendResponse(res, result.alreadyIssued ? 200 : 201, true,
            result.alreadyIssued ? 'Invoice already issued for this order' : 'Invoice issued',
            result.invoice);
    } catch (err) {
        console.error('Error issuing invoice:', err);
        return sendResponse(res, err.statusCode || 500, false, err.message || 'Server error');
    }
};

exports.listInvoices = async (req, res) => {
    try {
        const { from, to, status, page, limit } = req.query;
        const data = await invoiceService.listInvoices(req.tenantId, {
            from,
            to,
            status,
            page: Number(page) || 1,
            limit: Number(limit) || 50,
        });
        return sendResponse(res, 200, true, 'Invoices retrieved', data);
    } catch (err) {
        console.error('Error listing invoices:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.getInvoice = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoice(req.tenantId, req.params.id);
        if (!invoice) return sendResponse(res, 404, false, 'Invoice not found');
        return sendResponse(res, 200, true, 'Invoice retrieved', invoice);
    } catch (err) {
        console.error('Error fetching invoice:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.getInvoicePdf = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoice(req.tenantId, req.params.id);
        if (!invoice) return sendResponse(res, 404, false, 'Invoice not found');
        const format = String(req.query.format || 'a4');
        const { renderInvoicePdf } = require('../services/invoicePdf');
        const { buffer, filename } = await renderInvoicePdf(invoice, { format });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${req.query.download === '1' ? 'attachment' : 'inline'}; filename="${filename}"`);
        return res.send(buffer);
    } catch (err) {
        console.error('Error rendering invoice PDF:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.voidInvoice = async (req, res) => {
    try {
        const { reason } = req.body || {};
        const invoice = await invoiceService.voidInvoice(req.tenantId, req.params.id, reason, {
            actorId: req.userId,
            actorType: req.role,
        });
        if (!invoice) return sendResponse(res, 404, false, 'Invoice not found');
        return sendResponse(res, 200, true, 'Invoice voided', invoice);
    } catch (err) {
        console.error('Error voiding invoice:', err);
        return sendResponse(res, err.statusCode || 500, false, err.message || 'Server error');
    }
};
