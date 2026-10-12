import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import staffRepo from '../repositories/staffRepo.js';
import { hashPassword, verifyPassword } from '../services/authService.js';

let tenant;
let admin;

describe('self-service password change (repo + hashing wiring)', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1');
        admin = await staffRepo.findByEmail(tenant._id, 'admin@cafe1.local');
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('updates the hash so the new password verifies and the old one no longer does', async () => {
        const old = await staffRepo.findByEmailForLogin(tenant._id, 'admin@cafe1.local');
        expect(await verifyPassword('Admin123!', old.password)).toBe(true);

        const fresh = await hashPassword('BetaPass9!');
        await staffRepo.updatePassword(tenant._id, admin._id, fresh);

        const changed = await staffRepo.findByEmailForLogin(tenant._id, 'admin@cafe1.local');
        expect(await verifyPassword('BetaPass9!', changed.password)).toBe(true);
        expect(await verifyPassword('Admin123!', changed.password)).toBe(false);

        // restore the demo password for other suites
        await staffRepo.updatePassword(tenant._id, admin._id, await hashPassword('Admin123!'));
    });
});