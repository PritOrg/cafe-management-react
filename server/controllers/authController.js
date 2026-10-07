const { sendResponse } = require('../middleware/auth');
const { securityLogger } = require('../middleware/logger');
const generateToken = require('../utils/generateToken');
const uploadToFirebase = require('../utils/firebaseUpload');
const staffRepo = require('../repositories/staffRepo');
const authService = require('../services/authService');
const { toPublic, mapStaff } = require('../db/mappers');
const validator = require('validator');

const validateEmail = (email) => validator.isEmail(email) && email.length <= 254;

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

const validateName = (name) => typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 50;

const sanitizeInput = (data) => {
    const clean = {};
    for (const [key, value] of Object.entries(data || {})) {
        if (typeof value === 'string') clean[key] = value.trim();
        else clean[key] = value;
    }
    return clean;
};

exports.registerStaffOrAdmin = async (req, res) => {
    try {
        const sanitizedData = sanitizeInput(req.body);
        const { email, password, firstName, lastName, phone, role } = sanitizedData;

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
        if (!['staff', 'admin'].includes(role)) {
            return sendResponse(res, 400, false, 'Role must be either staff or admin');
        }
        if (!req.tenantId) {
            return sendResponse(res, 400, false, 'Tenant context is required');
        }

        const existing = await staffRepo.findByEmail(req.tenantId, email.toLowerCase());
        if (existing) {
            return sendResponse(res, 409, false, 'An account with this email already exists');
        }

        let profilePhotoUrl = '';
        if (req.file) {
            profilePhotoUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'profile-photos');
        }

        const staff = await staffRepo.create(req.tenantId, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase(),
            password,
            phone: phone || undefined,
            role,
            profilePhotoUrl: profilePhotoUrl || undefined,
        });

        return sendResponse(res, 201, true, 'Staff registered successfully', staff);
    } catch (err) {
        console.error('Staff registration error:', err);
        if (err.code === '23505' || err.code === 11000) {
            return sendResponse(res, 409, false, 'An account with this email already exists');
        }
        return sendResponse(res, 500, false, 'Registration failed. Please try again later.');
    }
};

exports.login = async (req, res) => {
    try {
        const sanitizedData = sanitizeInput(req.body);
        const { email, password } = sanitizedData;

        if (!email || !password) {
            return sendResponse(res, 400, false, 'Email and password are required');
        }
        if (!validateEmail(email)) {
            return sendResponse(res, 400, false, 'Please provide a valid email address');
        }

        const normalized = email.toLowerCase();
        let user = null;

        if (req.tenantId) {
            user = await staffRepo.findByEmailForLogin(req.tenantId, normalized);
        }
        if (!user) {
            user = await staffRepo.findPlatformAdminByEmail(normalized);
        }
        if (!user) {
            securityLogger.loginFailure(normalized, 'unknown-user', req.ip, req.get('User-Agent'), req.id);
            return sendResponse(res, 401, false, 'Invalid email or password');
        }
        if (user.is_active === false) {
            securityLogger.loginFailure(normalized, 'deactivated', req.ip, req.get('User-Agent'), req.id);
            return sendResponse(res, 403, false, 'Account is deactivated');
        }

        const isPasswordValid = await authService.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            securityLogger.loginFailure(normalized, 'bad-password', req.ip, req.get('User-Agent'), req.id);
            return sendResponse(res, 401, false, 'Invalid email or password');
        }

        await staffRepo.touchLogin(user.id);
        securityLogger.loginSuccess(user.id, normalized, req.ip, req.get('User-Agent'), req.id);

        const token = generateToken({
            _id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id,
            isPlatformAdmin: user.is_platform_admin,
        });

        return sendResponse(res, 200, true, 'Login successful', {
            token,
            userType: 'staffOrAdmin',
            user: mapStaff(toPublic(user)),
        });
    } catch (err) {
        console.error('Login error:', err);
        return sendResponse(res, 500, false, 'Login failed. Please try again later.');
    }
};
