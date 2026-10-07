const { getDb } = require('../db/pool');
const { mapMenuItem } = require('../db/mappers');

const withSizes = async (tenantId, item) => {
    if (!item) return item;
    const sizeRepo = require('./sizeRepo');
    const modifierRepo = require('./modifierRepo');
    const sizes = await sizeRepo.listForMenu(tenantId, item._id);
    const modifierGroups = await modifierRepo.getMenuItemGroups(tenantId, item._id);
    return { ...item, sizes, modifierGroups };
};

const findAll = async (tenantId) => {
    const rows = await getDb()('menu_items').where({ tenant_id: tenantId }).orderBy('title');
    const items = rows.map(mapMenuItem);
    return Promise.all(items.map((it) => withSizes(tenantId, it)));
};

const findById = async (tenantId, id) => {
    const row = await getDb()('menu_items').where({ id, tenant_id: tenantId }).first();
    if (!row) return null;
    return withSizes(tenantId, mapMenuItem(row));
};

const findByIdLean = async (tenantId, id) => {
    const row = await getDb()('menu_items').where({ id, tenant_id: tenantId }).first();
    if (!row) return null;
    return withSizes(tenantId, mapMenuItem(row));
};

const create = async (tenantId, data) => {
    const [row] = await getDb()('menu_items').insert({
        tenant_id: tenantId,
        title: data.title,
        sub_title: data.subTitle,
        price_medium: data.price?.medium ?? data.priceMedium ?? 0,
        price_large: data.price?.large ?? data.priceLarge ?? 0,
        category: data.category,
        category_id: data.categoryId || null,
        image_url: data.imageUrl || '',
        availability: data.availability !== false,
        calories: data.calories || 0,
        customization_options: data.customizationOptions || [],
        preparation_time: data.preparationTime || 0,
        rating: data.rating || 0,
        tags: data.tags || [],
        allergens: data.allergens || [],
        order_count: data.orderCount || 0,
        subtract_stock: data.subtractStock === true,
    }).returning('*');

    if (Array.isArray(data.sizes) && data.sizes.length) {
        const sizeRepo = require('./sizeRepo');
        await sizeRepo.replaceForMenu(tenantId, row.id, data.sizes);
    }

    if (Array.isArray(data.modifierGroupIds) && data.modifierGroupIds.length) {
        const modifierRepo = require('./modifierRepo');
        await modifierRepo.setMenuItemGroups(tenantId, row.id, data.modifierGroupIds);
    }

    let mapped = mapMenuItem(row);
    const sizeRepo = require('./sizeRepo');
    mapped = await withSizes(tenantId, mapped);
    if (Array.isArray(data.modifierGroupIds)) {
        const modifierRepo = require('./modifierRepo');
        mapped.modifierGroups = await modifierRepo.getMenuItemGroups(tenantId, row.id);
    }
    return mapped;
};

const updateById = async (tenantId, id, data) => {
    const patch = { updated_at: new Date() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.subTitle !== undefined) patch.sub_title = data.subTitle;
    if (data.price?.medium !== undefined || data.priceMedium !== undefined) {
        patch.price_medium = data.price?.medium ?? data.priceMedium;
    }
    if (data.price?.large !== undefined || data.priceLarge !== undefined) {
        patch.price_large = data.price?.large ?? data.priceLarge;
    }
    if (data.category !== undefined) patch.category = data.category;
    if (data.imageUrl !== undefined) patch.image_url = data.imageUrl;
    if (data.availability !== undefined) patch.availability = data.availability;
    if (data.calories !== undefined) patch.calories = data.calories;
    if (data.customizationOptions !== undefined) patch.customization_options = data.customizationOptions;
    if (data.preparationTime !== undefined) patch.preparation_time = data.preparationTime;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.allergens !== undefined) patch.allergens = data.allergens;
    if (data.subtractStock !== undefined) patch.subtract_stock = data.subtractStock;
    if (data.categoryId !== undefined) patch.category_id = data.categoryId;
    if (data.price?.medium !== undefined || data.priceMedium !== undefined) {
        patch.price_medium = data.price?.medium ?? data.priceMedium;
    }
    if (data.price?.large !== undefined || data.priceLarge !== undefined) {
        patch.price_large = data.price?.large ?? data.priceLarge;
    }
    const [row] = await getDb()('menu_items').where({ id, tenant_id: tenantId }).update(patch).returning('*');
    if (!row) return null;
    let mapped = mapMenuItem(row);
    if (Array.isArray(data.sizes)) {
        const sizeRepo = require('./sizeRepo');
        await sizeRepo.replaceForMenu(tenantId, id, data.sizes);
    }
    mapped = await withSizes(tenantId, mapped);
    return mapped;
};

const deleteById = async (tenantId, id) => {
    const [row] = await getDb()('menu_items').where({ id, tenant_id: tenantId }).del().returning('*');
    return row ? mapMenuItem(row) : null;
};

module.exports = { findAll, findById, findByIdLean, create, updateById, deleteById };
