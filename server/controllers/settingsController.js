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
