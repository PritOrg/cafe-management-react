const { hashPassword } = require('../../services/authService');
const { DEFAULTS } = require('../../repositories/settingsRepo');

const MENU = [
    { title: 'House Latte', sub_title: 'Smooth espresso + steamed milk', category: 'Coffee', price_medium: 120, price_large: 160, preparation_time: 5, calories: 130 },
    { title: 'Cappuccino', sub_title: 'Classic foam cup', category: 'Coffee', price_medium: 110, price_large: 150, preparation_time: 5, calories: 120 },
    { title: 'Butter Croissant', sub_title: 'Flaky, baked daily', category: 'Pastries', price_medium: 90, price_large: 90, preparation_time: 2, calories: 260 },
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

        const menuCount = await knex('menu_items').where({ tenant_id: tenant.id }).count('* as c');
        if (Number(menuCount[0].c) === 0) {
            await knex('menu_items').insert(MENU.map((m) => ({ ...m, tenant_id: tenant.id })));
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
