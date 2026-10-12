/** Customers are phone-identified; email is optional. Stop forcing a fake one. */
exports.up = (knex) => knex.raw('ALTER TABLE customers ALTER COLUMN email DROP NOT NULL');

exports.down = (knex) => knex.raw('ALTER TABLE customers ALTER COLUMN email SET NOT NULL');