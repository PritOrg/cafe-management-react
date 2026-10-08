const { sendResponse } = require('../middleware/auth');
const handleError = require('../utils/handleError');
const uploadToStorage = require('../utils/storage');
const { deleteStoredImage } = require('../utils/storage');
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
            ? await uploadToStorage(req.file.buffer, req.file.originalname, req.file.mimetype, 'menu-img')
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

        const toList = (value) => (Array.isArray(value)
            ? value
            : String(value || '').split(',').map((s) => s.trim()).filter(Boolean));
        if (body.customizationOptions !== undefined) body.customizationOptions = toList(body.customizationOptions);
        if (body.tags !== undefined) body.tags = toList(body.tags);
        if (body.allergens !== undefined) body.allergens = toList(body.allergens);
        if (body.calories !== undefined) body.calories = parseFloat(body.calories) || 0;
        if (body.preparationTime !== undefined) body.preparationTime = parseFloat(body.preparationTime) || 0;
        if (body.priceMedium !== undefined || body.priceLarge !== undefined) {
            body.price = {
                medium: parseFloat(body.priceMedium) || 0,
                large: parseFloat(body.priceLarge) || 0,
            };
        }
        if (body.subtractStock !== undefined) {
            body.subtractStock = body.subtractStock === true || body.subtractStock === 'true';
        }

        // Replace semantics: upload the new image, then delete the previous one.
        let previousImageUrl = null;
        if (req.file) {
            const existing = await menuRepo.findByIdLean(req.tenantId, req.params.id);
            if (!existing) return sendResponse(res, 404, false, 'Item not found');
            previousImageUrl = existing.imageUrl;
            body.imageUrl = await uploadToStorage(req.file.buffer, req.file.originalname, req.file.mimetype, 'menu-img');
        }

        const item = await menuRepo.updateById(req.tenantId, req.params.id, body);
        if (!item) return sendResponse(res, 404, false, 'Item not found');

        // Keep only the new image (frees Cloudinary/local storage of orphans).
        if (req.file && previousImageUrl && previousImageUrl !== item.imageUrl) {
            await deleteStoredImage(previousImageUrl);
        }

        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'menu.update',
            entity: 'menuItem',
            entityId: item._id,
            meta: { title: item.title },
        });

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
