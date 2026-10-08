const { hashPassword } = require('../../services/authService');
const { DEFAULTS } = require('../../repositories/settingsRepo');

const MENU = [
    {
        title: 'Muffins',
        sub_title: 'Crispy baked and delicious muffin',
        category: 'Baked',
        price_medium: 150,
        price_large: 250,
        image_url: 'https://storage.googleapis.com/cafe-management-2c495.appspot.com/menu-img/1719634315555_baked-muffins.jpg',
        calories: 49,
        customization_options: ['cream', 'choco'],
        preparation_time: 4,
        rating: 4.2,
        tags: ['new', 'trending'],
        allergens: ['nothing'],
        order_count: 1,
    },
    {
        title: 'Vidhi Special',
        sub_title: 'Very special house frappe',
        category: 'Caffeine',
        price_medium: 250,
        price_large: 500,
        image_url: 'https://storage.googleapis.com/cafe-management-2c495.appspot.com/menu-img/1726073770018_Frappuccinos.jpg',
        calories: 450,
        customization_options: ['Dark Chocolate', 'Cream', 'Ice Cream', 'Sprinkles', 'Caramel'],
        preparation_time: 8,
        rating: 4.7,
        tags: ['chilled', 'trending'],
        allergens: ['Milk'],
        order_count: 5,
    },
    {
        title: 'Apple Pie',
        sub_title: 'Pie of apple pulp',
        category: 'PIE',
        price_medium: 450,
        price_large: 600,
        image_url: 'https://storage.googleapis.com/cafe-management-2c495.appspot.com/menu-img/1723052024811_PiesApple.jpg',
        calories: 12,
        customization_options: ['NAHI', 'PATA'],
        preparation_time: 12,
        rating: 4.6,
        tags: ['no', 'tags', '#rightnow'],
        allergens: ['APPLE'],
    },
    {
        title: 'Checking',
        sub_title: 'Nice one',
        category: 'Lunch',
        price_medium: 20,
        price_large: 54,
        image_url: 'https://storage.googleapis.com/cafe-management-2c495.appspot.com/menu-img/1748247454499_sandwich.jpg',
        calories: 5,
        customization_options: ['extra shot', 'skim milk', 'sugar free'],
        preparation_time: 5,
        rating: 4.5,
        tags: ['vegan', 'popular'],
        allergens: ['Soybeans'],
    },
    {
        title: 'Frappuccino',
        sub_title: 'Creamy, cold and refreshing.',
        category: 'Drink',
        price_medium: 250,
        price_large: 375,
        image_url: 'https://storage.googleapis.com/cafe-management-2c495.appspot.com/menu-img/1719634557633_frappacuccino.jpg',
        calories: 150,
        customization_options: ['cream', 'ice'],
        preparation_time: 5,
        rating: 4.4,
        tags: ['Creamy', 'Iced', 'Refreshing', 'Blended', 'Sweet', 'Flavorful'],
        allergens: ['nothing'],
    },
    {
        title: 'Strawberry Lemonade',
        sub_title: 'Strawberry with a fresh lemon twist',
        category: 'Beverages',
        price_medium: 200,
        price_large: 350,
        image_url: 'https://storage.googleapis.com/cafe-management-2c495.appspot.com/menu-img/1719907816998_strawberry-lemonade.jpg',
        calories: 89,
        customization_options: ['strawberry', 'cream', 'lemon'],
        preparation_time: 10,
        rating: 4.3,
        tags: ['drinks', 'latest', 'trending'],
        allergens: ['strawberry'],
        order_count: 1,
    },
    {
        title: 'H',
        sub_title: 'House cappuccino',
        category: 'Coffee',
        price_medium: 45,
        price_large: 120,
        image_url: 'https://storage.googleapis.com/cafe-management-2c495.appspot.com/menu-img/1748334387104_cappuccino.jpg',
        calories: 1,
        customization_options: ['strong', 'mild', 'extra foam'],
        preparation_time: 2,
        rating: 4.1,
        tags: ['classic', 'hot'],
        allergens: ['Milk'],
    },
    {
        title: 'Cappuccino',
        sub_title: 'Classic foam cup',
        category: 'Coffee',
        price_medium: 45,
        price_large: 70,
        image_url: 'https://storage.googleapis.com/cafe-management-2c495.appspot.com/menu-img/1719647847864_cappuccino.jpg',
        calories: 90,
        customization_options: ['CREAM', 'MOCHA'],
        preparation_time: 5,
        rating: 4.8,
        tags: ['TRENDING'],
        allergens: ['nothing'],
    },
];

const TENANTS = [
    { slug: 'cafe1', name: 'Cafe One' },
    { slug: 'cafe2', name: 'Cafe Two' },
];

exports.seed = async (knex) => {
    const tenantIds = {};
    for (const t of TENANTS) {
        const existing = await knex('tenants').where({ slug: t.slug }).first();
        let tenant = existing;
        if (!tenant) {
            [tenant] = await knex('tenants').insert(t).returning('*');
        }
        tenantIds[t.slug] = tenant.id;

        const adminEmail = `admin@${t.slug}.local`;
        const adminExists = await knex('staff_admins')
            .where({ tenant_id: tenant.id, email: adminEmail })
            .first();
        if (!adminExists) {
            await knex('staff_admins').insert({
                tenant_id: tenant.id,
                first_name: 'Tenant',
                last_name: 'Admin',
                email: adminEmail,
                password: await hashPassword('Admin123!'),
                role: 'admin',
                phone: '9876500001',
            });
        }

        // Idempotent: insert only menu items whose title isn't already present,
        // so re-seeding an existing DB adds new demo items without duplicating.
        const existingMenu = await knex('menu_items')
            .where({ tenant_id: tenant.id })
            .select('id', 'title', 'image_url');
        const existingTitles = new Set(existingMenu.map((m) => m.title));
        const missingMenu = MENU.filter((m) => !existingTitles.has(m.title))
            .map((m) => ({ ...m, tenant_id: tenant.id }));
        if (missingMenu.length) {
            await knex('menu_items').insert(missingMenu);
        }

        // Backfill images for older demo items that shipped without one.
        for (const row of existingMenu) {
            const match = MENU.find((m) => m.title === row.title);
            if (match?.image_url && !row.image_url) {
                await knex('menu_items').where({ id: row.id }).update({ image_url: match.image_url });
            }
        }

        const tableCount = await knex('tables').where({ tenant_id: tenant.id }).count('* as c');
        if (Number(tableCount[0].c) === 0) {
            await knex('tables').insert([1, 2, 3, 4, 5, 6].map((number) => ({ tenant_id: tenant.id, number })));
        }

        await knex('settings')
            .insert({ tenant_id: tenant.id, data: DEFAULTS })
            .onConflict('tenant_id')
            .ignore();

        const discountExists = await knex('discounts')
            .where({ tenant_id: tenant.id, code: 'WELCOME10' })
            .first();
        if (!discountExists) {
            await knex('discounts').insert({
                tenant_id: tenant.id,
                code: 'WELCOME10',
                discount_percentage: 10,
                max_discount_amount: 50,
                min_order_amount: 0,
                expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000),
            });
        }
    }

    const platformEmail = process.env.PLATFORM_ADMIN_EMAIL || 'platform@cafe.local';
    const platformExists = await knex('staff_admins')
        .where({ email: platformEmail, is_platform_admin: true })
        .first();
    if (!platformExists) {
        await knex('staff_admins').insert({
            first_name: 'Platform',
            last_name: 'Admin',
            email: platformEmail,
            password: await hashPassword(process.env.PLATFORM_ADMIN_PASSWORD || 'Platform123!'),
            role: 'admin',
            is_platform_admin: true,
        });
    }

    console.log('seed complete', { tenants: Object.keys(tenantIds), platformEmail });
};
