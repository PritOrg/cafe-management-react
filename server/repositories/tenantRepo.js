const { getDb } = require('../db/pool');
const { mapTenant } = require('../db/mappers');

const findAll = async () => {
    const rows = await getDb()('tenants').orderBy('created_at', 'desc');
    return rows.map(mapTenant);
};

const findBySlug = async (slug) => {
    const row = await getDb()('tenants').where({ slug: String(slug).toLowerCase() }).first();
    return mapTenant(row);
};

const findBySlugActive = async (slug) => {
    const tenant = await findBySlug(slug);
    if (!tenant || tenant.status !== 'active') return null;
    return tenant;
};

const create = async (data) => {
    const [row] = await getDb()('tenants')
        .insert({ slug: data.slug, name: data.name, status: data.status || 'active', settings: data.settings || {} })
        .returning('*');
    return mapTenant(row);
};

const findById = async (id) => mapTenant(await getDb()('tenants').where({ id }).first());

const updateById = async (id, update) => {
    const patch = {};
    if (update.name !== undefined) patch.name = update.name;
    if (update.status !== undefined) patch.status = update.status;
    if (update.settings !== undefined) patch.settings = update.settings;
    patch.updated_at = new Date();
    const [row] = await getDb()('tenants').where({ id }).update(patch).returning('*');
    return mapTenant(row);
};

module.exports = { findAll, findBySlug, findBySlugActive, create, findById, updateById };
