const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [
        {
            menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
            quantity: { type: Number, required: true },
            size: { type: String, enum: ['medium', 'large'], required: true },
            customizations: [{ type: String }]
        }
    ],
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
    paymentMethod: {
        type: { type: String, enum: ['credit_card', 'paypal', 'cash'], required: true },
        details: { type: Map, of: String }
    },
    orderDate: { type: Date, default: Date.now },
    completionDate: { type: Date }
});

module.exports = mongoose.model('Order', OrderSchema);
