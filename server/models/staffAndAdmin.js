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

const WorkScheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: {
            values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            message: 'Day must be a valid day of the week'
        },
        required: [true, 'Day is required']
    },
    startTime: {
        type: String,
        required: [true, 'Start time is required'],
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Start time must be in HH:MM format (24-hour)'
        }
    },
    endTime: {
        type: String,
        required: [true, 'End time is required'],
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'End time must be in HH:MM format (24-hour)'
        }
    }
}, { timestamps: true });

const StaffAndAdminSchema = new mongoose.Schema({
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
    role: {
        type: String,
        enum: {
            values: ['staff', 'admin'],
            message: 'Role must be either staff or admin'
        },
        required: [true, 'Role is required']
    },
    registrationDate: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    workSchedule: [WorkScheduleSchema],
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    department: {
        type: String,
        trim: true,
        maxlength: [50, 'Department name cannot exceed 50 characters']
    },
    employeeId: {
        type: String,
        unique: true,
        sparse: true, // Allow null values but ensure uniqueness when present
        trim: true,
        maxlength: [20, 'Employee ID cannot exceed 20 characters']
    },
    hireDate: { type: Date },
    salary: {
        type: Number,
        min: [0, 'Salary cannot be negative']
    }
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
StaffAndAdminSchema.index({ email: 1 }, { unique: true });
StaffAndAdminSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
StaffAndAdminSchema.index({ role: 1 });
StaffAndAdminSchema.index({ department: 1 });
StaffAndAdminSchema.index({ registrationDate: -1 });
StaffAndAdminSchema.index({ lastLogin: -1 });
StaffAndAdminSchema.index({ isActive: 1 });
StaffAndAdminSchema.index({ hireDate: -1 });

// Pre-save hook to hash password before saving
StaffAndAdminSchema.pre('save', async function (next) {
    try {
        if (this.isModified('password')) {
            const saltRounds = 12; // Increased from 10 for better security
            this.password = await bcrypt.hash(this.password, saltRounds);
        }

        // Generate employee ID if not provided
        if (this.isNew && !this.employeeId) {
            const count = await this.constructor.countDocuments();
            this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to compare password
StaffAndAdminSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Instance method to get full name
StaffAndAdminSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Instance method to check if user is admin
StaffAndAdminSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

// Static method to find active staff
StaffAndAdminSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

// Static method to find by role
StaffAndAdminSchema.statics.findByRole = function(role) {
    return this.find({ role, isActive: true });
};

// Virtual for full name
StaffAndAdminSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
StaffAndAdminSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('StaffAndAdmin', StaffAndAdminSchema);
