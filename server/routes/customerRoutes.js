const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const Customer = require('../models/customer');
const { ensureAuthenticated } = require('../middleware/auth');
const bucket = require('../firebase/firebase');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const sendWelcomeEmail = require('../middleware/nodemailer');

// Initialize Firebase Storage
const storage = new Storage({
    projectId: 'cafe-management-2c495',
    keyFilename: '../firebase/cafe-management-2c495-firebase-adminsdk-nbvw7-4e5b8d2993.json',
});
const bucketName = 'gs://cafe-management-2c495.appspot.com'; 

// Get All Customers
router.get('/all', ensureAuthenticated, async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Customer Registration
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        const newCustomer = new Customer({
            firstName,
            lastName,
            email,
            password,
            phone
        });
        await newCustomer.save();
        sendWelcomeEmail(newCustomer.email,newCustomer.firstName); 
        res.status(201).json({ message: 'Customer registered successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Customer Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(400).json({ message: 'Incorrect email or password.' });
        }
        const match = await bcrypt.compare(password, customer.password);
        if (!match) {
            return res.status(400).json({ message: 'Incorrect email or password.' });
        }
        const token = jwt.sign({ id: customer._id }, 'newSecret', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Profile Photo
router.post('/profile-photo', ensureAuthenticated, upload.single('photo'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize(250, 250).toBuffer();
        const fileName = `profile-photos/${req.userId}-${Date.now()}.jpg`;
        const file = bucket.file(fileName);

        const stream = file.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        });

        stream.on('error', (err) => {
            res.status(500).json({ error: err.message });
        });

        stream.on('finish', async () => {
            const url = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });
            await Customer.findByIdAndUpdate(req.userId, { profilePhotoUrl: url[0] });
            res.json({ url: url[0] });
        });

        stream.end(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// View Profile
router.get('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const customer = await Customer.findById(req.userId);
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Profile
router.put('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const updatedCustomer = await Customer.findByIdAndUpdate(req.userId, req.body, { new: true });
        res.json(updatedCustomer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete Profile
router.delete('/profile', ensureAuthenticated, async (req, res) => {
    try {
        // Find the customer by ID
        console.log(req.userId);
        const customer = await Customer.findById(req.userId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Delete the customer's profile photo from Firebase Storage
        if (customer.profilePhotoUrl) {
            const fileName = customer.profilePhotoUrl.split('/').pop(); // Extract filename from URL
            await storage.bucket(bucketName).file(fileName).delete();
        }

        // Delete the customer's profile from the database
        await Customer.findByIdAndDelete(req.userId);

        res.json({ message: 'Profile deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
