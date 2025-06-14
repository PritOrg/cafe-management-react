// controllers/orderController.js
const Order = require('../models/order');
const MenuItem = require('../models/menuItem');
const Discount = require('../models/discount');
const mongoose = require('mongoose');

const calculateDiscount = async (discountCode, items, totalAmount) => {
    if (!discountCode) return { discountAmount: 0, discountId: null };
    const discount = await Discount.findOne({ code: discountCode });
    if (!discount || new Date() > discount.expiresAt) return { discountAmount: 0, discountId: null };

    const applicableItemIds = discount.applicableItems.map(id => id.toString());
    const eligibleAmount = items.reduce((sum, item) => {
        return applicableItemIds.includes(item.menuItem.toString()) ? sum + item.itemPrice * item.quantity : sum;
    }, 0);

    if (totalAmount < discount.minOrderAmount) return { discountAmount: 0, discountId: null };
    const discountAmount = Math.min((eligibleAmount * discount.discountPercentage / 100), discount.maxDiscountAmount);
    return { discountAmount, discountId: discount._id };
};

exports.placeOrder = async (req, res) => {
    try {
        const {
            tableNumber,
            items,
            placedByCustomer,
            placedByStaff,
            tipAmount,
            discountCode,
            paymentMethod
        } = req.body;
        console.log(req.body);
        
        if (paymentMethod !== 'cash') {
            return res.status(400).json({ message: 'Online payments coming soon. Please pay with cash.' });
        }

        let totalAmount = 0;
        let totalPreparationTime = 0;

        const populatedItems = await Promise.all(items.map(async (item) => {
            const menu = await MenuItem.findById(item.menuItem);
            const price = menu.price[item.size];
            const itemTotal = price * item.quantity;
            totalAmount += itemTotal;
            totalPreparationTime += menu.preparationTime;
            menu.orderCount++;
            await menu.save();

            return {
                ...item,
                itemPrice: price,
                preparationTime: menu.preparationTime
            };
        }));

        const { discountAmount, discountId } = await calculateDiscount(discountCode, populatedItems, totalAmount);

        const TAX_RATE = 0.05;
        const taxAmount = (totalAmount - discountAmount) * TAX_RATE;
        const finalAmount = (totalAmount - discountAmount + taxAmount + (tipAmount || 0)).toFixed(2);

        const order = new Order({
            tableNumber,
            placedByCustomer,
            placedByStaff,
            items: populatedItems,
            tipAmount,
            discountCode: discountId,
            discountAmount,
            paymentMethod,
            paymentStatus: 'paid',
            totalAmount,
            finalAmount,
        });

        const savedOrder = await order.save();
        res.status(201).json({
            message: 'Order placed successfully',
            order: savedOrder,
            taxAmount: taxAmount.toFixed(2),
            preparationTime: totalPreparationTime
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log(err.message)
    }
};

exports.getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const orders = await Order.find(query).populate('items.menuItem').sort({ placedAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTodaysOrders = async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const orders = await Order.find({ placedAt: { $gte: start, $lte: end } })
            .populate('items.menuItem')
            .sort({ placedAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.menuItem', 'title imageUrl')
            .populate('placedBy', 'firstName lastName role');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Ensure that customers only access their own orders
        if (order.placedBy && order.placedBy._id.toString() !== req.userId && req.role === 'customer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { status, today } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (today === 'true') {
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            const end = new Date();
            end.setHours(23, 59, 59, 999);

            query.placedAt = { $gte: start, $lte: end };
        }

        const orders = await Order.find(query)
            .sort({ placedAt: -1 })
            .populate('items.menuItem', 'title imageUrl category')
            .populate('placedBy', 'firstName lastName role');

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in-progress', 'served', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;
        order.updatedAt = new Date();

        await order.save();

        // Optionally update table status if served or cancelled
        if (order.tableNumber) {
            const Table = require('../models/Table');
            const table = await Table.findOne({ number: order.tableNumber });

            if (table) {
                if (status === 'served' || status === 'cancelled') {
                    table.status = 'available';
                    table.currentOrder = null;
                } else {
                    table.status = 'occupied';
                    table.currentOrder = order._id;
                }

                await table.save();
            }
        }

        res.json({ message: 'Order status updated', status: order.status });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [
                { placedByCustomer: req.userId },
                { placedByStaff: req.userId }
            ]
        })
        .populate('placedByCustomer', 'firstName lastName role')
        .populate('placedByStaff', 'firstName lastName role')
        .populate({
            path: 'items',
            populate: {
                path: 'menuItem',
                select: 'title imageUrl category',
            },
        })
        .populate('items.menuItem')
        .sort({ placedAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
