const { sendResponse } = require('../middleware/auth');
const staffRepo = require('../repositories/staffRepo');
const activityRepo = require('../repositories/activityRepo');

exports.getAllStaff = async (req, res) => {
    try {
        const staff = await staffRepo.findAll(req.tenantId);
        return sendResponse(res, 200, true, 'Staff retrieved', staff);
    } catch (err) {
        console.error('Error fetching staff:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.addStaff = async (req, res) => {
    try {
        const newStaff = await staffRepo.create(req.tenantId, req.body);
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'staff.create',
            entity: 'staff',
            entityId: newStaff._id,
            meta: { email: newStaff.email, role: newStaff.role },
        });
        return sendResponse(res, 201, true, 'Staff added', newStaff);
    } catch (err) {
        console.error('Error adding staff:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const updated = await staffRepo.updateById(req.tenantId, req.params.id, req.body);
        if (!updated) return sendResponse(res, 404, false, 'Staff not found');
        return sendResponse(res, 200, true, 'Staff updated', updated);
    } catch (err) {
        console.error('Error updating staff:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.removeStaff = async (req, res) => {
    try {
        const removed = await staffRepo.deleteById(req.tenantId, req.params.id);
        if (!removed) return sendResponse(res, 404, false, 'Staff not found');
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'staff.soft_delete',
            entity: 'staff',
            entityId: removed._id,
            meta: { email: removed.email },
        });
        return sendResponse(res, 200, true, 'Staff deactivated', removed);
    } catch (err) {
        console.error('Error removing staff:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};
