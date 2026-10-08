const { sendResponse } = require('../middleware/auth');
const inventoryRepo = require('../repositories/inventoryRepo');
const recipeRepo = require('../repositories/recipeRepo');
const menuRepo = require('../repositories/menuRepo');
const activityRepo = require('../repositories/activityRepo');
const events = require('../services/events');

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

exports.listRecipesForInventory = async (req, res) => {
    try {
        const recipes = await recipeRepo.listForInventory(req.tenantId, req.params.id);
        const withMenus = [];
        for (const r of recipes) {
            const menu = await menuRepo.findById(req.tenantId, r.menuItemId);
            withMenus.push({ ...r, menuItemTitle: menu?.title || null });
        }
        return sendResponse(res, 200, true, 'Recipes retrieved', withMenus);
    } catch (err) {
        console.error('Error listing recipes:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.listRecipesForMenu = async (req, res) => {
    try {
        const recipes = await recipeRepo.listForMenu(req.tenantId, req.params.id);
        return sendResponse(res, 200, true, 'Recipes retrieved', recipes);
    } catch (err) {
        console.error('Error listing menu recipes:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.addRecipe = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { menuItemId, inventoryItemId, qty, unit } = req.body || {};
        if (!menuItemId || !inventoryItemId || qty == null || !unit) {
            return sendResponse(res, 400, false, 'menuItemId, inventoryItemId, qty and unit are required');
        }
        const recipe = await recipeRepo.add(req.tenantId, { menuItemId, inventoryItemId, qty, unit });
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'recipe.add',
            entity: 'recipe',
            entityId: recipe._id,
            meta: { menuItemId, inventoryItemId, qty, unit },
        });
        return sendResponse(res, 201, true, 'Recipe added', recipe);
    } catch (err) {
        console.error('Error adding recipe:', err);
        return sendResponse(res, err.code === '23505' ? 409 : 500, false, err.message || 'Server error');
    }
};

exports.removeRecipe = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const ok = await recipeRepo.remove(req.tenantId, req.params.id);
        if (!ok) return sendResponse(res, 404, false, 'Recipe not found');
        return sendResponse(res, 200, true, 'Recipe removed');
    } catch (err) {
        console.error('Error removing recipe:', err);
        return sendResponse(res, 500, false, 'Server error');
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
        if (Number(item.quantity) <= Number(item.minQty || 0)) {
            events.emit('stock:low', {
                tenantId: req.tenantId,
                itemId: item._id,
                itemName: item.itemName,
                quantity: item.quantity,
                minQty: item.minQty,
            });
        }
        return sendResponse(res, 201, true, 'Inventory movement recorded', item);
    } catch (err) {
        console.error('Error recording inventory movement:', err);
        return sendResponse(res, err.statusCode || 500, false, err.message || 'Server error');
    }
};
