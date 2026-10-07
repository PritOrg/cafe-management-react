const { sendResponse } = require('../middleware/auth');
const { getDb } = require('../db/pool');

const mapActivity = (row) => row && ({
    _id: row.id,
    id: row.id,
    tenantId: row.tenant_id,
    actorId: row.actor_id,
    actorType: row.actor_type,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    meta: row.meta || {},
    requestId: row.request_id || null,
    createdAt: row.created_at,
});

/** Admin: list tenant activity with filters + pagination */
exports.listActivities = async (req, res) => {
    try {
        const { action, actorId, entityType, entityId, from, to, page, limit } = req.query;
        const pageNum = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(200, Math.max(1, Number(limit) || 50));
        const offset = (pageNum - 1) * pageSize;

        let q = getDb()('activity_logs').where({ tenant_id: req.tenantId });
        if (action) q = q.andWhere('action', action);
        if (actorId) q = q.andWhere('actor_id', actorId);
        if (entityType) q = q.andWhere('entity', entityType);
        if (entityId) q = q.andWhere('entity_id', entityId);
        if (from) q = q.andWhere('created_at', '>=', from);
        if (to) q = q.andWhere('created_at', '<=', to);

        const [items, countRow] = await Promise.all([
            q.clone().select('*').orderBy('created_at', 'desc').limit(pageSize).offset(offset),
            q.clone().count('* as count').first(),
        ]);

        return sendResponse(res, 200, true, 'Activity retrieved', {
            items: items.map(mapActivity),
            total: Number(countRow?.count || 0),
            page: pageNum,
            limit: pageSize,
        });
    } catch (err) {
        console.error('Error listing activity:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};

/** Per-entity history (order/invoice/menu/customer) */
exports.getEntityHistory = async (req, res) => {
    try {
        const { type, id } = req.params;
        const rows = await getDb()('activity_logs')
            .where({ tenant_id: req.tenantId, entity: type, entity_id: id })
            .orderBy('created_at', 'desc')
            .limit(100);
        return sendResponse(res, 200, true, 'Entity history retrieved', rows.map(mapActivity));
    } catch (err) {
        console.error('Error fetching entity history:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};
