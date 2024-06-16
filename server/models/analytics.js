// To track and analyze various metrics related to sales, customer behavior, etc.

const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    totalSales: { type: Number, required: true },
    totalOrders: { type: Number, required: true },
    totalCustomers: { type: Number, required: true },
    mostPopularItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }]
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
