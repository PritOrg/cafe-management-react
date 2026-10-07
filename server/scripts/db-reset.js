require('dotenv').config();
const knexlib = require('knex');
const knexConfig = require('../db/knexfile');

const env = process.env.NODE_ENV || 'development';
const branch = process.env.NEON_BRANCH || '';

if (process.env.ALLOW_DB_RESET !== 'true' && (branch === 'prod' || branch === 'production')) {
    console.error('db:reset refused: NEON_BRANCH is prod/production. Set ALLOW_DB_RESET=true to override.');
    process.exit(1);
}

const knex = knexlib(knexConfig[env] || knexConfig.development);

(async () => {
    console.log('resetting schema...');
    await knex.migrate.rollback(undefined, true);
    await knex.migrate.latest();
    console.log('migrations applied');
    await knex.destroy();
})().catch(async (e) => {
    console.error(e);
    try { await knex.destroy(); } catch (_) { /* ignore */ }
    process.exit(1);
});
