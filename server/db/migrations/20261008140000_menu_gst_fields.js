/**
 * C extras: per-item GST override fields on menu_items
 */
exports.up = async (knex) => {
    if (!(await knex.schema.hasColumn('menu_items', 'sac_code'))) {
        await knex.schema.alterTable('menu_items', (t) => {
            t.string('sac_code', 20).notNullable().defaultTo('996311');
        });
    }
    if (!(await knex.schema.hasColumn('menu_items', 'gst_rate_bps'))) {
        await knex.schema.alterTable('menu_items', (t) => {
            t.integer('gst_rate_bps').nullable();
        });
    }
};

exports.down = async (knex) => {
    if (await knex.schema.hasColumn('menu_items', 'gst_rate_bps')) {
        await knex.schema.alterTable('menu_items', (t) => t.dropColumn('gst_rate_bps'));
    }
    if (await knex.schema.hasColumn('menu_items', 'sac_code')) {
        await knex.schema.alterTable('menu_items', (t) => t.dropColumn('sac_code'));
    }
};
