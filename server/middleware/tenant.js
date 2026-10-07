const tenantRepo = require('../repositories/tenantRepo');
const { sendResponse } = require('./auth');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

const extractTenantSlug = (rawHost) => {
    if (!rawHost) return null;
    const host = String(rawHost).split(':')[0].toLowerCase();
    if (LOCAL_HOSTS.has(host)) return null;
    if (host.endsWith('.localhost')) {
        return host.split('.')[0] || null;
    }
    const labels = host.split('.');
    if (labels.length >= 3) {
        return labels[0] || null;
    }
    return null;
};

const resolveTenant = async (req, res, next) => {
    try {
        let slug = extractTenantSlug(req.headers.host);
        if (!slug) {
            slug = (process.env.DEFAULT_TENANT_SLUG || '').toLowerCase() || null;
        }
        if (!slug) {
            return sendResponse(res, 404, false, 'Tenant not found');
        }
        const tenant = await tenantRepo.findBySlug(slug);
        if (!tenant) {
            return sendResponse(res, 404, false, 'Tenant not found');
        }
        if (tenant.status !== 'active') {
            return sendResponse(res, 403, false, 'Tenant suspended');
        }
        req.tenant = tenant;
        req.tenantId = String(tenant._id);
        req.tenantSlug = tenant.slug;
        next();
    } catch (err) {
        console.error('Tenant resolution error:', err);
        return sendResponse(res, 500, false, 'Tenant resolution failed');
    }
};

module.exports = { resolveTenant, extractTenantSlug };
