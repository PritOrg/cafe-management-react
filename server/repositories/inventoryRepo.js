const { getDb } = require('../db/pool');
const { mapInventory } = require('../db/mappers');

const findAll = async (tenantId) => {
    const rows = await getDb()('inventory').where({ tenant_id: tenantId }).orderBy('item_name');
    return rows.map(mapInventory);
};

const findById = async (tenantId, id) => {
    const row = await getDb()('inventory').where({ id, tenant_id: tenantId }).first();
    return row ? mapInventory(row) : null;
};

const create = async (tenantId, data) => {
    const [row] = await getDb()('inventory').insert({
        tenant_id: tenantId,
        item_name: data.itemName,
        quantity: data.quantity || 0,
        unit: data.unit,
        category: data.category,
    }).returning('*');
    return mapInventory(row);
};

const updateById = async (tenantId, id, data) => {
    const patch = { last_updated: new Date() };
    if (data.itemName !== undefined) patch.item_name = data.itemName;
    if (data.quantity !== undefined) patch.quantity = data.quantity;
    if (data.unit !== undefined) patch.unit = data.unit;
    if (data.category !== undefined) patch.category = data.category;
    const [row] = await getDb()('inventory').where({ id, tenant_id: tenantId }).update(patch).returning('*');
    return row ? mapInventory(row) : null;
};

const deleteById = async (tenantId, id) => {
    const [row] = await getDb()('inventory').where({ id, tenant_id: tenantId }).del().returning('*');
    return row ? mapInventory(row) : null;
};

const lowStock = async (tenantId) => {
    const rows = await getDb()('inventory')
        .where({ tenant_id: tenantId })
        .where('quantity', '<=', 0);
    return rows.map(mapInventory);
};

module.exports = { findAll, findById, create, updateById, deleteById, lowStock };
