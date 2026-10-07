const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const hashPassword = async (plain) => bcrypt.hash(plain, SALT_ROUNDS);

const verifyPassword = async (plain, hash) => {
    if (!plain || !hash) return false;
    return bcrypt.compare(plain, hash);
};

module.exports = { hashPassword, verifyPassword, SALT_ROUNDS };
