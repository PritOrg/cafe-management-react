const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AddressSchema = new mongoose.Schema({
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
});

const ReviewSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    rating: { type: Number, required: true },
    comment: { type: String },
    date: { type: Date, default: Date.now }
});

const CustomerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    profilePhotoUrl: { type: String }, // URL to profile photo in Firebase
    address: [AddressSchema],
    registrationDate: { type: Date, default: Date.now },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    loyaltyPoints: { type: Number, default: 0 },
    membershipLevel: { type: String, enum: ['Silver', 'Gold', 'Platinum'], default: 'Silver' },
    preferredItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    customizations: [{ type: String }],
    reviews: [ReviewSchema],
    notifications: { type: Boolean, default: true },
    notificationPreferences: { type: [String], enum: ['email', 'SMS', 'push'], default: ['email'] },
    paymentMethods: [{
        type: { type: String, enum: ['credit_card', 'paypal'], required: true },
        details: { type: Map, of: String, required: true }
    }]
});

// Pre-save hook to hash password before saving
CustomerSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model('Customer', CustomerSchema);
