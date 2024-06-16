const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    subTitle: {
        type: String,
        required: true,
    },
    price: {
        medium: {
            type: Number,
            required: true,
        },
        large: {
            type: Number,
            required: true,
        },
    },
    category: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        default: '',
    },
    availability: {
        type: Boolean,
        default: true,
    },
    calories: {
        type: Number,
        default: 0,
    },
    customizationOptions: { // extra shots, types of milk, etc.
        type: [String],
        default: [],
    },
    preparationTime: {
        type: Number,
        default: 0, // Time in minutes
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            customer: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            review: {
                type: String,
            },
            rating: {
                type: Number,
                required: true,
            },
            date: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    tags: { //(e.g., "new", "seasonal", "bestseller")
        type: [String],
        default: [],
    },
    allergens: { //Important for customers with food allergies to know if a menu item contains potential allergens
        type: [String],
        default: [],
    },
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
