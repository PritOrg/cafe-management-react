const { sendResponse } = require('../middleware/auth');
const invoiceService = require('../services/invoiceService');

exports.issueForOrder = async (req, res) => {
    try {
        const { interState, paymentMethod, tipAmount } = req.body || {};
        const result = await invoiceService.issueForOrder(req.tenantId, req.params.id, {
            interState: !!interState,
            paymentMethod,
            tipAmount,
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

exports.getInvoicePrint = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoice(req.tenantId, req.params.id);
        if (!invoice) return sendResponse(res, 404, false, 'Invoice not found');
        const mode = req.query.mode === 'thermal' ? 'thermal' : 'a4';
        const { renderInvoiceHtml } = require('../services/invoicePrintHtml');
        const html = renderInvoiceHtml(invoice, { mode });

        // Small on-screen toolbar (hidden in print), so the print tab isn't a
        // dead-end page. Reuses the token passed for this tab to link the PDF.
        const token = req.tokenFromQuery || String((req.headers && req.headers.authorization) || '').replace(/^Bearer\s+/i, '');
        const pdfFormat = mode === 'thermal' ? 'thermal80' : 'a4';
        const pdfHref = `/api/v1/invoices/${req.params.id}/pdf?format=${pdfFormat}&download=1&token=${encodeURIComponent(token)}`;
        const title = String(invoice.invoiceNumber || 'Invoice').replace(/[<>&"]/g, '');

        const chrome = `
<style>
  .print-toolbar{position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;gap:10px;align-items:center;
    padding:10px 16px;background:#17233b;color:#fff;font:14px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
  .print-toolbar .t-title{font-weight:600;margin-right:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .print-toolbar button,.print-toolbar a{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:0;border-radius:10px;
    font:600 14px/1.2 system-ui;cursor:pointer;text-decoration:none;background:#ffffff22;color:#fff}
  .print-toolbar button:active,.print-toolbar a:active{transform:translateY(1px)}
  .print-page{padding-top:58px}
  @media print{ .print-toolbar{display:none !important} .print-page{padding-top:0} }
</style>
<div class="print-toolbar">
  <span class="t-title">${title}</span>
  <button type="button" onclick="window.print()">🖨 Print</button>
  <a href="${pdfHref}" download>⬇ Download PDF</a>
  <button type="button" onclick="window.close()">✕ Close</button>
</div>
<script>document.body.classList.add('print-page');</script>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html.replace('</body>', `${chrome}</body>`));
    } catch (err) {
        console.error('Error rendering invoice HTML:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.printEscPos = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoice(req.tenantId, req.params.id);
        if (!invoice) return sendResponse(res, 404, false, 'Invoice not found');
        const settingsRepo = require('../repositories/settingsRepo');
        const settings = await settingsRepo.getPublic(req.tenantId);
        const host = req.body?.host || settings?.ops?.printer_host;
        const { printEscPos } = require('../services/escPos');
        const brand = invoice.brandSnapshot?.brand?.title || 'Cafe';
        const lines = [
            brand,
            `Invoice ${invoice.invoiceNumber}`,
            `Total ${Number(invoice.grandTotal).toFixed(2)}`,
            'Thank you!',
        ];
        const result = await printEscPos({ host, lines, cut: true });
        return sendResponse(res, 200, true, 'ESC/POS job sent', result);
    } catch (err) {
        console.error('ESC/POS print failed:', err);
        return sendResponse(res, err.statusCode || 500, false, err.message || 'Print failed');
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
