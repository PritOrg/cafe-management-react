const { getDb } = require('../db/pool');
const { mapTable } = require('../db/mappers');

const findByNumber = async (tenantId, number, trx = getDb()) => {
    const row = await trx('tables').where({ tenant_id: tenantId, number }).first();
    return row ? mapTable(row) : null;
};

const findAll = async (tenantId) => {
    const rows = await getDb()('tables').where({ tenant_id: tenantId }).orderBy('number');
    return rows.map(mapTable);
};

const updateByNumber = async (tenantId, number, update, trx = getDb()) => {
    const patch = {};
    if (update.status !== undefined) patch.status = update.status;
    if (update.currentOrder !== undefined) patch.current_order_id = update.currentOrder;
    const [row] = await trx('tables')
        .where({ tenant_id: tenantId, number })
        .update(patch)
        .returning('*');
    return row ? mapTable(row) : null;
};

module.exports = { findByNumber, findAll, updateByNumber };
