const { getDb } = require('../db/pool');

const mapOption = (row) => row && ({
    _id: row.id,
    name: row.name,
    priceDelta: Number(row.price_delta),
    sortOrder: row.sort_order,
});

const mapGroup = (row, options = []) => row && ({
    _id: row.id,
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    displayType: row.display_type,
    sortOrder: row.sort_order,
    isActive: row.is_active !== false,
    options,
});

const listGroups = async (tenantId) => {
    const groups = await getDb()('modifier_groups')
        .where({ tenant_id: tenantId, is_active: true })
        .orderBy('sort_order').orderBy('name');
    if (!groups.length) return [];
    const options = await getDb()('modifier_options')
        .whereIn('modifier_group_id', groups.map((g) => g.id))
        .andWhere('is_active', true)
        .orderBy('sort_order');
    return groups.map((g) => mapGroup(g, options.filter((o) => o.modifier_group_id === g.id).map(mapOption)));
};

const getGroup = async (tenantId, groupId) => {
    const row = await getDb()('modifier_groups').where({ id: groupId, tenant_id: tenantId }).first();
    if (!row) return null;
    const options = await getDb()('modifier_options')
        .where({ modifier_group_id: groupId, tenant_id: tenantId, is_active: true })
        .orderBy('sort_order');
    return mapGroup(row, options.map(mapOption));
};

const createGroup = async (tenantId, data) => {
    const displayType = data.displayType === 'radio' ? 'radio' : 'checkbox';
    const [group] = await getDb()('modifier_groups').insert({
        tenant_id: tenantId,
        name: data.name,
        display_type: displayType,
        sort_order: data.sortOrder || 0,
    }).returning('*');

    const options = [];
    for (const opt of data.options || []) {
        const [row] = await getDb()('modifier_options').insert({
            tenant_id: tenantId,
            modifier_group_id: group.id,
            name: opt.name,
            price_delta: opt.priceDelta || 0,
            sort_order: opt.sortOrder || 0,
        }).returning('*');
        options.push(mapOption(row));
    }
    return mapGroup(group, options);
};

const updateGroup = async (tenantId, groupId, data) => {
    const patch = { updated_at: new Date() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.displayType !== undefined) patch.display_type = data.displayType === 'radio' ? 'radio' : 'checkbox';
    if (data.isActive !== undefined) patch.is_active = data.isActive;
    const [row] = await getDb()('modifier_groups').where({ id: groupId, tenant_id: tenantId }).update(patch).returning('*');
    if (!row) return null;
    if (Array.isArray(data.options)) {
        await getDb()('modifier_options').where({ modifier_group_id: groupId, tenant_id: tenantId }).del();
        for (const opt of data.options) {
            await getDb()('modifier_options').insert({
                tenant_id: tenantId,
                modifier_group_id: groupId,
                name: opt.name,
                price_delta: opt.priceDelta || 0,
            });
        }
    }
    return getGroup(tenantId, groupId);
};

const deleteGroup = async (tenantId, groupId) => {
    const [row] = await getDb()('modifier_groups').where({ id: groupId, tenant_id: tenantId }).del().returning('*');
    return !!row;
};

/** Attach modifier groups to a menu item */
const setMenuItemGroups = async (tenantId, menuItemId, groupIds = []) => {
    await getDb()('menu_item_modifier_groups')
        .where({ tenant_id: tenantId, menu_item_id: menuItemId })
        .del();
    for (const gid of groupIds) {
        await getDb()('menu_item_modifier_groups').insert({
            tenant_id: tenantId,
            menu_item_id: menuItemId,
            modifier_group_id: gid,
        });
    }
};

const getMenuItemGroups = async (tenantId, menuItemId) => {
    const rows = await getDb()('menu_item_modifier_groups as img')
        .join('modifier_groups as g', 'g.id', 'img.modifier_group_id')
        .where('img.tenant_id', tenantId)
        .where('img.menu_item_id', menuItemId)
        .andWhere('g.is_active', true)
        .orderBy('img.sort_order');
    const groups = [];
    for (const row of rows) {
        const g = await getGroup(tenantId, row.modifier_group_id);
        if (g) groups.push(g);
    }
    return groups;
};

module.exports = { listGroups, getGroup, createGroup, updateGroup, deleteGroup, setMenuItemGroups, getMenuItemGroups, mapGroup, mapOption };
