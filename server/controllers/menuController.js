const { sendResponse } = require('../middleware/auth');
const handleError = require('../utils/handleError');
const uploadToFirebase = require('../utils/firebaseUpload');
const menuRepo = require('../repositories/menuRepo');
const activityRepo = require('../repositories/activityRepo');

exports.createMenuItem = async (req, res) => {
    try {
        const {
            title, subTitle, priceMedium, priceLarge,
            category, calories, preparationTime,
            customizationOptions, tags, allergens,
            sizes, categoryId, subtractStock, modifierGroupIds,
        } = req.body;

        const imageUrl = req.file
            ? await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'menu-img')
            : '';

        let parsedSizes = [];
        if (Array.isArray(sizes)) {
            parsedSizes = sizes;
        } else if (typeof sizes === 'string' && sizes.trim()) {
            try { parsedSizes = JSON.parse(sizes); } catch { parsedSizes = []; }
        }

        const item = await menuRepo.create(req.tenantId, {
            title,
            subTitle,
            category,
            categoryId: categoryId || undefined,
            price: {
                medium: parseFloat(priceMedium) || 0,
                large: parseFloat(priceLarge) || 0,
            },
            calories: parseFloat(calories) || 0,
            preparationTime: parseFloat(preparationTime) || 0,
            customizationOptions: customizationOptions?.split(',').map((opt) => opt.trim()),
            tags: tags?.split(',').map((tag) => tag.trim()),
            allergens: allergens?.split(',').map((all) => all.trim()),
            imageUrl,
            sizes: parsedSizes,
            subtractStock: subtractStock === true || subtractStock === 'true',
            modifierGroupIds: Array.isArray(modifierGroupIds)
                ? modifierGroupIds
                : (typeof modifierGroupIds === 'string' && modifierGroupIds ? modifierGroupIds.split(',').filter(Boolean) : []),
        });

        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'menu.create',
            entity: 'menuItem',
            entityId: item._id,
            meta: { title: item.title },
        });

        return sendResponse(res, 201, true, 'Menu item created', item);
    } catch (err) {
        handleError(res, err);
    }
};

exports.getAllMenuItems = async (req, res) => {
    try {
        const items = await menuRepo.findAll(req.tenantId);
        return sendResponse(res, 200, true, 'Menu items retrieved', items);
    } catch (err) {
        handleError(res, err);
    }
};

exports.getMenuItemById = async (req, res) => {
    try {
        const item = await menuRepo.findById(req.tenantId, req.params.id);
        if (!item) return sendResponse(res, 404, false, 'Item not found');
        return sendResponse(res, 200, true, 'Menu item retrieved', item);
    } catch (err) {
        handleError(res, err);
    }
};

exports.updateMenuItem = async (req, res) => {
    try {
        const body = { ...(req.body || {}) };
        if (typeof body.sizes === 'string' && body.sizes.trim()) {
            try { body.sizes = JSON.parse(body.sizes); } catch { body.sizes = []; }
        }
        const item = await menuRepo.updateById(req.tenantId, req.params.id, body);
        if (!item) return sendResponse(res, 404, false, 'Item not found');
        return sendResponse(res, 200, true, 'Menu item updated', item);
    } catch (err) {
        handleError(res, err);
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const item = await menuRepo.updateById(req.tenantId, req.params.id, { availability: false });
        if (!item) return sendResponse(res, 404, false, 'Item not found');
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'menu.soft_delete',
            entity: 'menuItem',
            entityId: item._id,
            meta: { title: item.title },
        });
        return sendResponse(res, 200, true, 'Menu item deactivated', item);
    } catch (err) {
        handleError(res, err);
    }
};
