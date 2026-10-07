/**
 * Phase H: inventory min/soft-delete + movements + menu subtract_stock
 */
exports.up = async (knex) => {
    const inv = await knex.schema.hasTable('inventory');
    if (inv) {
        const hasMin = await knex.schema.hasColumn('inventory', 'min_qty');
        if (!hasMin) {
            await knex.schema.alterTable('inventory', (t) => {
                t.decimal('min_qty', 12, 3).notNullable().defaultTo(0);
            });
        }
        const hasActive = await knex.schema.hasColumn('inventory', 'is_active');
        if (!hasActive) {
            await knex.schema.alterTable('inventory', (t) => {
                t.boolean('is_active').notNullable().defaultTo(true);
            });
        }
    }

    const hasMovements = await knex.schema.hasTable('inventory_movements');
    if (!hasMovements) {
        await knex.schema.createTable('inventory_movements', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
            t.uuid('inventory_id').notNullable().references('id').inTable('inventory').onDelete('CASCADE');
            t.string('type', 20).notNullable(); // purchase | waste | adjust | order
            t.decimal('delta', 12, 3).notNullable();
            t.uuid('ref_order_id').nullable();
            t.string('note', 255).nullable();
            t.uuid('actor_id').nullable();
            t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            t.index(['tenant_id', 'inventory_id']);
            t.index(['tenant_id', 'ref_order_id']);
        });
    }

    const hasSub = await knex.schema.hasColumn('menu_items', 'subtract_stock');
    if (!hasSub) {
        await knex.schema.alterTable('menu_items', (t) => {
            t.boolean('subtract_stock').notNullable().defaultTo(false);
        });
    }
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('inventory_movements');
    if (await knex.schema.hasColumn('menu_items', 'subtract_stock')) {
        await knex.schema.alterTable('menu_items', (t) => t.dropColumn('subtract_stock'));
    }
};
