const express = require('express');
const MenuItem = require('../models/MenuItem');
const  bucket  = require('../firebase/firebase');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// Create a new menu item
router.post('/', upload.single('file'), async (req, res) => {
    
    if (req.file) {
        const blob = bucket.file(`menu-img/${Date.now()}_${req.file.originalname}`);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        });
            
        blobStream.on('error', (err) => {
            res.status(500).json({ message: err.message });
        });

        blobStream.on('finish', async () => {
            blob.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            saveMenuItem(publicUrl);
        });

        blobStream.end(req.file.buffer);
    } else {
        saveMenuItem('');
    }

    async function saveMenuItem(url) {
        const item = new MenuItem({
            title: req.body.title,
            subTitle: req.body.subTitle,
            price: {
                medium: parseFloat(req.body.priceMedium),
                large: parseFloat(req.body.priceLarge),
            },
            category: req.body.category,
            imageUrl: url,
            calories: parseFloat(req.body.calories),
            preparationTime: parseFloat(req.body.preparationTime),
            customizationOptions: req.body.customizationOptions.split(',').map(opt => opt.trim()),
            tags: req.body.tags.split(',').map(tag => tag.trim()),
            allergens: req.body.allergens.split(',').map(allergen => allergen.trim())
        });

        try {
            const newItem = await item.save();
            res.status(201).json(newItem);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
});
// Get all menu items
router.get('/', async (req, res) => {
    try {
        const items = await MenuItem.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a menu item by ID
router.get('/:id', async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Update a menu item
router.put('/:id', async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a menu item
router.delete('/:id', async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
