const express = require('express');
const router = express.Router();
const {
    listItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    addMovement,
} = require('../controllers/inventoryController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);
router.get('/', listItems);
router.get('/:id', getItem);
router.post('/', createItem);
router.put('/:id', updateItem);
router.post('/:id/movements', addMovement);
router.delete('/:id', deleteItem);

module.exports = router;
