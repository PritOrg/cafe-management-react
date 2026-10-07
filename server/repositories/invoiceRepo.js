const { getDb } = require('../db/pool');

const findByInvoiceNumber = (tenantId, invoiceNumber) =>
    getDb()('invoices').where({ tenant_id: tenantId, invoice_number: invoiceNumber }).first();

const findByOrder = (tenantId, orderId) =>
    getDb()('invoices').where({ tenant_id: tenantId, order_id: orderId }).first();

const findById = (tenantId, id) =>
    getDb()('invoices').where({ tenant_id: tenantId, id }).first();

/**
 * Concurrency-safe invoice number: ${prefix}/${FY}/${SEQ}
 * SEQ from counters row (tenant, name=`invoice:${FY}`), unique index as backstop.
 */
const nextNumber = async (tenantId, prefix, fy, trx = getDb()) => {
    const name = `invoice:${fy}`;
    // Atomic upsert — safe under concurrent invoice issues
    const [row] = await trx('counters')
        .insert({ tenant_id: tenantId, name, value: 1 })
        .onConflict(['tenant_id', 'name'])
        .merge({ value: trx.raw('counters.value + 1'), updated_at: new Date() })
        .returning('value');
    const seq = Number(row.value);
    return {
        invoiceNumber: `${prefix}/${fy}/${String(seq).padStart(4, '0')}`,
        fy,
        seq,
    };
};

const create = async (tenantId, data, trx = getDb()) => {
    const [row] = await trx('invoices').insert({
        tenant_id: tenantId,
        order_id: data.orderId,
        invoice_number: data.invoiceNumber,
        fiscal_year: data.fiscalYear,
        seq: data.seq,
        status: data.status || 'issued',
        place_of_supply: data.placeOfSupply || null,
        inter_state: !!data.interState,
        reverse_charge: !!data.reverseCharge,
        taxable_amount: data.taxableAmount,
        cgst_amount: data.cgstAmount,
        sgst_amount: data.sgstAmount,
        igst_amount: data.igstAmount,
        round_off: data.roundOff,
        grand_total: data.grandTotal,
        tip_amount: data.tipAmount || 0,
        line_items: JSON.stringify(data.lineItems || []),
        hsn_summary: JSON.stringify(data.hsnSummary || []),
        brand_snapshot: JSON.stringify(data.brandSnapshot || {}),
        amount_in_words: data.amountInWords || '',
    }).returning('*');
    return row;
};

const list = async (tenantId, { from, to, status, limit = 50, offset = 0 } = {}) => {
    let q = getDb()('invoices').where({ tenant_id: tenantId });
    if (status) q = q.andWhere('status', status);
    if (from) q = q.andWhere('issued_at', '>=', from);
    if (to) q = q.andWhere('issued_at', '<=', to);
    const [rows, countRow] = await Promise.all([
        q.clone().orderBy('issued_at', 'desc').limit(limit).offset(offset),
        q.clone().count('* as count').first(),
    ]);
    return { items: rows, total: Number(countRow?.count || 0) };
};

const voidInvoice = async (tenantId, id, reason, trx = getDb()) => {
    const [row] = await trx('invoices')
        .where({ tenant_id: tenantId, id })
        .update({ status: 'void', voided_at: new Date(), void_reason: reason || null, updated_at: new Date() })
        .returning('*');
    return row || null;
};

module.exports = { findByInvoiceNumber, findByOrder, findById, nextNumber, create, list, voidInvoice };
