const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    maxDiscountAmount: {
        type: Number,
        required: true,
    },
    minOrderAmount: {
        type: Number,
        default: 0,
    },
    applicableItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
    }],
    expiresAt: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model('Discount', DiscountSchema);
