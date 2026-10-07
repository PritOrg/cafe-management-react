/**
 * Activity logs: request_id for audit correlation
 */
exports.up = async (knex) => {
    if (!(await knex.schema.hasColumn('activity_logs', 'request_id'))) {
        await knex.schema.alterTable('activity_logs', (t) => {
            t.string('request_id', 64).nullable();
        });
        await knex.schema.alterTable('activity_logs', (t) => {
            t.index(['tenant_id', 'created_at'], 'activity_logs_tenant_created_idx');
            t.index(['tenant_id', 'action', 'created_at'], 'activity_logs_tenant_action_created_idx');
        });
    }
};

exports.down = async (knex) => {
    if (await knex.schema.hasColumn('activity_logs', 'request_id')) {
        await knex.schema.alterTable('activity_logs', (t) => t.dropColumn('request_id'));
    }
};
