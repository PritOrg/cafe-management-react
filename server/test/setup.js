// Vitest setup — tests run against local Docker Postgres (same DB as dev)
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PGDATABASE = 'cafe';
process.env.PGHOST = process.env.PGHOST || '127.0.0.1';
process.env.PGPORT = process.env.PGPORT || '5433';
process.env.PGUSER = process.env.PGUSER || 'cafe';
process.env.PGPASSWORD = process.env.PGPASSWORD || 'cafe';
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://cafe:cafe@127.0.0.1:5433/cafe';
}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'vitest-secret';
process.env.STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local';
process.env.DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || 'cafe1';
