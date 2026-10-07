const { getDb } = require('../db/pool');

const mapSize = (row) => row && ({
    _id: row.id,
    id: row.id,
    label: row.label,
    price: Number(row.price),
    isDefault: row.is_default === true,
    sortOrder: row.sort_order,
    isActive: row.is_active !== false,
});

const listForMenu = async (tenantId, menuItemId) => {
    const rows = await getDb()('menu_item_sizes')
        .where({ tenant_id: tenantId, menu_item_id: menuItemId, is_active: true })
        .orderBy('sort_order')
        .orderBy('label');
    return rows.map(mapSize);
};

const replaceForMenu = async (tenantId, menuItemId, sizes = [], trx = getDb()) => {
    await trx('menu_item_sizes')
        .where({ tenant_id: tenantId, menu_item_id: menuItemId })
        .del();
    const created = [];
    let i = 0;
    for (const s of sizes) {
        const label = String(s.label || '').trim();
        if (!label) continue;
        const [row] = await trx('menu_item_sizes').insert({
            tenant_id: tenantId,
            menu_item_id: menuItemId,
            label,
            price: Number(s.price) || 0,
            is_default: !!s.isDefault,
            sort_order: s.sortOrder != null ? s.sortOrder : i,
        }).returning('*');
        created.push(mapSize(row));
        i += 1;
    }
    return created;
};

/**
 * Resolve price for an order line.
 * - If item has active size rows → match label (case-insensitive) or default
 * - Else legacy: price.medium / price.large
 * Returns { price, sizeLabel } or null if invalid.
 */
const resolvePrice = async (tenantId, menuItem, requestedSize) => {
    const sizes = await listForMenu(tenantId, menuItem._id);
    if (sizes.length) {
        const wanted = requestedSize ? String(requestedSize).toLowerCase() : null;
        const match = wanted
            ? sizes.find((s) => s.label.toLowerCase() === wanted)
            : sizes.find((s) => s.isDefault) || sizes[0];
        if (!match) return null;
        return { price: match.price, sizeLabel: match.label };
    }

    // Legacy two-price items (medium/large) or single price
    const legacy = String(requestedSize || '').toLowerCase();
    if (legacy === 'medium' || legacy === 'large' || legacy === '') {
        const key = legacy === 'large' ? 'large' : 'medium';
        const price = Number(menuItem.price?.[key]);
        if (Number.isFinite(price)) {
            return { price, sizeLabel: legacy === 'large' ? 'large' : (legacy === 'medium' ? 'medium' : null) };
        }
    }
    // no-size item: any/empty size uses medium (or large if requested and priced)
    const medium = Number(menuItem.price?.medium);
    const large = Number(menuItem.price?.large);
    if (legacy === 'large' && Number.isFinite(large)) return { price: large, sizeLabel: 'large' };
    if (Number.isFinite(medium)) return { price: medium, sizeLabel: legacy || null };
    return null;
};

module.exports = { listForMenu, replaceForMenu, resolvePrice, mapSize };
