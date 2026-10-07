const knexlib = require('knex');
const knexConfig = require('./knexfile');

const env = process.env.NODE_ENV || 'development';
let instance = null;

const getDb = () => {
    if (!instance) {
        instance = knexlib(knexConfig[env] || knexConfig.development);
    }
    return instance;
};

const destroyDb = async () => {
    if (instance) {
        await instance.destroy();
        instance = null;
    }
};

module.exports = { getDb, destroyDb };
