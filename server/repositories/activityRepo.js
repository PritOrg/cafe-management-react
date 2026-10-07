const { getDb } = require('../db/pool');
const { mapActivity } = require('../db/mappers');

const log = async ({ tenantId, actorId, actorType, action, entity, entityId, meta, requestId }) => {
    try {
        const [row] = await getDb()('activity_logs').insert({
            tenant_id: tenantId || null,
            actor_id: actorId || null,
            actor_type: actorType || 'system',
            action,
            entity,
            entity_id: entityId || null,
            meta: meta || {},
            request_id: requestId || null,
        }).returning('*');
        return row || null;
    } catch (err) {
        console.error('logActivity failed:', err.message);
        return null;
    }
};

const listByTenant = async (tenantId, limit = 100) => {
    const rows = await getDb()('activity_logs')
        .where({ tenant_id: tenantId })
        .orderBy('created_at', 'desc')
        .limit(limit);
    return rows.map(mapActivity);
};

module.exports = { log, listByTenant };
