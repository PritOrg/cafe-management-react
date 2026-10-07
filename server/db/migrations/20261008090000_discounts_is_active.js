/**
 * Soft-delete flag for discounts
 */
exports.up = async (knex) => {
    if (!(await knex.schema.hasColumn('discounts', 'is_active'))) {
        await knex.schema.alterTable('discounts', (t) => {
            t.boolean('is_active').notNullable().defaultTo(true);
        });
    }
};

exports.down = async (knex) => {
    if (await knex.schema.hasColumn('discounts', 'is_active')) {
        await knex.schema.alterTable('discounts', (t) => t.dropColumn('is_active'));
    }
};
