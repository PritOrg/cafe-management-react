/**
 * Link inventory rows to menu items for order stock deduction
 */
exports.up = async (knex) => {
    const has = await knex.schema.hasColumn('inventory', 'menu_item_id');
    if (!has) {
        await knex.schema.alterTable('inventory', (t) => {
            t.uuid('menu_item_id').nullable().references('id').inTable('menu_items').onDelete('SET NULL');
        });
        await knex.schema.alterTable('inventory', (t) => {
            t.index(['tenant_id', 'menu_item_id'], 'inventory_tenant_menu_idx');
        });
    }
};

exports.down = async (knex) => {
    if (await knex.schema.hasColumn('inventory', 'menu_item_id')) {
        await knex.schema.alterTable('inventory', (t) => t.dropColumn('menu_item_id'));
    }
};
