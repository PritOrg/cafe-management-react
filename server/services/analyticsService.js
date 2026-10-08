const { getDb } = require('../db/pool');
const money = require('../utils/money');

const DAY_MS = 24 * 60 * 60 * 1000;

const dayBounds = (tzOffsetMinutes = 330, from = new Date(), to = new Date()) => {
    const shift = (d) => new Date(d.getTime() + tzOffsetMinutes * 60 * 1000);
    const s = new Date(shift(from));
    const e = new Date(shift(to));
    s.setUTCHours(0, 0, 0, 0);
    e.setUTCHours(0, 0, 0, 0);
    e.setUTCDate(e.getUTCDate() + 1);
    return { start: s, end: e };
};

const getBusinessTzMinutes = async (tenantId) => {
    const row = await getDb()('settings')
        .where({ tenant_id: tenantId })
        .first('data');
    const tz = row?.data?.ops?.timezone;
    // Map common IANA zones to fixed offsets used for reporting day bounds
    const map = { 'Asia/Kolkata': 330, 'Asia/Calcutta': 330, UTC: 0 };
    return map[tz] ?? 330;
};

const sum = (rows, field) => rows.reduce((acc, r) => acc + Number(r[field] || 0), 0);

/**
 * Dashboard summary for "today" vs "yesterday" (business timezone).
 */
const summary = async (tenantId) => {
    const tz = await getBusinessTzMinutes(tenantId);
    const today = dayBounds(tz, new Date(), new Date());
    const yStart = new Date(today.start.getTime() - DAY_MS);
    const yEnd = today.start;

    const db = getDb();
    const [todayOrders, yOrders, statusCounts, topItems] = await Promise.all([
        db('orders')
            .where({ tenant_id: tenantId })
            .whereBetween('placed_at', [today.start, today.end])
            .select(
                db.raw('count(*)::int as orders_count'),
                db.raw('coalesce(sum(final_amount),0)::numeric as revenue'),
                db.raw('coalesce(sum(total_amount - discount_amount),0)::numeric as taxable'),
                db.raw("count(*) filter (where status = 'pending')::int as pending_count")
            )
            .first(),
        db('orders')
            .where({ tenant_id: tenantId })
            .whereBetween('placed_at', [yStart, yEnd])
            .select(
                db.raw('count(*)::int as orders_count'),
                db.raw('coalesce(sum(final_amount),0)::numeric as revenue')
            )
            .first(),
        db('orders')
            .where({ tenant_id: tenantId })
            .whereBetween('placed_at', [today.start, today.end])
            .groupBy('status')
            .select('status', db.raw('count(*)::int as count')),
        db('order_items as oi')
            .join('orders as o', 'o.id', 'oi.order_id')
            .join('menu_items as mi', 'mi.id', 'oi.menu_item_id')
            .where('o.tenant_id', tenantId)
            .whereBetween('o.placed_at', [today.start, today.end])
            .groupBy('mi.title')
            .select('mi.title', db.raw('sum(oi.quantity)::int as qty'), db.raw('sum(oi.item_price * oi.quantity)::numeric as revenue'))
            .orderBy('qty', 'desc')
            .limit(5),
    ]);

    // GST split from orders: taxable (total-discount), tax = final - taxable - tip
    const taxRows = await db('orders')
        .where({ tenant_id: tenantId })
        .whereBetween('placed_at', [today.start, today.end])
        .select(
            db.raw('coalesce(sum(total_amount - discount_amount),0)::numeric as taxable'),
            db.raw('coalesce(sum(final_amount - (total_amount - discount_amount) - tip_amount),0)::numeric as tax')
        )
        .first();
    const taxableMinor = money.toMinor(Number(taxRows?.taxable || 0));
    const taxMinor = money.toMinor(Number(taxRows?.tax || 0));
    const cgstMinor = Math.round(taxMinor / 2);
    const sgstMinor = taxMinor - cgstMinor;

    const ordersCount = todayOrders?.orders_count || 0;
    const revenueMinor = money.toMinor(Number(todayOrders?.revenue || 0));
    const prevRevenueMinor = money.toMinor(Number(yOrders?.revenue || 0));
    const prevOrders = yOrders?.orders_count || 0;

    const byStatus = {};
    for (const row of statusCounts || []) byStatus[row.status] = row.count;

    return {
        revenueMinor,
        revenue: money.fromMinor(revenueMinor),
        ordersCount,
        aovMinor: ordersCount ? Math.round(revenueMinor / ordersCount) : 0,
        aov: ordersCount ? money.fromMinor(Math.round(revenueMinor / ordersCount)) : 0,
        pendingCount: byStatus.pending || 0,
        cancelledCount: byStatus.cancelled || 0,
        servedCount: byStatus.served || 0,
        preparingCount: byStatus.preparing || 0,
        readyCount: byStatus.ready || 0,
        covers: ordersCount,
        taxableMinor,
        taxable: money.fromMinor(taxableMinor),
        taxMinor,
        tax: money.fromMinor(taxMinor),
        cgstMinor,
        sgstMinor,
        prevDayRevenueMinor: prevRevenueMinor,
        prevDayOrdersCount: prevOrders,
        prevDayDeltaBps: prevRevenueMinor
            ? Math.round(((revenueMinor - prevRevenueMinor) / prevRevenueMinor) * 10000)
            : 0,
        topItems: (topItems || []).map((r) => ({
            title: r.title,
            qty: r.qty,
            revenue: Number(r.revenue),
            revenueMinor: money.toMinor(Number(r.revenue)),
        })),
        dayStart: today.start.toISOString(),
        dayEnd: today.end.toISOString(),
    };
};

/**
 * Daily revenue/order series + category breakdown + period deltas.
 * period: 7d | 30d | 90d | 1y
 */
const salesSeries = async (tenantId, period = '30d') => {
    const tz = await getBusinessTzMinutes(tenantId);
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30;
    const now = new Date();
    const startBound = dayBounds(tz, new Date(now.getTime() - (days - 1) * DAY_MS), now);
    const halfStart = new Date(startBound.start.getTime() - days * DAY_MS);

    const db = getDb();
    const offset = `${tz} minutes`;
    const [series, breakdown, prevAgg, taxAgg] = await Promise.all([
        db('orders')
            .where({ tenant_id: tenantId })
            .whereBetween('placed_at', [startBound.start, startBound.end])
            .groupByRaw(`date_trunc('day', placed_at - interval '${offset}')`)
            .select(
                db.raw(`date_trunc('day', placed_at - interval '${offset}')::date as day`),
                db.raw('coalesce(sum(final_amount),0)::numeric as revenue'),
                db.raw('count(*)::int as orders_count')
            )
            .orderBy('day'),
        db('order_items as oi')
            .join('orders as o', 'o.id', 'oi.order_id')
            .join('menu_items as mi', 'mi.id', 'oi.menu_item_id')
            .where('o.tenant_id', tenantId)
            .whereBetween('o.placed_at', [startBound.start, startBound.end])
            .groupBy('mi.category')
            .select('mi.category', db.raw('sum(oi.item_price * oi.quantity)::numeric as revenue'), db.raw('sum(oi.quantity)::int as qty'))
            .orderBy('revenue', 'desc'),
        db('orders')
            .where({ tenant_id: tenantId })
            .whereBetween('placed_at', [halfStart, startBound.start])
            .select(
                db.raw('coalesce(sum(final_amount),0)::numeric as revenue'),
                db.raw('count(*)::int as orders_count')
            )
            .first(),
        db('orders')
            .where({ tenant_id: tenantId })
            .whereBetween('placed_at', [startBound.start, startBound.end])
            .select(
                db.raw('coalesce(sum(total_amount - discount_amount),0)::numeric as taxable'),
                db.raw('coalesce(sum(final_amount - (total_amount - discount_amount) - tip_amount),0)::numeric as tax')
            )
            .first(),
    ]);

    const taxableMinor = money.toMinor(Number(taxAgg?.taxable || 0));
    const taxMinor = money.toMinor(Number(taxAgg?.tax || 0));
    const cgstMinor = Math.round(taxMinor / 2);
    const sgstMinor = taxMinor - cgstMinor;

    const periodRevenue = sum(series, 'revenue');
    const periodOrders = sum(series, 'orders_count');
    const prevRevenue = Number(prevAgg?.revenue || 0);
    const prevOrders = prevAgg?.orders_count || 0;
    const revenueForShare = periodRevenue || 1;

    const breakdownRows = (breakdown || []).map((r) => ({
        category: r.category || 'Uncategorized',
        revenue: Number(r.revenue),
        revenueMinor: money.toMinor(Number(r.revenue)),
        qty: r.qty,
        shareBps: Math.round((Number(r.revenue) / revenueForShare) * 10000),
    }));

    return {
        period,
        series: (series || []).map((r) => ({
            date: r.day,
            revenue: Number(r.revenue),
            revenueMinor: money.toMinor(Number(r.revenue)),
            ordersCount: r.orders_count,
        })),
        breakdown: breakdownRows,
        totalRevenue: periodRevenue,
        totalRevenueMinor: money.toMinor(periodRevenue),
        totalOrders: periodOrders,
        taxableMinor,
        taxMinor,
        cgstMinor,
        sgstMinor,
        revenueChangePct: prevRevenue ? Math.round(((periodRevenue - prevRevenue) / prevRevenue) * 10000) / 100 : 0,
        ordersChangePct: prevOrders ? Math.round(((periodOrders - prevOrders) / prevOrders) * 10000) / 100 : 0,
    };
};

/** Counts by status + payment method for a period. */
const orderStats = async (tenantId, period = '30d') => {
    const tz = await getBusinessTzMinutes(tenantId);
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30;
    const now = new Date();
    const bounds = dayBounds(tz, new Date(now.getTime() - (days - 1) * DAY_MS), now);

    const db = getDb();
    const [byStatus, byPayment] = await Promise.all([
        db('orders')
            .where({ tenant_id: tenantId })
            .whereBetween('placed_at', [bounds.start, bounds.end])
            .groupBy('status')
            .select('status', db.raw('count(*)::int as count')),
        db('orders')
            .where({ tenant_id: tenantId })
            .whereBetween('placed_at', [bounds.start, bounds.end])
            .groupBy('payment_method')
            .select('payment_method', db.raw('count(*)::int as count'), db.raw('coalesce(sum(final_amount),0)::numeric as revenue')),
    ]);

    return {
        period,
        byStatus: Object.fromEntries((byStatus || []).map((r) => [r.status, r.count])),
        byPaymentMethod: (byPayment || []).map((r) => ({
            method: r.payment_method,
            count: r.count,
            revenue: Number(r.revenue),
            revenueMinor: money.toMinor(Number(r.revenue)),
        })),
    };
};

const topItems = async (tenantId, period = '30d', limit = 10) => {
    const tz = await getBusinessTzMinutes(tenantId);
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30;
    const now = new Date();
    const bounds = dayBounds(tz, new Date(now.getTime() - (days - 1) * DAY_MS), now);

    const db = getDb();
    const rows = await db('order_items as oi')
        .join('orders as o', 'o.id', 'oi.order_id')
        .join('menu_items as mi', 'mi.id', 'oi.menu_item_id')
        .where('o.tenant_id', tenantId)
        .whereBetween('o.placed_at', [bounds.start, bounds.end])
        .groupBy('mi.id', 'mi.title')
        .select(
            'mi.id as menu_item_id',
            'mi.title',
            db.raw('count(distinct o.id)::int as orders_count'),
            db.raw('sum(oi.quantity)::int as qty'),
            db.raw('sum(oi.item_price * oi.quantity)::numeric as revenue')
        )
        .orderBy('qty', 'desc')
        .limit(Number(limit) || 10);

    return rows.map((r) => ({
        menuItemId: r.menu_item_id,
        title: r.title,
        ordersCount: r.orders_count,
        qty: r.qty,
        revenue: Number(r.revenue),
        revenueMinor: money.toMinor(Number(r.revenue)),
    }));
}

const categoryMix = async (tenantId, period = '30d') => {
    const tz = await getBusinessTzMinutes(tenantId);
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[period] || 30;
    const now = new Date();
    const bounds = dayBounds(tz, new Date(now.getTime() - (days - 1) * DAY_MS), now);

    const db = getDb();
    const rows = await db('order_items as oi')
        .join('orders as o', 'o.id', 'oi.order_id')
        .join('menu_items as mi', 'mi.id', 'oi.menu_item_id')
        .where('o.tenant_id', tenantId)
        .whereBetween('o.placed_at', [bounds.start, bounds.end])
        .groupBy('mi.category')
        .select(
            'mi.category',
            db.raw('sum(oi.quantity)::int as qty'),
            db.raw('sum(oi.item_price * oi.quantity)::numeric as revenue')
        );

    const totalRev = rows.reduce((a, r) => a + Number(r.revenue || 0), 0) || 1;
    return rows.map((r) => ({
        category: r.category || 'Uncategorized',
        qty: r.qty,
        revenue: Number(r.revenue),
        revenueMinor: money.toMinor(Number(r.revenue)),
        shareBps: Math.round((Number(r.revenue) / totalRev) * 10000),
    }));
};

module.exports = { summary, salesSeries, orderStats, topItems, categoryMix };
