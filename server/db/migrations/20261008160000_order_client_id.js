/**
 * Offline outbox dedupe: clients may replay a queued order with the same
 * client_order_id; a partial unique index makes replays idempotent.
 */
exports.up = async (knex) => {
    if (!(await knex.schema.hasColumn('orders', 'client_order_id'))) {
        await knex.schema.alterTable('orders', (t) => {
            t.string('client_order_id', 64).nullable();
        });
    }
    await knex.raw(
        'CREATE UNIQUE INDEX IF NOT EXISTS orders_tenant_client_uq ON orders (tenant_id, client_order_id) WHERE client_order_id IS NOT NULL'
    );
};

exports.down = async (knex) => {
    await knex.raw('DROP INDEX IF EXISTS orders_tenant_client_uq');
    if (await knex.schema.hasColumn('orders', 'client_order_id')) {
        await knex.schema.alterTable('orders', (t) => t.dropColumn('client_order_id'));
    }
};
