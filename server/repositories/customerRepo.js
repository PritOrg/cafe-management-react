const { getDb } = require('../db/pool');
const { mapCustomer } = require('../db/mappers');

const cols = ['id', 'tenant_id', 'first_name', 'last_name', 'email', 'phone', 'profile_photo_url',
    'loyalty_points', 'membership_level', 'notifications', 'is_active', 'registration_date', 'last_login', 'created_at', 'updated_at'];

const findAll = async (tenantId) => {
    const rows = await getDb()('customers').where({ tenant_id: tenantId }).orderBy('created_at', 'desc');
    return rows.map(mapCustomer);
};

/**
 * Phase K list: search, membership filter, pagination, sort.
 */
const list = async (tenantId, { search, membership, page = 1, limit = 20, sort = 'created_at' } = {}) => {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * pageSize;
    const allowedSort = new Set(['created_at', 'first_name', 'last_name', 'loyalty_points']);
    const sortCol = allowedSort.has(sort) ? sort : 'created_at';

    let q = getDb()('customers').where({ tenant_id: tenantId });
    if (search) {
        const s = `%${search}%`;
        q = q.where((b) => {
            b.whereILike('first_name', s)
                .orWhereILike('last_name', s)
                .orWhereILike('email', s)
                .orWhereILike('phone', s);
        });
    }
    if (membership) q = q.andWhere('membership_level', membership);

    const [items, countRow] = await Promise.all([
        q.clone().select(cols).orderBy(sortCol, 'desc').limit(pageSize).offset(offset),
        q.clone().count('* as count').first(),
    ]);

    return {
        items: items.map(mapCustomer),
        total: Number(countRow?.count || 0),
        page: pageNum,
        limit: pageSize,
    };
};

const findByEmail = async (tenantId, email) => {
    const row = await getDb()('customers').where({ tenant_id: tenantId, email: email.toLowerCase() }).first();
    return row ? mapCustomer(row) : null;
};

const findByPhone = async (tenantId, phone) => {
    const rows = await getDb()('customers')
        .where({ tenant_id: tenantId, phone })
        .select('first_name', 'last_name', 'phone', 'id');
    return rows.map((r) => ({ _id: r.id, firstName: r.first_name, lastName: r.last_name, phone: r.phone }));
};

const findById = async (tenantId, id) => {
    const row = await getDb()('customers').where({ id, tenant_id: tenantId }).first();
    return row ? mapCustomer(row) : null;
};

const findOrders = async (tenantId, customerId, { limit = 50 } = {}) => {
    const rows = await getDb()('orders')
        .where({ tenant_id: tenantId, placed_by_customer: customerId })
        .orderBy('placed_at', 'desc')
        .limit(limit);
    return rows.map((r) => ({
        _id: r.id,
        orderNumber: r.order_number,
        status: r.status,
        totalAmount: Number(r.total_amount),
        finalAmount: Number(r.final_amount),
        paymentMethod: r.payment_method,
        placedAt: r.placed_at,
    }));
};

/** Derived summary from orders — never denormalized arrays (A17). */
const summary = async (tenantId, customerId) => {
    const agg = await getDb()('orders')
        .where({ tenant_id: tenantId, placed_by_customer: customerId })
        .select(
            getDb().raw('count(*)::int as orders_count'),
            getDb().raw('coalesce(sum(final_amount),0)::numeric as lifetime_value'),
            getDb().raw('max(placed_at) as last_order_at')
        )
        .first();

    const fav = await getDb()('order_items as oi')
        .join('orders as o', 'o.id', 'oi.order_id')
        .join('menu_items as mi', 'mi.id', 'oi.menu_item_id')
        .where('o.tenant_id', tenantId)
        .where('o.placed_by_customer', customerId)
        .groupBy('mi.id', 'mi.title')
        .select('mi.id as menu_item_id', 'mi.title', getDb().raw('sum(oi.quantity)::int as qty'))
        .orderBy('qty', 'desc')
        .limit(3);

    const customer = await findById(tenantId, customerId);
    const ordersCount = Number(agg?.orders_count || 0);
    const lifetime = Number(agg?.lifetime_value || 0);

    return {
        ordersCount,
        lifetimeValue: lifetime,
        lifetimeValueMinor: Math.round(lifetime * 100),
        avgOrder: ordersCount ? Number((lifetime / ordersCount).toFixed(2)) : 0,
        lastOrderAt: agg?.last_order_at || null,
        favoriteItems: fav.map((f) => ({ menuItemId: f.menu_item_id, title: f.title, qty: f.qty })),
        loyaltyPoints: customer?.loyaltyPoints || 0,
        membershipLevel: customer?.membershipLevel || 'Silver',
        isActive: customer?.isActive !== false,
    };
};

const upsertByPhone = async (tenantId, { phone, firstName, lastName, email }, trx = getDb()) => {
    if (!phone) return null;
    let row = await trx('customers').where({ tenant_id: tenantId, phone }).first();
    if (row) {
        const patch = { updated_at: new Date() };
        if (firstName) patch.first_name = firstName;
        if (lastName) patch.last_name = lastName;
        const [updated] = await trx('customers').where({ id: row.id }).update(patch).returning('*');
        return mapCustomer(updated);
    }
    const [inserted] = await trx('customers').insert({
        tenant_id: tenantId,
        phone,
        first_name: firstName || 'Guest',
        last_name: lastName || 'Customer',
        email: email || `guest+${String(phone).replace(/\D/g, '')}@guest.local`,
    }).returning('*');
    return mapCustomer(inserted);
};

const updateLoyalty = async (tenantId, customerId, { addPoints = 0, membershipLevel }, trx = getDb()) => {
    const patch = { updated_at: new Date() };
    if (addPoints) {
        patch.loyalty_points = getDb().raw('loyalty_points + ?', [addPoints]);
    }
    if (membershipLevel) patch.membership_level = membershipLevel;
    const [row] = await trx('customers')
        .where({ id: customerId, tenant_id: tenantId })
        .update(patch)
        .returning(cols);
    return row ? mapCustomer(row) : null;
};

const softDelete = async (tenantId, customerId) => {
    const [row] = await getDb()('customers')
        .where({ id: customerId, tenant_id: tenantId })
        .update({ is_active: false, updated_at: new Date() })
        .returning(cols);
    return row ? mapCustomer(row) : null;
};

module.exports = {
    findAll,
    list,
    findByEmail,
    findByPhone,
    findById,
    findOrders,
    summary,
    upsertByPhone,
    updateLoyalty,
    softDelete,
};
