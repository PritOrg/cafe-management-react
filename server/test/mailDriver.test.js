import { describe, it, expect, vi, afterEach } from 'vitest';

const loadMail = async (env) => {
    vi.resetModules();
    process.env = { NODE_ENV: 'test', ...env };
    return import('../middleware/nodemailer.js');
};

afterEach(() => {
    vi.resetModules();
    process.env = {};
});

describe('mail driver (SMTP + Brevo)', () => {
    it('is unconfigured when neither SMTP_HOST nor BREVO_API_KEY is set', async () => {
        const m = await loadMail({});
        expect(m.isMailConfigured()).toBe(false);
        expect(m.getTransporter()).toBeNull();
    });

    it('uses the Brevo relay when only BREVO_API_KEY is set', async () => {
        const m = await loadMail({ BREVO_API_KEY: 'brevo-key-123', MAIL_FROM: 'orders@mysite.com' });
        expect(m.isMailConfigured()).toBe(true);
        const t = m.getTransporter();
        expect(t.options.host).toBe('smtp-relay.brevo.com');
        expect(t.options.port).toBe(587);
        expect(t.options.auth.user).toBe('orders@mysite.com');
        expect(t.options.auth.pass).toBe('brevo-key-123');
    });

    it('lets SMTP_USER / SMTP_PASS win over Brevo defaults', async () => {
        const m = await loadMail({
            SMTP_HOST: 'smtp.custom.com',
            SMTP_USER: 'user@custom.com',
            SMTP_PASS: 'smtp-pass',
            BREVO_API_KEY: 'ignored-key',
        });
        const t = m.getTransporter();
        expect(t.options.host).toBe('smtp.custom.com');
        expect(t.options.auth.pass).toBe('smtp-pass');
    });
});