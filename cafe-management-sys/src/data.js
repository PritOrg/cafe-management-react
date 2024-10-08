const menuItems = [
    {
        title: "Cheese Cream Bagels",
        subTitle: "Freshly baked bagels with a generous spread of cream cheese",
        price: {
            medium: 150,
            large: 200,
        },
        category: "Breakfast",
        imageUrl: "public/assets/cafe/Bagels with cream cheese.jpg",
        availability: true,
        calories: 250,
        customizationOptions: ["Extra Cream Cheese", "Whole Wheat Bagel"],
        preparationTime: 10,
        rating: 4.5,
        reviews: [],
        tags: ["new", "bestseller"],
        allergens: ["Gluten", "Dairy"],
    },
    {
        title: "Baked Muffins",
        subTitle: "Deliciously moist muffins with a variety of flavors",
        price: {
            medium: 100,
            large: 150,
        },
        category: "Bakery",
        imageUrl: "public/assets/cafe/baked-muffins.jpg",
        availability: true,
        calories: 300,
        customizationOptions: ["Blueberry", "Chocolate Chip"],
        preparationTime: 15,
        rating: 4.7,
        reviews: [],
        tags: ["seasonal"],
        allergens: ["Gluten", "Eggs"],
    },
    {
        title: "Biscotti Cranberry",
        subTitle: "Crispy biscotti with cranberries",
        price: {
            medium: 120,
            large: 170,
        },
        category: "Bakery",
        imageUrl: "D:/Downloads/images/cafe/Biscotti Cranberry.jpg",
        availability: true,
        calories: 200,
        customizationOptions: ["Extra Cranberries"],
        preparationTime: 20,
        rating: 4.3,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Gluten", "Nuts"],
    },
    {
        title: "Biscotti",
        subTitle: "Traditional Italian biscotti",
        price: {
            medium: 110,
            large: 160,
        },
        category: "Bakery",
        imageUrl: "D:/Downloads/images/cafe/Biscotti.jpg",
        availability: true,
        calories: 190,
        customizationOptions: ["Chocolate Dipped"],
        preparationTime: 20,
        rating: 4.2,
        reviews: [],
        tags: ["classic"],
        allergens: ["Gluten", "Nuts"],
    },
    {
        title: "Cappuccino",
        subTitle: "Rich and creamy cappuccino",
        price: {
            medium: 120,
            large: 150,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/cappuccino.jpg",
        availability: true,
        calories: 100,
        customizationOptions: ["Extra Foam", "Soy Milk"],
        preparationTime: 5,
        rating: 4.8,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Dairy"],
    },
    {
        title: "Caramel Latte",
        subTitle: "Smooth latte with caramel syrup",
        price: {
            medium: 130,
            large: 160,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/Caramel latte.jpg",
        availability: true,
        calories: 150,
        customizationOptions: ["Extra Caramel", "Almond Milk"],
        preparationTime: 5,
        rating: 4.6,
        reviews: [],
        tags: ["new"],
        allergens: ["Dairy"],
    },
    {
        title: "Indian Chai (Traditional)",
        subTitle: "Special Traditional spiced chai",
        price: {
            medium: 100,
            large: 130,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/chai.jpg",
        availability: true,
        calories: 80,
        customizationOptions: ["Extra Spices", "Soy Milk"],
        preparationTime: 5,
        rating: 4.7,
        reviews: [],
        tags: ["classic"],
        allergens: ["Dairy"],
    },
    {
        title: "Cheesecakes Blueberry",
        subTitle: "Creamy cheesecake with blueberry topping",
        price: {
            medium: 200,
            large: 250,
        },
        category: "Desserts",
        imageUrl: "D:/Downloads/images/cafe/Cheesecakes BlueBerry.jpg",
        availability: true,
        calories: 350,
        customizationOptions: ["Extra Blueberries"],
        preparationTime: 30,
        rating: 4.9,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Dairy", "Gluten"],
    },
    {
        title: "Cheesecakes Strawberry",
        subTitle: "Creamy cheesecake with strawberry topping",
        price: {
            medium: 200,
            large: 250,
        },
        category: "Desserts",
        imageUrl: "D:/Downloads/images/cafe/Cheesecakes Strawberry.jpg",
        availability: true,
        calories: 350,
        customizationOptions: ["Extra Strawberries"],
        preparationTime: 30,
        rating: 4.9,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Dairy", "Gluten"],
    },
    {
        title: "Chocolate Milkshake",
        subTitle: "Rich and creamy chocolate milkshake",
        price: {
            medium: 150,
            large: 200,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/chocolate-milkshake.jpg",
        availability: true,
        calories: 400,
        customizationOptions: ["Extra Chocolate", "Whipped Cream"],
        preparationTime: 5,
        rating: 4.8,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Dairy"],
    },
    {
        title: "Coffee Drink with Crushed Cookie and Walnuts",
        subTitle: "Delicious coffee drink topped with crushed cookies and walnuts",
        price: {
            medium: 180,
            large: 220,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/coffee-drink-topped-with-crushed-cookie-walnuts.jpg",
        availability: true,
        calories: 300,
        customizationOptions: ["Extra Cookies", "Soy Milk"],
        preparationTime: 10,
        rating: 4.7,
        reviews: [],
        tags: ["new"],
        allergens: ["Dairy", "Nuts"],
    },
    {
        title: "Cookies",
        subTitle: "Assorted freshly baked cookies",
        price: {
            medium: 100,
            large: 150,
        },
        category: "Bakery",
        imageUrl: "D:/Downloads/images/cafe/Cookies.jpg",
        availability: true,
        calories: 250,
        customizationOptions: ["Chocolate Chip", "Oatmeal Raisin"],
        preparationTime: 15,
        rating: 4.6,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Gluten", "Eggs"],
    },
    {
        title: "Croissants",
        subTitle: "Buttery and flaky croissants",
        price: {
            medium: 120,
            large: 170,
        },
        category: "Bakery",
        imageUrl: "D:/Downloads/images/cafe/Croissants.jpg",
        availability: true,
        calories: 300,
        customizationOptions: ["Chocolate Filled", "Almond"],
        preparationTime: 20,
        rating: 4.8,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Gluten", "Dairy"],
    },
    {
        title: "Frappuccino",
        subTitle: "Blended coffee drink with whipped cream",
        price: {
            medium: 150,
            large: 200,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/frappuccino.jpg",
        availability: true,
        calories: 350,
        customizationOptions: ["Extra Whipped Cream", "Caramel Drizzle"],
        preparationTime: 5,
        rating: 4.7,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Dairy"],
    },
    {
        title: "Fruit Cooler",
        subTitle: "Refreshing fruit cooler",
        price: {
            medium: 100,
            large: 130,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/Fruit Cooler.jpg",
        availability: true,
        calories: 90,
        customizationOptions: ["Extra Ice", "Mint"],
        preparationTime: 5,
        rating: 4.5,
        reviews: [],
        tags: ["seasonal"],
        allergens: [],
    },
    {
        title: "Fruit Cups",
        subTitle: "Freshly cut fruit cups",
        price: {
            medium: 120,
            large: 150,
        },
        category: "Snacks",
        imageUrl: "D:/Downloads/images/cafe/Fruit cups.jpg",
        availability: true,
        calories: 80,
        customizationOptions: ["Extra Berries"],
        preparationTime: 5,
        rating: 4.6,
        reviews: [],
        tags: ["healthy"],
        allergens: [],
    },
    {
        title: "Green Tea Lattes",
        subTitle: "Smooth and creamy green tea lattes",
        price: {
            medium: 130,
            large: 160,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/Green Tea lattes .jpg",
        availability: true,
        calories: 120,
        customizationOptions: ["Soy Milk", "Extra Matcha"],
        preparationTime: 5,
        rating: 4.6,
        reviews: [],
        tags: ["healthy"],
        allergens: ["Dairy"],
    },
    {
        title: "Hot Chocolate",
        subTitle: "Rich and creamy hot chocolate",
        price: {
            medium: 120,
            large: 150,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/hot-chocolate.jpg",
        availability: true,
        calories: 200,
        customizationOptions: ["Whipped Cream", "Marshmallows"],
        preparationTime: 5,
        rating: 4.8,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Dairy"],
    },
    {
        title: "Iced Orange",
        subTitle: "Refreshing iced orange drink",
        price: {
            medium: 100,
            large: 130,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/iced-orange.jpg",
        availability: true,
        calories: 90,
        customizationOptions: ["Extra Ice", "Mint"],
        preparationTime: 5,
        rating: 4.5,
        reviews: [],
        tags: ["seasonal"],
        allergens: [],
    },
    {
        title: "Italian Sodas Raspberry",
        subTitle: "Fizzy raspberry Italian sodas",
        price: {
            medium: 110,
            large: 140,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/Italian sodas_Rasberry.jpg",
        availability: true,
        calories: 100,
        customizationOptions: ["Extra Syrup"],
        preparationTime: 5,
        rating: 4.4,
        reviews: [],
        tags: ["refreshing"],
        allergens: [],
    },
    {
        title: "Latte Macchiato",
        subTitle: "Smooth latte macchiato with a rich flavor",
        price: {
            medium: 140,
            large: 170,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/latte-macchiato-coffee.jpg",
        availability: true,
        calories: 150,
        customizationOptions: ["Extra Shot", "Soy Milk"],
        preparationTime: 5,
        rating: 4.7,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Dairy"],
    },
    {
        title: "Matcha Latte",
        subTitle: "Creamy matcha latte with a hint of sweetness",
        price: {
            medium: 130,
            large: 160,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/matcha latte.jpg",
        availability: true,
        calories: 120,
        customizationOptions: ["Extra Matcha", "Almond Milk"],
        preparationTime: 5,
        rating: 4.6,
        reviews: [],
        tags: ["healthy"],
        allergens: ["Dairy"],
    },
    {
        title: "Milkshake with Sweets",
        subTitle: "Indulgent milkshake topped with sweets",
        price: {
            medium: 180,
            large: 220,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/milkshake-with-sweets.jpg",
        availability: true,
        calories: 450,
        customizationOptions: ["Extra Sweets", "Whipped Cream"],
        preparationTime: 5,
        rating: 4.8,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Dairy"],
    },
    {
        title: "Pies Apple",
        subTitle: "Classic apple pies with a flaky crust",
        price: {
            medium: 150,
            large: 200,
        },
        category: "Desserts",
        imageUrl: "D:/Downloads/images/cafe/Pies Apple.jpg",
        availability: true,
        calories: 300,
        customizationOptions: ["Extra Cinnamon"],
        preparationTime: 30,
        rating: 4.7,
        reviews: [],
        tags: ["classic"],
        allergens: ["Gluten", "Dairy"],
    },
    {
        title: "Quiches",
        subTitle: "Savory quiches with a variety of fillings",
        price: {
            medium: 160,
            large: 210,
        },
        category: "Bakery",
        imageUrl: "D:/Downloads/images/cafe/Quiches.jpg",
        availability: true,
        calories: 350,
        customizationOptions: ["Spinach", "Bacon"],
        preparationTime: 20,
        rating: 4.6,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Gluten", "Dairy"],
    },
    {
        title: "Salads",
        subTitle: "Fresh and healthy salads",
        price: {
            medium: 120,
            large: 150,
        },
        category: "Snacks",
        imageUrl: "D:/Downloads/images/cafe/Salads.jpg",
        availability: true,
        calories: 100,
        customizationOptions: ["Extra Dressing", "Grilled Chicken"],
        preparationTime: 10,
        rating: 4.5,
        reviews: [],
        tags: ["healthy"],
        allergens: [],
    },
    {
        title: "Sandwich",
        subTitle: "Delicious sandwich with fresh ingredients",
        price: {
            medium: 130,
            large: 160,
        },
        category: "Snacks",
        imageUrl: "D:/Downloads/images/cafe/sandwich.jpg",
        availability: true,
        calories: 250,
        customizationOptions: ["Extra Cheese", "Whole Wheat Bread"],
        preparationTime: 10,
        rating: 4.6,
        reviews: [],
        tags: ["bestseller"],
        allergens: ["Gluten", "Dairy"],
    },
    {
        title: "Scones",
        subTitle: "Buttery scones with a crumbly texture",
        price: {
            medium: 110,
            large: 140,
        },
        category: "Bakery",
        imageUrl: "D:/Downloads/images/cafe/scons.jpg",
        availability: true,
        calories: 200,
        customizationOptions: ["Raisin", "Blueberry"],
        preparationTime: 15,
        rating: 4.5,
        reviews: [],
        tags: ["classic"],
        allergens: ["Gluten", "Dairy"],
    },
    {
        title: "Strawberry Lemonade",
        subTitle: "Refreshing strawberry lemonade",
        price: {
            medium: 100,
            large: 130,
        },
        category: "Beverages",
        imageUrl: "D:/Downloads/images/cafe/strawberry-lemonade.jpg",
        availability: true,
        calories: 90,
        customizationOptions: ["Extra Strawberries", "Mint"],
        preparationTime: 5,
        rating: 4.6,
        reviews: [],
        tags: ["seasonal"],
        allergens: [],
    },
];

module.exports = menuItems