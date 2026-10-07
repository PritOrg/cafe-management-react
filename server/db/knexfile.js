require('node:dns').setDefaultResultOrder('ipv4first');
const net = require('node:net');
if (typeof net.setDefaultAutoSelectFamily === 'function') {
    net.setDefaultAutoSelectFamily(false);
}

const path = require('path');

const runtimeUrl = process.env.DATABASE_URL || process.env.DB_URI;
const directUrl = process.env.DIRECT_DATABASE_URL || runtimeUrl;

const parse = (url) => {
    if (!url) return null;
    try {
        const u = new URL(url);
        const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';

        const connection = {
            host: u.hostname,
            user: decodeURIComponent(u.username || ''),
            password: decodeURIComponent(u.password || ''),
            database: u.pathname.replace(/^\//, ''),
        };

        if (u.port) {
            connection.port = Number(u.port);
        }

        if (isLocalhost) {
            connection.ssl = false;
        } else {
            connection.ssl = {
                rejectUnauthorized: false,
                servername: u.hostname,
            };
        }

        return {
            client: 'pg',
            connection,
            pool: {
                min: 0,
                max: 10,
                acquireTimeoutMillis: 30000,
                createTimeoutMillis: 30000,
                idleTimeoutMillis: 30000,
            },
        };
    } catch {
        return null;
    }
};

const base = parse(runtimeUrl) || {
    client: 'pg',
    connection: {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'cafe',
        password: process.env.PGPASSWORD || 'cafe',
        database: process.env.PGDATABASE || 'cafe',
        ssl: false,
    },
    pool: {
        min: 0,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
    },
};

module.exports = {
    development: base,
    test: {
        ...base,
        connection: {
            ...(base.connection || {}),
            database: process.env.PGDATABASE || (runtimeUrl ? (base.connection?.database || 'cafe') : 'cafe'),
        },
    },
    production: parse(directUrl) || base,
    migrations: {
        directory: path.join(__dirname, 'migrations'),
        extension: 'js',
        tableName: 'knex_migrations',
    },
    seeds: {
        directory: path.join(__dirname, 'seeds'),
        extension: 'js',
    },
};
