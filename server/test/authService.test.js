import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { hashPassword, verifyPassword } from '../services/authService.js';
import { getTransporter, isMailConfigured } from '../middleware/nodemailer.js';

describe('authService', () => {
    it('hashes and verifies passwords', async () => {
        const h = await hashPassword('Passw0rd!1');
        expect(h).toBeTruthy();
        expect(h).not.toBe('Passw0rd!1');
        expect(await verifyPassword('Passw0rd!1', h)).toBe(true);
        expect(await verifyPassword('nope', h)).toBe(false);
        expect(await verifyPassword('x', null)).toBe(false);
    });
});

describe('nodemailer env driver', () => {
    it('reports mail not configured without SMTP_HOST', () => {
        const prev = process.env.SMTP_HOST;
        delete process.env.SMTP_HOST;
        expect(isMailConfigured()).toBe(false);
        expect(getTransporter()).toBe(null);
        if (prev !== undefined) process.env.SMTP_HOST = prev;
    });
});

describe('storage local driver', () => {
    it('writes file and returns public URL when STORAGE_DRIVER=local', async () => {
        const prev = process.env.STORAGE_DRIVER;
        process.env.STORAGE_DRIVER = 'local';
        // re-require fresh module
        const modPath = path.resolve('utils/storage.js');
        delete require.cache[require.resolve(modPath)];
        const upload = require(modPath);
        const buf = Buffer.from('hello-pdf-bytes');
        const url = await upload(buf, 'test.txt', 'text/plain', 'menu-img');
        expect(url).toContain('/uploads/');
        expect(url).toContain('test.txt');
        process.env.STORAGE_DRIVER = prev;
    });
});
