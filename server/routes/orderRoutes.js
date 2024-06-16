const express = require('express');
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../middleware/auth');
const Order = require('../models/order'); // Adjust the path as needed
const Customer = require('../models/customer'); // Adjust the path as needed

const router = express.Router();

// Create a new order
router.post('/', ensureAuthenticated, async (req, res) => {
    try {
        const { items, totalPrice, paymentMethod } = req.body;
        const customer = await Customer.findById(req.userId);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        const order = new Order({
            customer: req.userId,
            items,
            totalPrice,
            paymentMethod
        });

        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all orders (Staff/Admin only)
router.get('/all', ensureAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find().populate('customer').populate('items.menuItem');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all orders by status
router.get('/status/:status', ensureAuthenticated, async (req, res) => {
    try {
        const { status } = req.params;
        const orders = await Order.find({ status }).populate('customer').populate('items.menuItem');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all orders by customer (Customer only)
router.get('/customer', ensureAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.userId }).populate('items.menuItem');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get an order by ID
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('customer').populate('items.menuItem');
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an order
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const updateData = req.body;

        // Only allow status and customizations to be updated by staff
        if (req.body.status) {
            updateData.status = req.body.status;
        }
        if (req.body.items) {
            updateData.items = req.body.items;
        }

        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('customer').populate('items.menuItem');
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an order
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.json({ message: 'Order deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
