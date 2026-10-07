const money = require('../utils/money');
const { moneyToWordsINR } = require('../utils/moneyToWordsINR');
const { getDb } = require('../db/pool');
const invoiceRepo = require('../repositories/invoiceRepo');
const settingsRepo = require('../repositories/settingsRepo');
const orderRepo = require('../repositories/orderRepo');
const activityRepo = require('../repositories/activityRepo');

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z]\dZ\d$/;

const validateGstSettings = (gst) => {
    const missing = [];
    if (!gst.gstin) missing.push('gstin');
    if (!gst.legalName) missing.push('legalName');
    if (!gst.legalAddress) missing.push('legalAddress');
    if (!gst.stateCode) missing.push('stateCode');
    if (gst.gstin && !GSTIN_RE.test(gst.gstin)) {
        return { ok: false, message: 'GSTIN is invalid (expected 15-char format e.g. 27AAAAA0000A1Z5)' };
    }
    if (missing.length) {
        return { ok: false, message: `GST settings incomplete: set ${missing.join(', ')} in Settings` };
    }
    return { ok: true };
};

/**
 * Issue GST tax invoice for an order (idempotent — one invoice per order).
 */
const issueForOrder = async (tenantId, orderId, { interState = false, actorId, actorType } = {}) => {
    const existing = await invoiceRepo.findByOrder(tenantId, orderId);
    if (existing && existing.status === 'issued') {
        return { invoice: existing, alreadyIssued: true };
    }

    const settings = await settingsRepo.getPublic(tenantId);
    const gstCheck = validateGstSettings(settings.gst);
    if (!gstCheck.ok) {
        const err = new Error(gstCheck.message);
        err.statusCode = 400;
        throw err;
    }

    const order = await orderRepo.findById(tenantId, orderId);
    if (!order) {
        const err = new Error('Order not found');
        err.statusCode = 404;
        throw err;
    }

    const bps = Number(settings.gst.gst_bps ?? settings.gst.bps ?? 500);
    const taxable = money.toMinor(Number(order.totalAmount) - Number(order.discountAmount || 0));
    const lineItems = (order.items || []).map((it) => {
        const qty = Number(it.quantity) || 1;
        const rate = money.toMinor(Number(it.itemPrice) || 0);
        const lineTaxable = rate * qty;
        const tax = money.applyBps(lineTaxable, bps);
        return {
            description: it.menuItemDoc?.title || it.name || 'Item',
            hsnSac: settings.gst.hsnSAC || '996311',
            quantity: qty,
            unit: 'PCS',
            taxable: money.fromMinor(lineTaxable),
            rateBps: bps,
            taxAmount: money.fromMinor(tax),
            amount: money.fromMinor(lineTaxable + tax),
        };
    });

    const taxTotal = money.applyBps(taxable, bps);
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    if (interState) {
        igst = taxTotal;
    } else {
        cgst = Math.round(taxTotal / 2);
        sgst = taxTotal - cgst;
    }

    const tipMinor = money.toMinor(Number(order.tipAmount || 0));
    const grossMinor = taxable + taxTotal + tipMinor;
    const grand = Math.round(money.fromMinor(grossMinor) * 100) / 100;
    const roundOff = money.fromMinor(grossMinor) - grand;

    const hsnMap = new Map();
    for (const li of lineItems) {
        const key = li.hsnSac;
        const prev = hsnMap.get(key) || { hsnSac: key, taxable: 0, tax: 0 };
        prev.taxable = money.toMinor(li.taxable);
        prev.tax = money.toMinor(li.taxAmount);
        hsnMap.set(key, prev);
    }
    // recompute properly
    const hsnSummary = [];
    for (const li of lineItems) {
        const row = hsnSummary.find((h) => h.hsnSac === li.hsnSac);
        if (row) {
            row.taxable = money.fromMinor(money.toMinor(row.taxable) + money.toMinor(li.taxable));
            row.tax = money.fromMinor(money.toMinor(row.tax) + money.toMinor(li.taxAmount));
        } else {
            hsnSummary.push({ hsnSac: li.hsnSac, taxable: li.taxable, tax: li.taxAmount });
        }
    }

    const fy = settingsRepo.fiscalYear(new Date(), Number(settings.gst.fyStartMonth) || 4);
    const prefix = settings.gst.invoicePrefix || 'INV';

    const saved = await getDb().transaction(async (trx) => {
        const { invoiceNumber, seq } = await invoiceRepo.nextNumber(tenantId, prefix, fy, trx);
        return invoiceRepo.create(tenantId, {
            orderId: order._id,
            invoiceNumber,
            fiscalYear: fy,
            seq,
            placeOfSupply: settings.gst.stateName || settings.gst.stateCode,
            interState,
            reverseCharge: false,
            taxableAmount: money.fromMinor(taxable),
            cgstAmount: money.fromMinor(cgst),
            sgstAmount: money.fromMinor(sgst),
            igstAmount: money.fromMinor(igst),
            roundOff: Number(roundOff.toFixed(2)),
            grandTotal: grand,
            tipAmount: money.fromMinor(tipMinor),
            lineItems,
            hsnSummary,
            brandSnapshot: {
                brand: settings.brand,
                gst: settings.gst,
            },
            amountInWords: moneyToWordsINR(grand),
        }, trx);
    });

    await activityRepo.log({
        tenantId,
        actorId,
        actorType: actorType || 'staff',
        action: 'invoice.issue',
        entity: 'invoice',
        entityId: saved.id,
        meta: { invoiceNumber: saved.invoice_number, orderId: order._id, grandTotal: grand },
    });

    return {
        invoice: mapInvoice(saved),
        alreadyIssued: false,
    };
};

const mapInvoice = (row) => row && ({
    _id: row.id,
    id: row.id,
    tenantId: row.tenant_id,
    orderId: row.order_id,
    invoiceNumber: row.invoice_number,
    fiscalYear: row.fiscal_year,
    seq: row.seq,
    status: row.status,
    placeOfSupply: row.place_of_supply,
    interState: row.inter_state,
    reverseCharge: row.reverse_charge,
    taxableAmount: Number(row.taxable_amount),
    cgstAmount: Number(row.cgst_amount),
    sgstAmount: Number(row.sgst_amount),
    igstAmount: Number(row.igst_amount),
    roundOff: Number(row.round_off),
    grandTotal: Number(row.grand_total),
    tipAmount: Number(row.tip_amount),
    lineItems: row.line_items || [],
    hsnSummary: row.hsn_summary || [],
    brandSnapshot: row.brand_snapshot || {},
    amountInWords: row.amount_in_words,
    issuedAt: row.issued_at,
    voidedAt: row.voided_at,
    voidReason: row.void_reason,
    createdAt: row.created_at,
});

const listInvoices = async (tenantId, query) => {
    const { items, total } = await invoiceRepo.list(tenantId, query);
    return { items: items.map(mapInvoice), total };
};

const getInvoice = async (tenantId, id) => {
    const row = await invoiceRepo.findById(tenantId, id);
    return mapInvoice(row);
};

const voidInvoice = async (tenantId, id, reason, { actorId, actorType } = {}) => {
    const row = await invoiceRepo.voidInvoice(tenantId, id, reason);
    if (!row) return null;
    await activityRepo.log({
        tenantId,
        actorId,
        actorType: actorType || 'admin',
        action: 'invoice.void',
        entity: 'invoice',
        entityId: row.id,
        meta: { invoiceNumber: row.invoice_number, reason: reason || null },
    });
    return mapInvoice(row);
};

module.exports = { issueForOrder, listInvoices, getInvoice, voidInvoice, mapInvoice, validateGstSettings };
