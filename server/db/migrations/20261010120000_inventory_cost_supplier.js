/** Industry-standard inventory: unit cost (paise), reorder qty, supplier. */
exports.up = (knex) => knex.schema.alterTable('inventory', (t) => {
    t.integer('cost_per_unit_minor').nullable();
    t.integer('reorder_qty').nullable();
    t.string('supplier', 120).nullable();
});

exports.down = (knex) => knex.schema.alterTable('inventory', (t) => {
    t.dropColumn('cost_per_unit_minor');
    t.dropColumn('reorder_qty');
    t.dropColumn('supplier');
});