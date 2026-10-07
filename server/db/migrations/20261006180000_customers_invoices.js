/**
 * Phase K + L: customer soft-delete flag + GST invoices.
 */
exports.up = async (knex) => {
    const hasIsActive = await knex.schema.hasColumn('customers', 'is_active');
    if (!hasIsActive) {
        await knex.schema.alterTable('customers', (t) => {
            t.boolean('is_active').notNullable().defaultTo(true);
        });
    }

    const hasInvoices = await knex.schema.hasTable('invoices');
    if (!hasInvoices) {
        await knex.schema.createTable('invoices', (t) => {
            t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
            t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
            t.uuid('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
            t.string('invoice_number').notNullable();
            t.string('fiscal_year', 9).notNullable();
            t.bigInteger('seq').notNullable();
            t.string('status', 20).notNullable().defaultTo('issued');
            t.string('place_of_supply', 64).nullable();
            t.boolean('inter_state').notNullable().defaultTo(false);
            t.boolean('reverse_charge').notNullable().defaultTo(false);
            t.decimal('taxable_amount', 14, 2).notNullable().defaultTo(0);
            t.decimal('cgst_amount', 14, 2).notNullable().defaultTo(0);
            t.decimal('sgst_amount', 14, 2).notNullable().defaultTo(0);
            t.decimal('igst_amount', 14, 2).notNullable().defaultTo(0);
            t.decimal('round_off', 14, 2).notNullable().defaultTo(0);
            t.decimal('grand_total', 14, 2).notNullable();
            t.decimal('tip_amount', 14, 2).notNullable().defaultTo(0);
            t.jsonb('line_items').notNullable().defaultTo('[]');
            t.jsonb('hsn_summary').notNullable().defaultTo('[]');
            t.jsonb('brand_snapshot').notNullable().defaultTo('{}');
            t.text('amount_in_words').notNullable().defaultTo('');
            t.timestamp('issued_at').notNullable().defaultTo(knex.fn.now());
            t.timestamp('voided_at').nullable();
            t.text('void_reason').nullable();
            t.timestamps(true, true);
            t.index(['tenant_id']);
            t.index(['tenant_id', 'invoice_number'], 'invoices_tenant_number_uq', { unique: true });
            t.index(['tenant_id', 'order_id'], 'invoices_tenant_order_uq', { unique: true });
            t.index(['tenant_id', 'fiscal_year', 'seq'], 'invoices_tenant_fy_seq_uq', { unique: true });
        });
    }
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('invoices');
    const hasIsActive = await knex.schema.hasColumn('customers', 'is_active');
    if (hasIsActive) {
        await knex.schema.alterTable('customers', (t) => t.dropColumn('is_active'));
    }
};
