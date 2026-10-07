const { sendResponse } = require('../middleware/auth');
const tenantRepo = require('../repositories/tenantRepo');
const activityRepo = require('../repositories/activityRepo');

exports.listTenants = async (req, res) => {
    try {
        const tenants = await tenantRepo.findAll();
        return sendResponse(res, 200, true, 'Tenants retrieved', tenants);
    } catch (err) {
        console.error('Error listing tenants:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.createTenant = async (req, res) => {
    try {
        const { slug, name } = req.body;
        if (!slug || !name) {
            return sendResponse(res, 400, false, 'slug and name are required');
        }
        const normalized = String(slug).toLowerCase().trim();
        if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized)) {
            return sendResponse(res, 400, false, 'slug must be a valid DNS label');
        }
        const existing = await tenantRepo.findBySlug(normalized);
        if (existing) {
            return sendResponse(res, 409, false, 'Tenant slug already exists');
        }
        const tenant = await tenantRepo.create({ slug: normalized, name: String(name).trim() });
        await activityRepo.log({
            tenantId: tenant._id,
            actorId: req.userId,
            actorType: 'platform',
            action: 'tenant.create',
            entity: 'tenant',
            entityId: tenant._id,
            meta: { slug: tenant.slug },
        });
        return sendResponse(res, 201, true, 'Tenant created', tenant);
    } catch (err) {
        console.error('Error creating tenant:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const allowed = {};
        if (req.body.name) allowed.name = String(req.body.name).trim();
        if (req.body.status) {
            if (!['active', 'suspended'].includes(req.body.status)) {
                return sendResponse(res, 400, false, 'status must be active or suspended');
            }
            allowed.status = req.body.status;
        }
        const tenant = await tenantRepo.updateById(id, allowed);
        if (!tenant) return sendResponse(res, 404, false, 'Tenant not found');
        return sendResponse(res, 200, true, 'Tenant updated', tenant);
    } catch (err) {
        console.error('Error updating tenant:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};
