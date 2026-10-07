const { sendResponse } = require('../middleware/auth');
const discountRepo = require('../repositories/discountRepo');
const activityRepo = require('../repositories/activityRepo');
const { getDb } = require('../db/pool');

const mapRaw = (row) => row && ({
    _id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    discountPercentage: Number(row.discount_percentage),
    maxDiscountAmount: Number(row.max_discount_amount),
    minOrderAmount: Number(row.min_order_amount),
    applicableItems: row.applicable_items || [],
    expiresAt: row.expires_at,
    isActive: row.is_active !== false,
});

exports.listDiscounts = async (req, res) => {
    try {
        const items = await discountRepo.findAll(req.tenantId);
        return sendResponse(res, 200, true, 'Discounts retrieved', items);
    } catch (err) {
        console.error('Error listing discounts:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.createDiscount = async (req, res) => {
    try {
        const { code, discountPercentage, maxDiscountAmount, minOrderAmount, expiresAt } = req.body || {};
        if (!code || discountPercentage == null || maxDiscountAmount == null) {
            return sendResponse(res, 400, false, 'code, discountPercentage and maxDiscountAmount are required');
        }
        const [row] = await getDb()('discounts').insert({
            tenant_id: req.tenantId,
            code: String(code).toUpperCase(),
            discount_percentage: discountPercentage,
            max_discount_amount: maxDiscountAmount,
            min_order_amount: minOrderAmount || 0,
            expires_at: expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000),
        }).returning('*');
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'discount.create',
            entity: 'discount',
            entityId: row.id,
            meta: { code: row.code },
        });
        return sendResponse(res, 201, true, 'Discount created', mapRaw(row));
    } catch (err) {
        console.error('Error creating discount:', err);
        return sendResponse(res, err.code === '23505' ? 409 : 500, false, err.message || 'Server error');
    }
};

exports.removeDiscount = async (req, res) => {
    try {
        const item = await discountRepo.softDelete(req.tenantId, req.params.id);
        if (!item) return sendResponse(res, 404, false, 'Discount not found');
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'discount.soft_delete',
            entity: 'discount',
            entityId: item._id,
            meta: { code: item.code },
        });
        return sendResponse(res, 200, true, 'Discount deactivated', item);
    } catch (err) {
        console.error('Error soft-deleting discount:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};
