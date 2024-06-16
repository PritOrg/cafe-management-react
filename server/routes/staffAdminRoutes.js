const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const StaffAndAdmin = require('../models/staffAndAdmin'); // Adjust the path as needed
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Initialize Firebase Storage
const storage = new Storage({
    projectId: 'cafe-management-2c495',
    keyFilename: '../firebase/cafe-management-2c495-firebase-adminsdk-nbvw7-4e5b8d2993.json', // Provide the path to your service account key file
});

const bucketName = 'gs://cafe-management-2c495.appspot.com'; // Replace with your Firebase Storage bucket name

// Multer configuration for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Register
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, phone, role } = req.body;
    try {
        const existingUser = await StaffAndAdmin.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        const staffAdmin = new StaffAndAdmin({
            firstName,
            lastName,
            email,
            password,
            phone,
            role,
        });

        await staffAdmin.save();
        res.status(201).json({ message: 'Staff/Admin registered successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sign in
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await StaffAndAdmin.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Incorrect email or password.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: 'Incorrect email or password.' });
        }
        const token = jwt.sign({ id: user._id }, 'newSecret', { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all staff and admin
router.get('/all', ensureAuthenticated, async (req, res) => {
    try {
        const staffAdmins = await StaffAndAdmin.find();
        res.json(staffAdmins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update profile
router.put('/profile', ensureAuthenticated, upload.single('profilePhoto'), async (req, res) => {
    try {
        const updateData = req.body;

        // If a new profile photo is uploaded, upload it to Firebase and get the URL
        if (req.file) {
            const fileName = `${req.userId}-${Date.now()}-${req.file.originalname}`;
            const file = storage.bucket(bucketName).file(fileName);
            const stream = file.createWriteStream({
                metadata: {
                    contentType: req.file.mimetype,
                },
            });
            stream.on('error', (err) => {
                return res.status(500).json({ error: err.message });
            });
            stream.on('finish', async () => {
                const profilePhotoUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
                updateData.profilePhotoUrl = profilePhotoUrl;

                const updatedUser = await StaffAndAdmin.findByIdAndUpdate(req.userId, updateData, { new: true });
                res.json(updatedUser);
            });
            stream.end(req.file.buffer);
        } else {
            const updatedUser = await StaffAndAdmin.findByIdAndUpdate(req.userId, updateData, { new: true });
            res.json(updatedUser);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete profile
router.delete('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const user = await StaffAndAdmin.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Staff/Admin not found' });
        }

        // Delete profile photo from Firebase Storage if exists
        if (user.profilePhotoUrl) {
            const fileName = user.profilePhotoUrl.split('/').pop(); // Extract filename from URL
            await storage.bucket(bucketName).file(fileName).delete();
        }

        await StaffAndAdmin.findByIdAndDelete(req.userId);
        res.json({ message: 'Profile deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
