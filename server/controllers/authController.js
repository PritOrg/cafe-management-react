    const Customer = require('../models/customer');
    const StaffAndAdmin = require('../models/staffAndAdmin');
    const uploadToFirebase = require('../utils/firebaseUpload');
    const generateToken = require('../utils/generateToken');


    exports.registerCustomer = async (req, res) => {
        try {
            const { email, password, firstName, lastName } = req.body;            
            const existing = await Customer.findOne({ email });
            if (existing) return res.status(400).json({ message: 'Customer already exists' });

            const profilePhotoUrl = req.file
                ? await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'profile-photos')
                : '';

            const customer = new Customer({ email, password, firstName, lastName, profilePhotoUrl });
            await customer.save();

            res.status(201).json({ token: generateToken(customer), user: customer });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    exports.registerStaffOrAdmin = async (req, res) => {
        try {
            const { email, password, firstName, lastName, role } = req.body;
            const existing = await StaffAndAdmin.findOne({ email });
            if (existing) return res.status(400).json({ message: 'User already exists' });

            const profilePhotoUrl = req.file
                ? await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'profile-photos')
                : '';

            const user = new StaffAndAdmin({ email, password, firstName, lastName, role, profilePhotoUrl });
            await user.save();

            res.status(201).json({ token: generateToken(user), user });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    exports.login = async (req, res) => {
        try {
            const { email, password } = req.body;

            let user = await Customer.findOne({ email });
            let userType = 'customer';

            if (!user) {
                user = await StaffAndAdmin.findOne({ email });
                userType = 'staffOrAdmin';
            }

            if (!user || !(await require('bcrypt').compare(password, user.password)))
                return res.status(401).json({ message: 'Invalid credentials' });

            res.json({ token: generateToken(user), userType, user });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    exports.updateProfile = async (req, res) => {
        try {
            const id = req.userId;
            let user = await Customer.findById(id) || await StaffAndAdmin.findById(id);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const { firstName, lastName, phone } = req.body;
            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (phone) user.phone = phone;

            if (req.file) {
                const profilePhotoUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'profile-photos');
                user.profilePhotoUrl = profilePhotoUrl;
            }

            await user.save();
            res.json({ message: 'Profile updated', user });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    exports.deleteProfile = async (req, res) => {
        try {
            const id = req.userId;
            const deletedCustomer = await Customer.findByIdAndDelete(id);
            const deletedStaff = deletedCustomer ? null : await StaffAndAdmin.findByIdAndDelete(id);

            if (!deletedCustomer && !deletedStaff)
                return res.status(404).json({ message: 'User not found' });

            res.json({ message: 'User deleted successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };
