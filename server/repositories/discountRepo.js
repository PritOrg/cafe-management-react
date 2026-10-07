const { getDb } = require('../db/pool');
const { mapDiscount } = require('../db/mappers');

const mapRow = (row) => row && ({
    ...mapDiscount({
        ...row,
        applicable_items: Array.isArray(row.applicable_items) ? row.applicable_items : [],
    }),
    isActive: row.is_active !== false,
});

const findByCode = async (tenantId, code) => {
    const row = await getDb()('discounts')
        .where({ tenant_id: tenantId, code: String(code).toUpperCase() })
        .andWhere('is_active', true)
        .first();
    return row ? mapRow(row) : null;
};

const findAll = async (tenantId, { includeInactive = false } = {}) => {
    let q = getDb()('discounts').where({ tenant_id: tenantId });
    if (!includeInactive) q = q.andWhere('is_active', true);
    const rows = await q.orderBy('created_at', 'desc');
    return rows.map(mapRow);
};

const findById = async (tenantId, id) => {
    const row = await getDb()('discounts').where({ id, tenant_id: tenantId }).first();
    return row ? mapRow(row) : null;
};

const softDelete = async (tenantId, id) => {
    const [row] = await getDb()('discounts')
        .where({ id, tenant_id: tenantId })
        .update({ is_active: false, updated_at: new Date() })
        .returning('*');
    return row ? mapRow(row) : null;
};

module.exports = { findByCode, findAll, findById, softDelete };
