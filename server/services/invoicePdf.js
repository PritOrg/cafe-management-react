const PDFDocument = require('pdfkit');

/**
 * Readability-first invoice layouts for POS paper sizes.
 *
 * Principles:
 * - Never go below ~8pt body text (7pt only for 58mm footers/labels)
 * - Narrow paper: stack fields, fewer columns, more line gap
 * - Wide paper: full Rule-46 table, but still 9pt+ body
 * - Bold money + totals; strong horizontal rules between sections
 * - High contrast (pure black on white)
 */

const FORMATS = {
    a4: {
        key: 'a4',
        width: 595.28,
        height: 841.89,
        margin: 44,
        fontTitle: 20,
        fontSection: 11,
        fontBody: 10,
        fontSmall: 9,
        lineGap: 16,
        sectionGap: 14,
        thermal: false,
    },
    a5: {
        key: 'a5',
        width: 419.53,
        height: 595.28,
        margin: 32,
        fontTitle: 15,
        fontSection: 10,
        fontBody: 9.5,
        fontSmall: 8.5,
        lineGap: 14,
        sectionGap: 12,
        thermal: false,
    },
    thermal80: {
        key: 'thermal80',
        width: 226.77, // 80mm
        height: 2000,
        margin: 14,
        fontTitle: 12,
        fontSection: 9,
        fontBody: 9,
        fontSmall: 8,
        lineGap: 15,
        sectionGap: 12,
        thermal: true,
        showHsn: true,
    },
    thermal58: {
        key: 'thermal58',
        width: 164.25, // 58mm
        height: 2000,
        margin: 10,
        fontTitle: 11,
        fontSection: 8.5,
        fontBody: 8.5,
        fontSmall: 7.5,
        lineGap: 14,
        sectionGap: 10,
        thermal: true,
        showHsn: false,
    },
};

const inr = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

const collect = (doc) => new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
});

const resolveFormat = (format) => {
    const key = String(format || 'a4').toLowerCase();
    if (key === 'thermal' || key === '80mm' || key === 'receipt' || key === 'thermal80') return FORMATS.thermal80;
    if (key === '58mm' || key === 'thermal58') return FORMATS.thermal58;
    if (key === 'a5') return FORMATS.a5;
    return FORMATS.a4;
};

const drawRule = (doc, cfg, y, style = 'normal') => {
    const left = cfg.margin;
    const right = cfg.width - cfg.margin;
    doc.save();
    if (style === 'bold') doc.lineWidth(1.5);
    else doc.lineWidth(0.6);
    doc.moveTo(left, y).lineTo(right, y).stroke();
    doc.restore();
    return y + cfg.sectionGap;
};

const kvLine = (doc, cfg, y, label, value, { boldValue = false } = {}) => {
    const left = cfg.margin;
    const labelW = cfg.width < 200 ? 70 : 110;
    doc.fontSize(cfg.fontBody).font('Helvetica').fillColor('#000000');
    doc.text(label, left, y, { width: labelW });
    doc.font(boldValue ? 'Helvetica-Bold' : 'Helvetica');
    doc.text(String(value ?? '—'), left + labelW, y, {
        width: cfg.width - cfg.margin * 2 - labelW,
    });
    doc.font('Helvetica');
    return y + cfg.lineGap;
};

const headerWide = (doc, inv, cfg) => {
    const brand = inv.brandSnapshot?.brand || {};
    const gst = inv.brandSnapshot?.gst || {};
    let y = cfg.margin;
    const contentW = cfg.width - cfg.margin * 2;

    doc.fontSize(cfg.fontTitle).font('Helvetica-Bold').fillColor('#000000');
    doc.text('TAX INVOICE', cfg.margin, y, { width: contentW, align: 'center' });
    y += cfg.fontTitle + 8;

    doc.fontSize(cfg.fontBody).font('Helvetica');
    doc.text(brand.title || 'Cafe', cfg.margin, y, { width: contentW, align: 'center' });
    y += cfg.lineGap;
    if (gst.legalName) {
        doc.font('Helvetica-Bold').text(gst.legalName, cfg.margin, y, { width: contentW, align: 'center' });
        doc.font('Helvetica');
        y += cfg.lineGap;
    }
    if (gst.legalAddress) {
        doc.text(gst.legalAddress, cfg.margin, y, { width: contentW, align: 'center' });
        y += cfg.lineGap;
    }
    if (gst.gstin) {
        doc.font('Helvetica-Bold').text(`GSTIN: ${gst.gstin}`, cfg.margin, y, { width: contentW, align: 'center' });
        doc.font('Helvetica');
        y += cfg.lineGap;
    }

    y += 4;
    y = kvLine(doc, cfg, y, 'Invoice No', inv.invoiceNumber, { boldValue: true });
    y = kvLine(doc, cfg, y, 'Date', new Date(inv.issuedAt).toLocaleString('en-IN'));
    y = kvLine(doc, cfg, y, 'Fiscal Year', inv.fiscalYear);
    y = kvLine(doc, cfg, y, 'Place of Supply', inv.placeOfSupply || '—');

    y = drawRule(doc, cfg, y, 'bold');
    return y;
};

const itemsWide = (doc, inv, cfg, startY) => {
    const left = cfg.margin;
    const right = cfg.width - cfg.margin;
    const contentW = right - left;
    let y = startY;
    const compact = contentW < 320;

    // Column fractions chosen for readability, not density
    const cols = compact
        ? { desc: 0, qty: 0.55, tax: 0.72, amt: 1 }
        : { desc: 0, hsn: 0.42, qty: 0.55, tax: 0.68, amt: 1 };

    doc.fontSize(cfg.fontSection).font('Helvetica-Bold');
    doc.text('Item', left, y);
    if (!compact) doc.text('HSN/SAC', left + contentW * cols.hsn, y, { width: contentW * (cols.qty - cols.hsn) - 4 });
    doc.text('Qty', left + contentW * cols.qty, y, { width: contentW * (cols.tax - cols.qty) - 4 });
    doc.text('Tax', left + contentW * cols.tax, y, { width: contentW * (cols.amt - cols.tax) - 8 });
    doc.text('Amount', right - 56, y, { width: 56, align: 'right' });
    y += cfg.lineGap - 2;
    y = drawRule(doc, cfg, y);

    doc.fontSize(cfg.fontBody).font('Helvetica');
    for (const li of inv.lineItems || []) {
        const descW = contentW * (compact ? cols.qty : cols.hsn) - 4;
        doc.text(String(li.description || 'Item'), left, y, { width: descW });
        if (!compact) {
            doc.text(String(li.hsnSac || '—'), left + contentW * cols.hsn, y, {
                width: contentW * (cols.qty - cols.hsn) - 4,
            });
        }
        doc.text(String(li.quantity), left + contentW * cols.qty, y, {
            width: contentW * (cols.tax - cols.qty) - 4,
        });
        doc.text(inr(li.taxAmount), left + contentW * cols.tax, y, {
            width: contentW * (cols.amt - cols.tax) - 8,
        });
        doc.font('Helvetica-Bold').text(inr(li.amount), right - 56, y, { width: 56, align: 'right' });
        doc.font('Helvetica');
        y += cfg.lineGap;
        if (y > cfg.height - 100) {
            doc.addPage();
            y = cfg.margin;
        }
    }

    y = drawRule(doc, cfg, y);
    return y;
};

const totalsWide = (doc, inv, cfg, startY) => {
    let y = startY;
    const labelX = cfg.width * (cfg.width < 320 ? 0.4 : 0.5);
    const valRight = cfg.width - cfg.margin;

    const row = (label, value, bold = false) => {
        doc.fontSize(cfg.fontBody).font(bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(label, labelX, y);
        doc.text(inr(value), valRight - 90, y, { width: 90, align: 'right' });
        y += cfg.lineGap;
    };

    row('Taxable value', inv.taxableAmount);
    if (inv.interState) row('IGST', inv.igstAmount);
    else {
        row('CGST', inv.cgstAmount);
        row('SGST', inv.sgstAmount);
    }
    if (Number(inv.roundOff)) row('Round off', inv.roundOff);

    y += 2;
    doc.fontSize(cfg.fontBody + 2).font('Helvetica-Bold');
    doc.text('Grand Total', labelX, y);
    doc.text(inr(inv.grandTotal), valRight - 100, y, { width: 100, align: 'right' });
    y += cfg.lineGap + 4;
    doc.font('Helvetica').fontSize(cfg.fontSmall);
    doc.text(`Amount in words: ${inv.amountInWords || ''}`, cfg.margin, y, {
        width: cfg.width - cfg.margin * 2,
    });
    y += cfg.lineGap * 2;
    doc.text('Reverse charge: No', cfg.margin, y);
    y += cfg.lineGap * 2;
    doc.text('For ' + ((inv.brandSnapshot?.gst?.legalName) || (inv.brandSnapshot?.brand?.title) || 'Cafe'), cfg.margin, y);
    y += cfg.lineGap;
    doc.text('Authorised signatory', valRight - 110, y, { width: 110, align: 'right' });
    return y;
};

const footerWide = (doc, inv, cfg) => {
    doc.fontSize(cfg.fontSmall).fillColor('#333333');
    doc.text(
        `Status: ${inv.status}  ·  ${inv.invoiceNumber}`,
        cfg.margin,
        cfg.height - 36,
        { width: cfg.width - cfg.margin * 2, align: 'center' }
    );
    doc.fillColor('#000000');
};

const drawWide = (doc, inv, cfg) => {
    let y = headerWide(doc, inv, cfg);
    y = itemsWide(doc, inv, cfg, y);
    y = totalsWide(doc, inv, cfg, y);
    footerWide(doc, inv, cfg);
};

const drawThermal = (doc, inv, cfg) => {
    const brand = inv.brandSnapshot?.brand || {};
    const gst = inv.brandSnapshot?.gst || {};
    const left = cfg.margin;
    const right = cfg.width - cfg.margin;
    const contentW = right - left;
    let y = cfg.margin;

    // Header — centered, large, easy to read at arm's length
    doc.fontSize(cfg.fontTitle).font('Helvetica-Bold').fillColor('#000000');
    doc.text(brand.title || 'Cafe', left, y, { width: contentW, align: 'center' });
    y += cfg.fontTitle + 6;
    doc.fontSize(cfg.fontBody).font('Helvetica');
    if (gst.legalName) {
        doc.font('Helvetica-Bold').text(gst.legalName, left, y, { width: contentW, align: 'center' });
        doc.font('Helvetica');
        y += cfg.lineGap;
    }
    if (gst.gstin) {
        doc.text(`GSTIN ${gst.gstin}`, left, y, { width: contentW, align: 'center' });
        y += cfg.lineGap;
    }
    doc.text(`Invoice ${inv.invoiceNumber}`, left, y, { width: contentW, align: 'center' });
    y += cfg.lineGap;
    doc.text(new Date(inv.issuedAt).toLocaleString('en-IN'), left, y, { width: contentW, align: 'center' });
    y += cfg.sectionGap;
    y = drawRule(doc, cfg, y, 'bold');

    // Items — stacked, wide line gap, amount right-aligned
    for (const li of inv.lineItems || []) {
        const nameW = contentW - 52;
        doc.fontSize(cfg.fontBody).font('Helvetica');
        const name = `${li.quantity} × ${li.description || 'Item'}`;
        doc.text(name, left, y, { width: nameW });
        doc.font('Helvetica-Bold').text(inr(li.amount), right - 48, y, { width: 48, align: 'right' });
        doc.font('Helvetica');
        y += cfg.lineGap;
        if (cfg.showHsn && li.hsnSac) {
            doc.fontSize(cfg.fontSmall).fillColor('#333333');
            doc.text(`HSN ${li.hsnSac}`, left + 8, y - 2);
            doc.fillColor('#000000');
            y += cfg.fontSmall + 4;
        }
        if (y > 700) {
            doc.addPage();
            y = cfg.margin;
        }
    }

    y = drawRule(doc, cfg, y, 'bold');

    // Totals — large, bold grand total
    doc.fontSize(cfg.fontBody).font('Helvetica');
    doc.text('Taxable', left, y);
    doc.text(inr(inv.taxableAmount), right - 70, y, { width: 70, align: 'right' });
    y += cfg.lineGap;
    if (inv.interState) {
        doc.text('IGST', left, y);
        doc.text(inr(inv.igstAmount), right - 70, y, { width: 70, align: 'right' });
        y += cfg.lineGap;
    } else {
        doc.text('CGST', left, y);
        doc.text(inr(inv.cgstAmount), right - 70, y, { width: 70, align: 'right' });
        y += cfg.lineGap;
        doc.text('SGST', left, y);
        doc.text(inr(inv.sgstAmount), right - 70, y, { width: 70, align: 'right' });
        y += cfg.lineGap;
    }

    y += 2;
    doc.fontSize(cfg.fontTitle - 1).font('Helvetica-Bold');
    doc.text('TOTAL', left, y);
    doc.text(inr(inv.grandTotal), right - 90, y, { width: 90, align: 'right' });
    y += cfg.lineGap + 4;
    doc.font('Helvetica').fontSize(cfg.fontSmall);
    if (inv.amountInWords) {
        doc.text(inv.amountInWords, left, y, { width: contentW });
        y += cfg.lineGap * 2;
    }
    doc.fontSize(cfg.fontBody).font('Helvetica-Bold');
    doc.text('Thank you!', left, y, { width: contentW, align: 'center' });
};

const renderInvoicePdf = async (invoice, { format = 'a4' } = {}) => {
    const cfg = resolveFormat(format);
    const isThermal = cfg.thermal;
    const doc = new PDFDocument({
        size: [cfg.width, isThermal ? 2200 : cfg.height],
        margin: cfg.margin,
        autoFirstPage: true,
        info: {
            Title: `Invoice ${invoice.invoiceNumber || ''}`,
            Producer: 'Cafe POS',
        },
    });
    const done = collect(doc);

    if (isThermal) drawThermal(doc, invoice, cfg);
    else drawWide(doc, invoice, cfg);

    doc.end();
    const buffer = await done;
    const safe = String(invoice.invoiceNumber || 'invoice').replace(/[^\w.-]+/g, '_');
    const suffix = isThermal
        ? (cfg.key === 'thermal58' ? '58mm' : '80mm')
        : cfg.key;
    return { buffer, filename: `${safe}_${suffix}.pdf`, format: cfg.key };
};

module.exports = { renderInvoicePdf, FORMATS, resolveFormat };
