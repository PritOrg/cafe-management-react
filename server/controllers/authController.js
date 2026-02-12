const Customer = require('../models/customer');
const StaffAndAdmin = require('../models/staffAndAdmin');
const uploadToFirebase = require('../utils/firebaseUpload');
const generateToken = require('../utils/generateToken');
const validator = require('validator');
const rateLimit = require('express-rate-limit');

// Input validation helper functions
const validateEmail = (email) => {
  return validator.isEmail(email) && email.length <= 254;
};

const validatePassword = (password) => {
  // Password must be at least 8 characters, contain uppercase, lowercase, number, and special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateName = (name) => {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 50;
};

const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  return validator.isMobilePhone(phone, 'any', { strictMode: false });
};

// Sanitize input data
const sanitizeInput = (data) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = validator.escape(value.trim());
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Standardized response helper
const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});


exports.registerCustomer = async (req, res) => {
    try {
        // Sanitize input data
        const sanitizedData = sanitizeInput(req.body);
        const { email, password, firstName, lastName, phone } = sanitizedData;

        // Comprehensive input validation
        if (!email || !password || !firstName || !lastName) {
            return sendResponse(res, 400, false, 'All required fields must be provided');
        }

        if (!validateEmail(email)) {
            return sendResponse(res, 400, false, 'Please provide a valid email address');
        }

        if (!validatePassword(password)) {
            return sendResponse(res, 400, false, 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
        }

        if (!validateName(firstName)) {
            return sendResponse(res, 400, false, 'First name must be between 2 and 50 characters');
        }

        if (!validateName(lastName)) {
            return sendResponse(res, 400, false, 'Last name must be between 2 and 50 characters');
        }

        if (!validatePhone(phone)) {
            return sendResponse(res, 400, false, 'Please provide a valid phone number');
        }

        // Check if customer already exists
        const existing = await Customer.findOne({ email: email.toLowerCase() });
        if (existing) {
            return sendResponse(res, 409, false, 'An account with this email already exists');
        }

        // Handle profile photo upload
        let profilePhotoUrl = '';
        if (req.file) {
            try {
                profilePhotoUrl = await uploadToFirebase(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'profile-photos'
                );
            } catch (uploadError) {
                console.error('Profile photo upload failed:', uploadError);
                return sendResponse(res, 500, false, 'Failed to upload profile photo');
            }
        }

        // Create new customer
        const customer = new Customer({
            email: email.toLowerCase(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone || undefined,
            profilePhotoUrl
        });

        await customer.save();

        // Generate token
        const token = generateToken(customer);

        // Remove password from response
        const customerResponse = customer.toObject();
        delete customerResponse.password;

        return sendResponse(res, 201, true, 'Customer registered successfully', {
            token,
            user: customerResponse,
            userType: 'customer'
        });

    } catch (err) {
        console.error('Customer registration error:', err);

        // Handle specific MongoDB errors
        if (err.code === 11000) {
            return sendResponse(res, 409, false, 'An account with this email already exists');
        }

        return sendResponse(res, 500, false, 'Registration failed. Please try again later.');
    }
};

exports.registerStaffOrAdmin = async (req, res) => {
    try {
        // Sanitize input data
        const sanitizedData = sanitizeInput(req.body);
        const { email, password, firstName, lastName, role, phone } = sanitizedData;

        // Comprehensive input validation
        if (!email || !password || !firstName || !lastName || !role) {
            return sendResponse(res, 400, false, 'All required fields must be provided');
        }

        if (!validateEmail(email)) {
            return sendResponse(res, 400, false, 'Please provide a valid email address');
        }

        if (!validatePassword(password)) {
            return sendResponse(res, 400, false, 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
        }

        if (!validateName(firstName)) {
            return sendResponse(res, 400, false, 'First name must be between 2 and 50 characters');
        }

        if (!validateName(lastName)) {
            return sendResponse(res, 400, false, 'Last name must be between 2 and 50 characters');
        }

        if (!['staff', 'admin'].includes(role)) {
            return sendResponse(res, 400, false, 'Role must be either staff or admin');
        }

        if (!validatePhone(phone)) {
            return sendResponse(res, 400, false, 'Please provide a valid phone number');
        }

        // Check if user already exists
        const existing = await StaffAndAdmin.findOne({ email: email.toLowerCase() });
        if (existing) {
            return sendResponse(res, 409, false, 'An account with this email already exists');
        }

        // Handle profile photo upload
        let profilePhotoUrl = '';
        if (req.file) {
            try {
                profilePhotoUrl = await uploadToFirebase(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'profile-photos'
                );
            } catch (uploadError) {
                console.error('Profile photo upload failed:', uploadError);
                return sendResponse(res, 500, false, 'Failed to upload profile photo');
            }
        }

        // Create new staff/admin user
        const user = new StaffAndAdmin({
            email: email.toLowerCase(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role,
            phone: phone || undefined,
            profilePhotoUrl
        });

        await user.save();

        // Generate token
        const token = generateToken(user);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        return sendResponse(res, 201, true, `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`, {
            token,
            user: userResponse,
            userType: 'staffOrAdmin'
        });

    } catch (err) {
        console.error('Staff/Admin registration error:', err);

        // Handle specific MongoDB errors
        if (err.code === 11000) {
            return sendResponse(res, 409, false, 'An account with this email already exists');
        }

        return sendResponse(res, 500, false, 'Registration failed. Please try again later.');
    }
};

exports.login = async (req, res) => {
    try {
        // Sanitize input data
        const sanitizedData = sanitizeInput(req.body);
        const { email, password } = sanitizedData;

        // Input validation
        if (!email || !password) {
            return sendResponse(res, 400, false, 'Email and password are required');
        }

        if (!validateEmail(email)) {
            return sendResponse(res, 400, false, 'Please provide a valid email address');
        }

        // Try to find user in Customer collection first
        let user = await Customer.findOne({ email: email.toLowerCase() }).select('+password');
        let userType = 'customer';

        // If not found in Customer, try StaffAndAdmin
        if (!user) {
            user = await StaffAndAdmin.findOne({ email: email.toLowerCase() }).select('+password');
            userType = 'staffOrAdmin';
        }

        // Check if user exists and password is correct
        if (!user) {
            return sendResponse(res, 401, false, 'Invalid email or password');
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return sendResponse(res, 401, false, 'Invalid email or password');
        }

        // Update last login timestamp
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        return sendResponse(res, 200, true, 'Login successful', {
            token,
            userType,
            user: userResponse
        });

    } catch (err) {
        console.error('Login error:', err);
        return sendResponse(res, 500, false, 'Login failed. Please try again later.');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const id = req.userId;

        // Find user in both collections
        let user = await Customer.findById(id) || await StaffAndAdmin.findById(id);
        if (!user) {
            return sendResponse(res, 404, false, 'User not found');
        }

        // Sanitize input data
        const sanitizedData = sanitizeInput(req.body);
        const { firstName, lastName, phone } = sanitizedData;

        // Validate input data if provided
        if (firstName && !validateName(firstName)) {
            return sendResponse(res, 400, false, 'First name must be between 2 and 50 characters');
        }

        if (lastName && !validateName(lastName)) {
            return sendResponse(res, 400, false, 'Last name must be between 2 and 50 characters');
        }

        if (phone && !validatePhone(phone)) {
            return sendResponse(res, 400, false, 'Please provide a valid phone number');
        }

        // Update user fields
        if (firstName) user.firstName = firstName.trim();
        if (lastName) user.lastName = lastName.trim();
        if (phone) user.phone = phone;

        // Handle profile photo upload
        if (req.file) {
            try {
                const profilePhotoUrl = await uploadToFirebase(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    'profile-photos'
                );
                user.profilePhotoUrl = profilePhotoUrl;
            } catch (uploadError) {
                console.error('Profile photo upload failed:', uploadError);
                return sendResponse(res, 500, false, 'Failed to upload profile photo');
            }
        }

        // Update timestamp
        user.updatedAt = new Date();
        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        return sendResponse(res, 200, true, 'Profile updated successfully', {
            user: userResponse
        });

    } catch (err) {
        console.error('Profile update error:', err);
        return sendResponse(res, 500, false, 'Profile update failed. Please try again later.');
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        const id = req.userId;

        // Try to delete from Customer collection first
        const deletedCustomer = await Customer.findByIdAndDelete(id);

        // If not found in Customer, try StaffAndAdmin
        const deletedStaff = deletedCustomer ? null : await StaffAndAdmin.findByIdAndDelete(id);

        if (!deletedCustomer && !deletedStaff) {
            return sendResponse(res, 404, false, 'User not found');
        }

        const userType = deletedCustomer ? 'customer' : 'staff/admin';

        return sendResponse(res, 200, true, `${userType.charAt(0).toUpperCase() + userType.slice(1)} account deleted successfully`);

    } catch (err) {
        console.error('Profile deletion error:', err);
        return sendResponse(res, 500, false, 'Account deletion failed. Please try again later.');
    }
};

// Export rate limiter for use in routes
exports.authLimiter = authLimiter;
