/**
 * Professional kitchen: categories, modifier groups/options, recipes (BOM)
 */
exports.up = async (knex) => {
    if (!(await knex.schema.hasTable('categories'))) {
        await knex.schema.createTable('categories', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
            t.string('name').notNullable();
            t.string('slug').notNullable();
            t.integer('sort_order').notNullable().defaultTo(0);
            t.boolean('is_active').notNullable().defaultTo(true);
            t.timestamps(true, true);
            t.index(['tenant_id']);
            t.index(['tenant_id', 'slug'], 'categories_tenant_slug_uq', { unique: true });
        });
    }

    if (!(await knex.schema.hasTable('modifier_groups'))) {
        await knex.schema.createTable('modifier_groups', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
            t.string('name').notNullable();
            t.string('display_type', 20).notNullable().defaultTo('checkbox'); // radio | checkbox
            t.integer('sort_order').notNullable().defaultTo(0);
            t.boolean('is_active').notNullable().defaultTo(true);
            t.timestamps(true, true);
            t.index(['tenant_id']);
        });
    }

    if (!(await knex.schema.hasTable('modifier_options'))) {
        await knex.schema.createTable('modifier_options', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
            t.uuid('modifier_group_id').notNullable().references('id').inTable('modifier_groups').onDelete('CASCADE');
            t.string('name').notNullable();
            t.decimal('price_delta', 12, 2).notNullable().defaultTo(0);
            t.integer('sort_order').notNullable().defaultTo(0);
            t.boolean('is_active').notNullable().defaultTo(true);
            t.timestamps(true, true);
            t.index(['tenant_id', 'modifier_group_id']);
        });
    }

    if (!(await knex.schema.hasTable('menu_item_modifier_groups'))) {
        await knex.schema.createTable('menu_item_modifier_groups', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
            t.uuid('menu_item_id').notNullable().references('id').inTable('menu_items').onDelete('CASCADE');
            t.uuid('modifier_group_id').notNullable().references('id').inTable('modifier_groups').onDelete('CASCADE');
            t.integer('sort_order').notNullable().defaultTo(0);
            t.index(['tenant_id', 'menu_item_id']);
            t.index(['menu_item_id', 'modifier_group_id'], 'mimg_item_group_uq', { unique: true });
        });
    }

    if (!(await knex.schema.hasTable('menu_item_recipes'))) {
        await knex.schema.createTable('menu_item_recipes', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
            t.uuid('menu_item_id').notNullable().references('id').inTable('menu_items').onDelete('CASCADE');
            t.uuid('inventory_item_id').notNullable().references('id').inTable('inventory').onDelete('CASCADE');
            t.decimal('qty', 12, 3).notNullable();
            t.string('unit', 20).notNullable();
            t.timestamps(true, true);
            t.index(['tenant_id', 'menu_item_id']);
            t.index(['menu_item_id', 'inventory_item_id'], 'recipe_item_inv_uq', { unique: true });
        });
    }

    const hasCatId = await knex.schema.hasColumn('menu_items', 'category_id');
    if (!hasCatId) {
        await knex.schema.alterTable('menu_items', (t) => {
            t.uuid('category_id').nullable().references('id').inTable('categories').onDelete('SET NULL');
        });
    }
};

exports.down = async (knex) => {
    if (await knex.schema.hasColumn('menu_items', 'category_id')) {
        await knex.schema.alterTable('menu_items', (t) => t.dropColumn('category_id'));
    }
    await knex.schema.dropTableIfExists('menu_item_recipes');
    await knex.schema.dropTableIfExists('menu_item_modifier_groups');
    await knex.schema.dropTableIfExists('modifier_options');
    await knex.schema.dropTableIfExists('modifier_groups');
    await knex.schema.dropTableIfExists('categories');
};
