const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const AddressSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home',
        required: true
    },
    line1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true,
        maxlength: [100, 'Address line 1 cannot exceed 100 characters']
    },
    line2: {
        type: String,
        trim: true,
        maxlength: [100, 'Address line 2 cannot exceed 100 characters']
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [50, 'State name cannot exceed 50 characters']
    },
    postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^[0-9A-Za-z\s-]{3,10}$/.test(v);
            },
            message: 'Please provide a valid postal code'
        }
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        maxlength: [50, 'Country name cannot exceed 50 characters']
    }
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: [true, 'Menu item reference is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name cannot exceed 50 characters'],
        validate: {
            validator: function(v) {
                return /^[a-zA-Z\s'-]+$/.test(v);
            },
            message: 'First name can only contain letters, spaces, hyphens, and apostrophes'
        }
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name cannot exceed 50 characters'],
        validate: {
            validator: function(v) {
                return /^[a-zA-Z\s'-]+$/.test(v);
            },
            message: 'Last name can only contain letters, spaces, hyphens, and apostrophes'
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please provide a valid email address'
        },
        maxlength: [254, 'Email cannot exceed 254 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || validator.isMobilePhone(v, 'any', { strictMode: false });
            },
            message: 'Please provide a valid phone number'
        }
    },
    profilePhotoUrl: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || validator.isURL(v);
            },
            message: 'Please provide a valid URL for profile photo'
        }
    },
    address: [AddressSchema],
    registrationDate: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: [0, 'Loyalty points cannot be negative']
    },
    membershipLevel: {
        type: String,
        enum: {
            values: ['Silver', 'Gold', 'Platinum'],
            message: 'Membership level must be Silver, Gold, or Platinum'
        },
        default: 'Silver'
    },
    preferredItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
    customizations: [{
        type: String,
        trim: true,
        maxlength: [100, 'Customization cannot exceed 100 characters']
    }],
    reviews: [ReviewSchema],
    notifications: { type: Boolean, default: true },
    notificationPreferences: {
        type: [String],
        enum: {
            values: ['email', 'SMS', 'push'],
            message: 'Notification preference must be email, SMS, or push'
        },
        default: ['email']
    },
    paymentMethods: [{
        type: {
            type: String,
            enum: {
                values: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay'],
                message: 'Payment method type is not supported'
            },
            required: [true, 'Payment method type is required']
        },
        details: {
            type: Map,
            of: String,
            required: [true, 'Payment method details are required']
        }
    }],
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            delete ret.password;
            return ret;
        }
    }
});

// Indexes for better query performance
CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ registrationDate: -1 });
CustomerSchema.index({ lastLogin: -1 });
CustomerSchema.index({ loyaltyPoints: -1 });
CustomerSchema.index({ membershipLevel: 1 });
CustomerSchema.index({ isActive: 1 });

// Pre-save hook to hash password before saving
CustomerSchema.pre('save', async function (next) {
    try {
        if (this.isModified('password')) {
            const saltRounds = 12; // Increased from 10 for better security
            this.password = await bcrypt.hash(this.password, saltRounds);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to compare password
CustomerSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Instance method to get full name
CustomerSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Static method to find active customers
CustomerSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

// Virtual for full name
CustomerSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
CustomerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Customer', CustomerSchema);
