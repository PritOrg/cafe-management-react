const activityRepo = require('../repositories/activityRepo');

/**
 * Thin domain wrapper — callers pass actor/action/entity/meta.
 * Failures are swallowed by activityRepo.log (never break business ops).
 */
const logActivity = async (payload) => activityRepo.log(payload);

const listByTenant = async (tenantId, limit = 100) => activityRepo.listByTenant(tenantId, limit);

module.exports = { logActivity, listByTenant };
