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

const StaffAndAdminSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    profilePhotoUrl: { type: String }, // URL to profile photo in Firebase
    address: [AddressSchema],
    role: { type: String, enum: ['staff', 'admin'], required: true },
    registrationDate: { type: Date, default: Date.now },
    workSchedule: [
        {
            day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
            startTime: { type: String },
            endTime: { type: String }
        }
    ]
});

// Pre-save hook to hash password before saving
StaffAndAdminSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model('StaffAndAdmin', StaffAndAdminSchema);
