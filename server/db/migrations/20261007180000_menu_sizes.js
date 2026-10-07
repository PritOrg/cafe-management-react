/**
 * Flexible menu size variants (Swiggy-style labels + prices)
 */
exports.up = async (knex) => {
    if (!(await knex.schema.hasTable('menu_item_sizes'))) {
        await knex.schema.createTable('menu_item_sizes', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
            t.uuid('menu_item_id').notNullable().references('id').inTable('menu_items').onDelete('CASCADE');
            t.string('label').notNullable(); // Small / Large / 250ml / 500g / ...
            t.decimal('price', 12, 2).notNullable();
            t.boolean('is_default').notNullable().defaultTo(false);
            t.integer('sort_order').notNullable().defaultTo(0);
            t.boolean('is_active').notNullable().defaultTo(true);
            t.timestamps(true, true);
            t.index(['tenant_id', 'menu_item_id']);
            t.index(['menu_item_id', 'label'], 'menu_sizes_item_label_uq', { unique: true });
        });
    }

    // order_items.size: allow any label (not just medium/large)
    const hasSizeCol = await knex.schema.hasColumn('order_items', 'size');
    if (hasSizeCol) {
        await knex.schema.alterTable('order_items', (t) => {
            t.string('size', 40).nullable().alter();
        });
    }
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('menu_item_sizes');
};
