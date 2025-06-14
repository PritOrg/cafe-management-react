const mongoose = require('mongoose');

const OrderedItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    size: {
        type: String,
        enum: ['medium', 'large'],
        required: true,
    },
    quantity: {
        type: Number,
        default: 1,
    },
    customizations: {
        type: [String],
        default: [],
    },
    specialInstructions: {
        type: String,
        default: '',
    },
    itemPrice: {
        type: Number,
        required: true,
    },
    preparationTime: {
        type: Number,
        required: true,
    }
});

const OrderSchema = new mongoose.Schema({
    tableNumber: {
        type: Number,
        required: true,
    },
    placedByCustomer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
    },
    placedByStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StaffAndAdmin',
    },
    items: [OrderedItemSchema],
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
        default: 'pending',
    },
    tipAmount: {
        type: Number,
        default: 0,
    },
    discountCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discount',
    },
    discountAmount: {
        type: Number,
        default: 0,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi', 'card'],
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    finalAmount: {
        type: Number,
        required: true,
    },
    placedAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Order', OrderSchema);
