// To manage financial transactions, including payments and refunds.

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    transactionDate: { type: Date, default: Date.now },
    paymentMethod: {
        type: { type: String, enum: ['credit_card', 'paypal', 'cash'], required: true },
        details: { type: Map, of: String }
    },
    transactionType: { type: String, enum: ['payment', 'refund'], required: true }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
