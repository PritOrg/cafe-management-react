const express = require('express');
const router = express.Router();
const modifierRepo = require('../repositories/modifierRepo');
const { sendResponse, ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const activityRepo = require('../repositories/activityRepo');

router.use(ensureAuthenticated);

router.get('/', async (req, res) => {
    try {
        const groups = await modifierRepo.listGroups(req.tenantId);
        return sendResponse(res, 200, true, 'Modifier groups retrieved', groups);
    } catch (err) {
        console.error('Error listing modifiers:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
});

router.post('/', ensureAdmin, async (req, res) => {
    try {
        const { name, displayType, options } = req.body || {};
        if (!name) return sendResponse(res, 400, false, 'name is required');
        const group = await modifierRepo.createGroup(req.tenantId, { name, displayType, options });
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'modifier.create',
            entity: 'modifierGroup',
            entityId: group._id,
        });
        return sendResponse(res, 201, true, 'Modifier group created', group);
    } catch (err) {
        console.error('Error creating modifier group:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
});

router.put('/:id', ensureAdmin, async (req, res) => {
    try {
        const group = await modifierRepo.updateGroup(req.tenantId, req.params.id, req.body || {});
        if (!group) return sendResponse(res, 404, false, 'Modifier group not found');
        return sendResponse(res, 200, true, 'Modifier group updated', group);
    } catch (err) {
        console.error('Error updating modifier group:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
});

router.delete('/:id', ensureAdmin, async (req, res) => {
    try {
        const ok = await modifierRepo.deleteGroup(req.tenantId, req.params.id);
        if (!ok) return sendResponse(res, 404, false, 'Modifier group not found');
        return sendResponse(res, 200, true, 'Modifier group deleted');
    } catch (err) {
        console.error('Error deleting modifier group:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
});

module.exports = router;
