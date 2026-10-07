const { sendResponse } = require('../middleware/auth');
const inventoryRepo = require('../repositories/inventoryRepo');
const activityRepo = require('../repositories/activityRepo');

const requireAdmin = (req, res) => {
    if (req.role !== 'admin' && !req.isPlatformAdmin) {
        sendResponse(res, 403, false, 'Administrator privileges required');
        return false;
    }
    return true;
};

exports.listItems = async (req, res) => {
    try {
        const { search, lowStock } = req.query;
        const items = await inventoryRepo.findAll(req.tenantId, {
            search,
            lowStock: lowStock === 'true' || lowStock === '1',
        });
        return sendResponse(res, 200, true, 'Inventory retrieved', { items });
    } catch (err) {
        console.error('Error listing inventory:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.getItem = async (req, res) => {
    try {
        const item = await inventoryRepo.findById(req.tenantId, req.params.id);
        if (!item || item.isActive === false) {
            return sendResponse(res, 404, false, 'Inventory item not found');
        }
        const movements = await inventoryRepo.listMovements(req.tenantId, req.params.id);
        return sendResponse(res, 200, true, 'Inventory item retrieved', { ...item, movements });
    } catch (err) {
        console.error('Error fetching inventory item:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.createItem = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { itemName, quantity, unit, category, minQty } = req.body || {};
        if (!itemName || !unit || !category) {
            return sendResponse(res, 400, false, 'itemName, unit and category are required');
        }
        const item = await inventoryRepo.create(req.tenantId, { itemName, quantity, unit, category, minQty });
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'inventory.create',
            entity: 'inventory',
            entityId: item._id,
            meta: { itemName: item.itemName },
        });
        return sendResponse(res, 201, true, 'Inventory item created', item);
    } catch (err) {
        console.error('Error creating inventory:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.updateItem = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const item = await inventoryRepo.updateById(req.tenantId, req.params.id, req.body || {});
        if (!item) return sendResponse(res, 404, false, 'Inventory item not found');
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'inventory.update',
            entity: 'inventory',
            entityId: item._id,
        });
        return sendResponse(res, 200, true, 'Inventory item updated', item);
    } catch (err) {
        console.error('Error updating inventory:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.deleteItem = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const item = await inventoryRepo.softDelete(req.tenantId, req.params.id);
        if (!item) return sendResponse(res, 404, false, 'Inventory item not found');
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'inventory.soft_delete',
            entity: 'inventory',
            entityId: item._id,
        });
        return sendResponse(res, 200, true, 'Inventory item deactivated', item);
    } catch (err) {
        console.error('Error deleting inventory:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.addMovement = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { type, delta, note } = req.body || {};
        if (!['purchase', 'waste', 'adjust', 'order'].includes(type)) {
            return sendResponse(res, 400, false, 'type must be purchase|waste|adjust|order');
        }
        const item = await inventoryRepo.addMovement(req.tenantId, req.params.id, {
            type,
            delta,
            note,
            actorId: req.userId,
        });
        if (!item) return sendResponse(res, 404, false, 'Inventory item not found');
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'inventory.movement',
            entity: 'inventory',
            entityId: item._id,
            meta: { type, delta },
        });
        return sendResponse(res, 201, true, 'Inventory movement recorded', item);
    } catch (err) {
        console.error('Error recording inventory movement:', err);
        return sendResponse(res, err.statusCode || 500, false, err.message || 'Server error');
    }
};
