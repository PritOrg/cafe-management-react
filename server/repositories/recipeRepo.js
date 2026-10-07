const { getDb } = require('../db/pool');

const mapRecipe = (row) => row && ({
    _id: row.id,
    menuItemId: row.menu_item_id,
    inventoryItemId: row.inventory_item_id,
    qty: Number(row.qty),
    unit: row.unit,
});

const listForMenu = async (tenantId, menuItemId) => {
    const rows = await getDb()('menu_item_recipes')
        .where({ tenant_id: tenantId, menu_item_id: menuItemId })
        .orderBy('id');
    return rows.map(mapRecipe);
};

const listForInventory = async (tenantId, inventoryItemId) => {
    const rows = await getDb()('menu_item_recipes')
        .where({ tenant_id: tenantId, inventory_item_id: inventoryItemId });
    return rows.map(mapRecipe);
};

const add = async (tenantId, { menuItemId, inventoryItemId, qty, unit }) => {
    const [row] = await getDb()('menu_item_recipes').insert({
        tenant_id: tenantId,
        menu_item_id: menuItemId,
        inventory_item_id: inventoryItemId,
        qty,
        unit,
    }).returning('*');
    return mapRecipe(row);
};

const remove = async (tenantId, recipeId) => {
    const [row] = await getDb()('menu_item_recipes')
        .where({ id: recipeId, tenant_id: tenantId })
        .del()
        .returning('*');
    return !!row;
};

/**
 * Deduct inventory for one order line using recipes.
 * qty consumed = recipe.qty * line.quantity. Returns array of deductions.
 */
const deductForOrderLine = async (tenantId, menuItemId, quantity, { refOrderId, actorId, trx }) => {
    const db = trx || getDb();
    const recipes = await db('menu_item_recipes')
        .where({ tenant_id: tenantId, menu_item_id: menuItemId });
    const deductions = [];

    for (const recipe of recipes) {
        const inv = await db('inventory')
            .where({ id: recipe.inventory_item_id, tenant_id: tenantId, is_active: true })
            .first();
        if (!inv) continue;

        const delta = -(Number(recipe.qty) * quantity);
        await db('inventory_movements').insert({
            tenant_id: tenantId,
            inventory_id: inv.id,
            type: 'order',
            delta,
            ref_order_id: refOrderId || null,
            note: `recipe:${recipe.id}`,
            actor_id: (actorId && /^[0-9a-f-]{36}$/i.test(String(actorId))) ? actorId : null,
        });
        await db('inventory')
            .where({ id: inv.id, tenant_id: tenantId })
            .update({ quantity: Number(inv.quantity) + delta, last_updated: new Date(), updated_at: new Date() });

        deductions.push({
            inventoryItemId: inv.id,
            itemName: inv.item_name,
            delta,
            recipeQty: Number(recipe.qty),
            unit: recipe.unit,
        });
    }
    return deductions;
};

module.exports = { listForMenu, listForInventory, add, remove, deductForOrderLine, mapRecipe };
