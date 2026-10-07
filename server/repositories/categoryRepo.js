const { getDb } = require('../db/pool');

const mapCategory = (row) => row && ({
    _id: row.id,
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order,
    isActive: row.is_active !== false,
});

const findAll = async (tenantId, { includeInactive = false } = {}) => {
    let q = getDb()('categories').where({ tenant_id: tenantId });
    if (!includeInactive) q = q.andWhere('is_active', true);
    const rows = await q.orderBy('sort_order').orderBy('name');
    return rows.map(mapCategory);
};

const findById = async (tenantId, id) => {
    const row = await getDb()('categories').where({ id, tenant_id: tenantId }).first();
    return row ? mapCategory(row) : null;
};

const findBySlug = async (tenantId, slug) => {
    const row = await getDb()('categories').where({ tenant_id: tenantId, slug: String(slug).toLowerCase() }).first();
    return row ? mapCategory(row) : null;
};

const create = async (tenantId, data) => {
    const slug = (data.slug || data.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [row] = await getDb()('categories').insert({
        tenant_id: tenantId,
        name: data.name,
        slug,
        sort_order: data.sortOrder || 0,
        is_active: data.isActive !== false,
    }).returning('*');
    return mapCategory(row);
};

const updateById = async (tenantId, id, data) => {
    const patch = { updated_at: new Date() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.slug !== undefined) patch.slug = data.slug;
    if (data.sortOrder !== undefined) patch.sort_order = data.sortOrder;
    if (data.isActive !== undefined) patch.is_active = data.isActive;
    const [row] = await getDb()('categories').where({ id, tenant_id: tenantId }).update(patch).returning('*');
    return row ? mapCategory(row) : null;
};

const deleteById = async (tenantId, id) => {
    const [row] = await getDb()('categories').where({ id, tenant_id: tenantId }).del().returning('*');
    return row ? mapCategory(row) : null;
};

module.exports = { findAll, findById, findBySlug, create, updateById, deleteById, mapCategory };
