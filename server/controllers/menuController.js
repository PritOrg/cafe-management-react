const MenuItem = require('../models/menuItem');
const uploadToFirebase = require('../utils/firebaseUpload');
const handleError = require('../utils/handleError');

// Create a new menu item
exports.createMenuItem = async (req, res) => {
    try {
        const {
            title,
            subTitle,
            priceMedium,
            priceLarge,
            category,
            calories,
            preparationTime,
            customizationOptions,
            tags,
            allergens
        } = req.body;
        
        const imageUrl = req.file
        ? await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'menu-img')
        : '';
        console.log(`Image URL: ${imageUrl}`);
        
        const item = new MenuItem({
            title,
            subTitle,
            category,
            price: {
                medium: parseFloat(priceMedium),
                large: parseFloat(priceLarge)
            },
            calories: parseFloat(calories),
            preparationTime: parseFloat(preparationTime),
            customizationOptions: customizationOptions?.split(',').map(opt => opt.trim()),
            tags: tags?.split(',').map(tag => tag.trim()),
            allergens: allergens?.split(',').map(all => all.trim()),
            imageUrl
        });

        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (err) {
        handleError(res, err);
    }
};

// Get all menu items
exports.getAllMenuItems = async (req, res) => {
    try {
        const items = await MenuItem.find();
        res.json(items);
    } catch (err) {
        handleError(res, err);
    }
};

// Get a menu item by ID
exports.getMenuItemById = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        handleError(res, err);
    }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (err) {
        handleError(res, err);
    }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted' });
    } catch (err) {
        handleError(res, err);
    }
};
