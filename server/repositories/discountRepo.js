const { getDb } = require('../db/pool');
const { mapDiscount } = require('../db/mappers');

const findByCode = async (tenantId, code) => {
    const row = await getDb()('discounts')
        .where({ tenant_id: tenantId, code: String(code).toUpperCase() })
        .first();
    if (!row) return null;
    return mapDiscount({
        ...row,
        applicable_items: Array.isArray(row.applicable_items) ? row.applicable_items : [],
    });
};

const findAll = async (tenantId) => {
    const rows = await getDb()('discounts').where({ tenant_id: tenantId });
    return rows.map((r) => mapDiscount({
        ...r,
        applicable_items: Array.isArray(r.applicable_items) ? r.applicable_items : [],
    }));
};

module.exports = { findByCode, findAll };
