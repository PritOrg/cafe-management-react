const { sendResponse } = require('../middleware/auth');
const settingsRepo = require('../repositories/settingsRepo');
const activityRepo = require('../repositories/activityRepo');

exports.getPublicSettings = async (req, res) => {
    try {
        const data = await settingsRepo.getPublic(req.tenantId);
        return sendResponse(res, 200, true, 'Settings retrieved', data);
    } catch (err) {
        console.error('Error fetching public settings:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.getSettings = async (req, res) => {
    try {
        const doc = await settingsRepo.getOrCreate(req.tenantId);
        return sendResponse(res, 200, true, 'Settings retrieved', doc.data);
    } catch (err) {
        console.error('Error fetching settings:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const patch = req.body || {};
        const data = await settingsRepo.update(req.tenantId, patch);
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'settings.update',
            entity: 'settings',
            meta: { keys: Object.keys(patch) },
        });
        return sendResponse(res, 200, true, 'Settings updated', data);
    } catch (err) {
        console.error('Error updating settings:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

/** Admin: report which optional integrations are configured (no secrets exposed). */
exports.getIntegrations = async (req, res) => {
    try {
        const { resolveStorageDriver } = require('../utils/storage');
        const { isMailConfigured } = require('../middleware/nodemailer');
        return sendResponse(res, 200, true, 'Integrations retrieved', {
            mail: {
                configured: isMailConfigured(),
                host: process.env.SMTP_HOST || null,
                from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
            },
            storage: {
                driver: resolveStorageDriver(),
                cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
                publicUploadUrl: process.env.PUBLIC_UPLOAD_URL || null,
            },
        });
    } catch (err) {
        console.error('Error fetching integrations:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

/** Admin: send a test email through the configured SMTP driver. */
exports.sendTestEmail = async (req, res) => {
    try {
        const { sendMail, isMailConfigured } = require('../middleware/nodemailer');
        if (!isMailConfigured()) {
            return sendResponse(res, 400, false, 'SMTP is not configured (set SMTP_HOST)');
        }
        const to = String((req.body && req.body.to) || '').trim();
        if (!to) return sendResponse(res, 400, false, 'Recipient email is required');

        const doc = await settingsRepo.getOrCreate(req.tenantId);
        const brand = doc.data?.brand || {};
        await sendMail({
            to,
            subject: `Test email from ${brand.title || 'your POS'}`,
            html: `<p>This is a test email — your SMTP settings are working.</p>`,
        });
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'settings.test_email',
            entity: 'settings',
            meta: { to },
        });
        return sendResponse(res, 200, true, 'Test email sent', { to });
    } catch (err) {
        console.error('Error sending test email:', err);
        return sendResponse(res, 500, false, err.message || 'Failed to send test email');
    }
};
