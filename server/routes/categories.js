const express = require('express');
const router = express.Router();
const categoryRepo = require('../repositories/categoryRepo');
const { sendResponse, ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const activityRepo = require('../repositories/activityRepo');

router.use(ensureAuthenticated);

router.get('/', async (req, res) => {
    try {
        const items = await categoryRepo.findAll(req.tenantId, { includeInactive: req.query.includeInactive === 'true' });
        return sendResponse(res, 200, true, 'Categories retrieved', items);
    } catch (err) {
        console.error('Error listing categories:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
});

router.post('/', ensureAdmin, async (req, res) => {
    try {
        const { name, slug, sortOrder } = req.body || {};
        if (!name) return sendResponse(res, 400, false, 'name is required');
        const cat = await categoryRepo.create(req.tenantId, { name, slug, sortOrder });
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'category.create',
            entity: 'category',
            entityId: cat._id,
            meta: { name: cat.name },
        });
        return sendResponse(res, 201, true, 'Category created', cat);
    } catch (err) {
        console.error('Error creating category:', err);
        return sendResponse(res, err.code === '23505' ? 409 : 500, false, err.message || 'Server error');
    }
});

router.put('/:id', ensureAdmin, async (req, res) => {
    try {
        const cat = await categoryRepo.updateById(req.tenantId, req.params.id, req.body || {});
        if (!cat) return sendResponse(res, 404, false, 'Category not found');
        return sendResponse(res, 200, true, 'Category updated', cat);
    } catch (err) {
        console.error('Error updating category:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
});

router.delete('/:id', ensureAdmin, async (req, res) => {
    try {
        const cat = await categoryRepo.deleteById(req.tenantId, req.params.id);
        if (!cat) return sendResponse(res, 404, false, 'Category not found');
        return sendResponse(res, 200, true, 'Category deleted', cat);
    } catch (err) {
        console.error('Error deleting category:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
});

module.exports = router;
