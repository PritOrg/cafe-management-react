const { sendResponse } = require('../middleware/auth');
const { ORDER_STATUSES } = require('../constants/order');
const orderService = require('../services/orderService');
const orderRepo = require('../repositories/orderRepo');
const customerRepo = require('../repositories/customerRepo');
const tableRepo = require('../repositories/tableRepo');
const activityRepo = require('../repositories/activityRepo');
const events = require('../services/events');

exports.placeOrder = async (req, res) => {
    try {
        const result = await orderService.placeOrder(req);
        return sendResponse(res, result.status, result.status < 400, result.message, result.data || null);
    } catch (err) {
        console.error('Error placing order:', err);
        return sendResponse(res, 500, false, err.message || 'Failed to place order');
    }
};

exports.getOrderHistory = async (req, res) => {
    try {
        const phone = String(req.query.phone || '').trim();
        if (!phone) {
            return sendResponse(res, 400, false, 'phone query parameter is required');
        }
        const customers = await customerRepo.findByPhone(req.tenantId, phone);
        if (!customers.length) {
            return sendResponse(res, 200, true, 'Order history retrieved', { customer: null, orders: [] });
        }
        const ids = customers.map((c) => c._id);
        const orders = await orderRepo.findForHistory(req.tenantId, ids);
        return sendResponse(res, 200, true, 'Order history retrieved', {
            customer: customers[0],
            orders,
        });
    } catch (err) {
        console.error('Error fetching order history:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.query;
        if (status && !ORDER_STATUSES.includes(status)) {
            return sendResponse(res, 400, false, `Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`);
        }
        const orders = await orderRepo.findMany(req.tenantId, status ? { status } : {});
        return sendResponse(res, 200, true, 'Orders retrieved', orders);
    } catch (err) {
        console.error('Error fetching orders by status:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.getTodaysOrders = async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const orders = await orderRepo.findMany(req.tenantId, { placedAt: { $gte: start, $lte: end } });
        return sendResponse(res, 200, true, "Today's orders retrieved", orders);
    } catch (err) {
        console.error('Error fetching todays orders:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.getOrderById = async (req, res) => {    try {
        const order = await orderRepo.findByIdForOwner(req.tenantId, req.params.id);
        if (!order) {
            return sendResponse(res, 404, false, 'Order not found');
        }
        const isStaffOrAdmin = req.role === 'admin' || req.role === 'staff' || req.isPlatformAdmin;
        if (!isStaffOrAdmin) {
            const ownerId = order.placedByCustomer && (
                order.placedByCustomer._id
                    ? order.placedByCustomer._id.toString()
                    : order.placedByCustomer.toString()
            );
            if (!ownerId || ownerId !== (req.userId && req.userId.toString())) {
                return sendResponse(res, 403, false, 'Access denied');
            }
        }
        return sendResponse(res, 200, true, 'Order retrieved', order);
    } catch (error) {
        console.error('Error fetching order:', error);
        return sendResponse(res, 500, false, 'Server error');
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { status, today, staffId } = req.query;
        if (status && !ORDER_STATUSES.includes(status)) {
            return sendResponse(res, 400, false, `Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`);
        }
        const query = {};
        if (status) query.status = status;
        if (staffId) query.staffId = staffId;
        if (today === 'true') {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            query.placedAt = { $gte: start, $lte: end };
        }
        const orders = await orderRepo.findMany(req.tenantId, query);
        return sendResponse(res, 200, true, 'Orders retrieved', orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return sendResponse(res, 500, false, 'Server error');
    }
};

/** Reassign an order to a staff member (or unassign). Any staff/admin may do it. */
exports.assignOrder = async (req, res) => {
    try {
        const staffId = (req.body && req.body.staffId) || null;
        const order = await orderRepo.assignStaff(req.tenantId, req.params.id, staffId);
        if (!order) return sendResponse(res, 404, false, 'Order not found');
        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'order.assign',
            entity: 'order',
            entityId: order._id,
            meta: { staffId },
        });
        events.emit('order:status', { tenantId: req.tenantId, orderId: order._id, status: order.status });
        return sendResponse(res, 200, true, 'Order reassigned', order);
    } catch (err) {
        console.error('Error assigning order:', err);
        return sendResponse(res, 500, false, err.message || 'Server error');
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!ORDER_STATUSES.includes(status)) {
            return sendResponse(res, 400, false, `Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`);
        }
        const previousStatus = await orderRepo.findStatus(req.tenantId, req.params.id);
        const order = await orderRepo.updateStatus(req.tenantId, req.params.id, status);
        if (!order) return sendResponse(res, 404, false, 'Order not found');

        if (order.tableNumber) {
            if (status === 'served' || status === 'cancelled') {
                await tableRepo.updateByNumber(req.tenantId, order.tableNumber, { status: 'available', currentOrder: null });
            } else {
                await tableRepo.updateByNumber(req.tenantId, order.tableNumber, { status: 'occupied', currentOrder: order._id });
            }
        }

        await activityRepo.log({
            tenantId: req.tenantId,
            actorId: req.userId,
            actorType: req.role,
            action: 'order.status',
            entity: 'order',
            entityId: order._id,
            requestId: req.id,
            meta: { status, before: previousStatus, after: status },
        });

        events.emit('order:status', {
            tenantId: req.tenantId,
            orderId: order._id,
            status: order.status,
        });

        return sendResponse(res, 200, true, 'Order status updated', { status: order.status });
    } catch (error) {
        console.error('Error updating order status:', error);
        return sendResponse(res, 500, false, 'Server error');
    }
};
