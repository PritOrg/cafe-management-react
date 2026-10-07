const { getDb } = require('../db/pool');
const { mapOrder, mapOrderItem, mapMenuItem } = require('../db/mappers');

const withItems = async (db, orders) => {
    if (!orders.length) return orders;
    const ids = orders.map((o) => o._id || o.id).filter(Boolean);
    if (!ids.length) return orders;
    const itemRows = await db('order_items as oi')
        .leftJoin('menu_items as mi', 'oi.menu_item_id', 'mi.id')
        .whereIn('oi.order_id', ids)
        .select('oi.*', db.raw('to_jsonb(mi) - \'password\' as menu_item'));
    const byOrder = new Map();
    for (const row of itemRows) {
        const menu = row.menu_item && row.menu_item.id ? mapMenuItem(row.menu_item) : null;
        const item = mapOrderItem(row, menu);
        if (!byOrder.has(row.order_id)) byOrder.set(row.order_id, []);
        byOrder.get(row.order_id).push(item);
    }
    return orders.map((o) => ({ ...o, items: byOrder.get(o._id || o.id) || [] }));
};

const attachPeople = async (db, orders) => {
    if (!orders.length) return orders;
    const customerIds = [...new Set(orders.map((o) => o.placed_by_customer).filter(Boolean))];
    const staffIds = [...new Set(orders.map((o) => o.placed_by_staff).filter(Boolean))];
    const customers = customerIds.length
        ? await db('customers').whereIn('id', customerIds)
        : [];
    const staff = staffIds.length
        ? await db('staff_admins').whereIn('id', staffIds)
        : [];
    const cMap = new Map(customers.map((c) => [c.id, c]));
    const sMap = new Map(staff.map((s) => [s.id, s]));
    return orders.map((row) => {
        const customer = row.placed_by_customer ? cMap.get(row.placed_by_customer) : null;
        const staffRow = row.placed_by_staff ? sMap.get(row.placed_by_staff) : null;
        return { row, customer, staff: staffRow };
    });
};

const loadFull = async (db, tenantId, query = {}) => {
    let q = db('orders as o').where('o.tenant_id', tenantId);
    if (query.status) q = q.andWhere('o.status', query.status);
    if (query.placedAt) {
        if (query.placedAt.$gte) q = q.andWhere('o.placed_at', '>=', query.placedAt.$gte);
        if (query.placedAt.$lte) q = q.andWhere('o.placed_at', '<=', query.placedAt.$lte);
    }
    const rows = await q.orderBy('o.placed_at', 'desc');
    const paired = await attachPeople(db, rows);
    const shaped = paired.map(({ row, customer, staff }) => mapOrder(row, { customer, staff, items: [] }));
    return withItems(db, shaped);
};

const create = async (tenantId, data, trx = getDb()) => {
    const [row] = await trx('orders').insert({
        tenant_id: tenantId,
        order_number: data.orderNumber,
        table_number: data.tableNumber ?? null,
        placed_by_customer: data.placedByCustomer || null,
        placed_by_staff: data.placedByStaff || null,
        status: data.status || 'pending',
        tip_amount: data.tipAmount || 0,
        discount_id: data.discountCode || null,
        discount_amount: data.discountAmount || 0,
        payment_status: data.paymentStatus || 'pending',
        payment_method: data.paymentMethod,
        total_amount: data.totalAmount,
        final_amount: data.finalAmount,
    }).returning('*');

    const items = data.items || [];
    if (items.length) {
        await trx('order_items').insert(items.map((it) => ({
            order_id: row.id,
            menu_item_id: it.menuItem,
            size: it.size,
            quantity: it.quantity,
            customizations: JSON.stringify(it.customizations || []),
            special_instructions: it.specialInstructions || '',
            item_price: it.itemPrice,
            preparation_time: it.preparationTime || 0,
        })));
    }

    return mapOrder(row, { items: [] });
};

const findById = async (tenantId, id) => {
    const list = await loadFull(getDb(), tenantId, {});
    return list.find((o) => o._id === id) || null;
};

const findForHistory = async (tenantId, customerIds) => {
    if (!customerIds || !customerIds.length) return [];
    let q = getDb()('orders as o')
        .where('o.tenant_id', tenantId)
        .whereIn('o.placed_by_customer', customerIds);
    const rows = await q.orderBy('o.placed_at', 'desc');
    const paired = await attachPeople(getDb(), rows);
    const shaped = paired.map(({ row, customer, staff }) => mapOrder(row, { customer, staff, items: [] }));
    return withItems(getDb(), shaped);
};

const findMany = async (tenantId, query = {}) => loadFull(getDb(), tenantId, query);

const findByIdForOwner = async (tenantId, id) => {
    const row = await getDb()('orders').where({ id, tenant_id: tenantId }).first();
    if (!row) return null;
    const customer = row.placed_by_customer
        ? await getDb()('customers').where({ id: row.placed_by_customer }).first()
        : null;
    const staff = row.placed_by_staff
        ? await getDb()('staff_admins').where({ id: row.placed_by_staff }).first()
        : null;
    const mapped = mapOrder(row, { customer, staff, items: [] });
    return (await withItems(getDb(), [mapped]))[0];
};

const updateStatus = async (tenantId, id, status, trx = getDb()) => {
    const [row] = await trx('orders')
        .where({ id, tenant_id: tenantId })
        .update({ status, updated_at: new Date() })
        .returning('*');
    return row ? mapOrder(row, { items: [] }) : null;
};

const countToday = async (tenantId, start, end) => {
    const [{ count }] = await getDb()('orders')
        .where({ tenant_id: tenantId })
        .whereBetween('placed_at', [start, end])
        .count('* as count');
    return Number(count);
};

const findByOrderNumberPrefix = async (tenantId, prefix) => {
    const row = await getDb()('orders')
        .where({ tenant_id: tenantId })
        .whereRaw('order_number like ?', [`${prefix}-%`])
        .orderBy('order_number', 'desc')
        .first('order_number');
    return row ? { orderNumber: row.order_number } : null;
};

const incrementMenuItemOrderCount = async (tenantId, menuItemId, trx = getDb()) => {
    await trx('menu_items')
        .where({ id: menuItemId, tenant_id: tenantId })
        .increment('order_count', 1);
};

const nextOrderNumber = async (tenantId, prefix, trx = getDb()) => {
    const name = `order:${prefix}`;
    // Atomic upsert — safe under concurrent orders (forUpdate doesn't lock missing rows)
    const [row] = await trx('counters')
        .insert({ tenant_id: tenantId, name, value: 1 })
        .onConflict(['tenant_id', 'name'])
        .merge({ value: trx.raw('counters.value + 1'), updated_at: new Date() })
        .returning('value');
    const next = Number(row.value);
    return `${prefix}-${String(next).padStart(4, '0')}`;
};

module.exports = {
    create,
    findById,
    findForHistory,
    findMany,
    findByIdForOwner,
    updateStatus,
    countToday,
    findByOrderNumberPrefix,
    incrementMenuItemOrderCount,
    nextOrderNumber,
};
