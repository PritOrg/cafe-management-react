/**
 * Initial tenant-scoped schema (Phase I Knex cutover).
 */
exports.up = async (knex) => {
    await knex.schema.createTable('tenants', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.string('slug', 63).notNullable().unique();
        t.string('name', 100).notNullable();
        t.string('status', 20).notNullable().defaultTo('active');
        t.jsonb('settings').notNullable().defaultTo('{}');
        t.timestamps(true, true);
    });

    await knex.schema.createTable('staff_admins', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').nullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.boolean('is_platform_admin').notNullable().defaultTo(false);
        t.string('first_name', 50).notNullable();
        t.string('last_name', 50).notNullable();
        t.string('email', 254).notNullable();
        t.string('password').notNullable();
        t.string('phone', 30).nullable();
        t.text('profile_photo_url').nullable();
        t.string('role', 20).notNullable();
        t.boolean('is_active').notNullable().defaultTo(true);
        t.timestamp('registration_date').notNullable().defaultTo(knex.fn.now());
        t.timestamp('last_login').nullable();
        t.timestamps(true, true);
        t.index(['tenant_id']);
        t.index(['tenant_id', 'email'], 'staff_admins_tenant_email_uq', { unique: true });
        t.index(['email'], 'staff_admins_platform_email_uq', {
            unique: true,
            where: knex.raw('is_platform_admin = true'),
        });
    });

    await knex.schema.createTable('customers', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.string('first_name', 50).notNullable();
        t.string('last_name', 50).notNullable();
        t.string('email', 254).notNullable();
        t.string('password').nullable();
        t.string('phone', 30).nullable();
        t.text('profile_photo_url').nullable();
        t.integer('loyalty_points').notNullable().defaultTo(0);
        t.string('membership_level', 20).notNullable().defaultTo('Silver');
        t.boolean('notifications').notNullable().defaultTo(true);
        t.timestamp('registration_date').notNullable().defaultTo(knex.fn.now());
        t.timestamp('last_login').nullable();
        t.timestamps(true, true);
        t.index(['tenant_id']);
        t.index(['tenant_id', 'email'], 'customers_tenant_email_uq', { unique: true });
        t.index(['tenant_id', 'phone'], 'customers_tenant_phone_idx');
    });

    await knex.schema.createTable('menu_items', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.string('title').notNullable();
        t.string('sub_title').notNullable();
        t.decimal('price_medium', 12, 2).notNullable();
        t.decimal('price_large', 12, 2).notNullable();
        t.string('category').notNullable();
        t.text('image_url').notNullable().defaultTo('');
        t.boolean('availability').notNullable().defaultTo(true);
        t.integer('calories').notNullable().defaultTo(0);
        t.specificType('customization_options', 'text[]').notNullable().defaultTo('{}');
        t.integer('preparation_time').notNullable().defaultTo(0);
        t.decimal('rating', 3, 2).notNullable().defaultTo(0);
        t.specificType('tags', 'text[]').notNullable().defaultTo('{}');
        t.specificType('allergens', 'text[]').notNullable().defaultTo('{}');
        t.integer('order_count').notNullable().defaultTo(0);
        t.timestamps(true, true);
        t.index(['tenant_id']);
        t.index(['tenant_id', 'category']);
    });

    await knex.schema.createTable('discounts', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.string('code').notNullable();
        t.decimal('discount_percentage', 5, 2).notNullable();
        t.decimal('max_discount_amount', 12, 2).notNullable();
        t.decimal('min_order_amount', 12, 2).notNullable().defaultTo(0);
        t.jsonb('applicable_items').notNullable().defaultTo('[]');
        t.timestamp('expires_at').notNullable();
        t.timestamps(true, true);
        t.index(['tenant_id']);
        t.index(['tenant_id', 'code'], 'discounts_tenant_code_uq', { unique: true });
    });

    await knex.schema.createTable('tables', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.integer('number').notNullable();
        t.string('status', 20).notNullable().defaultTo('available');
        t.uuid('current_order_id').nullable();
        t.timestamps(true, true);
        t.index(['tenant_id']);
        t.index(['tenant_id', 'number'], 'tables_tenant_number_uq', { unique: true });
    });

    await knex.schema.createTable('counters', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.string('name').notNullable();
        t.bigInteger('value').notNullable().defaultTo(0);
        t.timestamps(true, true);
        t.index(['tenant_id', 'name'], 'counters_tenant_name_uq', { unique: true });
    });

    await knex.schema.createTable('orders', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.string('order_number').notNullable();
        t.integer('table_number').nullable();
        t.uuid('placed_by_customer').nullable().references('id').inTable('customers').onDelete('SET NULL');
        t.uuid('placed_by_staff').nullable().references('id').inTable('staff_admins').onDelete('SET NULL');
        t.string('status', 20).notNullable().defaultTo('pending');
        t.decimal('tip_amount', 12, 2).notNullable().defaultTo(0);
        t.uuid('discount_id').nullable().references('id').inTable('discounts').onDelete('SET NULL');
        t.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
        t.string('payment_status', 20).notNullable().defaultTo('pending');
        t.string('payment_method', 30).notNullable();
        t.decimal('total_amount', 12, 2).notNullable();
        t.decimal('final_amount', 12, 2).notNullable();
        t.timestamp('placed_at').notNullable().defaultTo(knex.fn.now());
        t.timestamps(true, true);
        t.index(['tenant_id']);
        t.index(['tenant_id', 'order_number'], 'orders_tenant_number_uq', { unique: true });
        t.index(['tenant_id', 'placed_at']);
        t.index(['tenant_id', 'status']);
    });

    await knex.schema.createTable('order_items', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
        t.uuid('menu_item_id').notNullable().references('id').inTable('menu_items').onDelete('RESTRICT');
        t.string('size', 20).notNullable();
        t.integer('quantity').notNullable().defaultTo(1);
        t.jsonb('customizations').notNullable().defaultTo('[]');
        t.text('special_instructions').notNullable().defaultTo('');
        t.decimal('item_price', 12, 2).notNullable();
        t.integer('preparation_time').notNullable().defaultTo(0);
        t.timestamps(true, true);
        t.index(['order_id']);
        t.index(['menu_item_id']);
    });

    await knex.schema.createTable('settings', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').notNullable().unique().references('id').inTable('tenants').onDelete('CASCADE');
        t.jsonb('data').notNullable().defaultTo('{}');
        t.timestamps(true, true);
    });

    await knex.schema.createTable('activity_logs', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').nullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.uuid('actor_id').nullable();
        t.string('actor_type', 20).notNullable().defaultTo('system');
        t.string('action').notNullable();
        t.string('entity').notNullable();
        t.uuid('entity_id').nullable();
        t.jsonb('meta').notNullable().defaultTo('{}');
        t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        t.index(['tenant_id', 'created_at']);
    });

    await knex.schema.createTable('inventory', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.string('item_name').notNullable();
        t.decimal('quantity', 12, 3).notNullable().defaultTo(0);
        t.string('unit').notNullable();
        t.string('category').notNullable();
        t.timestamp('last_updated').notNullable().defaultTo(knex.fn.now());
        t.timestamps(true, true);
        t.index(['tenant_id']);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('inventory');
    await knex.schema.dropTableIfExists('activity_logs');
    await knex.schema.dropTableIfExists('settings');
    await knex.schema.dropTableIfExists('order_items');
    await knex.schema.dropTableIfExists('orders');
    await knex.schema.dropTableIfExists('counters');
    await knex.schema.dropTableIfExists('tables');
    await knex.schema.dropTableIfExists('discounts');
    await knex.schema.dropTableIfExists('menu_items');
    await knex.schema.dropTableIfExists('customers');
    await knex.schema.dropTableIfExists('staff_admins');
    await knex.schema.dropTableIfExists('tenants');
};
