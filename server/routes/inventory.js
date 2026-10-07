const express = require('express');
const router = express.Router();
const {
    listItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    addMovement,
    listRecipesForInventory,
    listRecipesForMenu,
    addRecipe,
    removeRecipe,
} = require('../controllers/inventoryController');
const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);
router.get('/', listItems);
router.get('/recipes/menu/:id', listRecipesForMenu);
router.post('/recipes', addRecipe);
router.delete('/recipes/:id', removeRecipe);
router.get('/:id/recipes', listRecipesForInventory);
router.get('/:id', getItem);
router.post('/', createItem);
router.put('/:id', updateItem);
router.post('/:id/movements', addMovement);
router.delete('/:id', deleteItem);

module.exports = router;
