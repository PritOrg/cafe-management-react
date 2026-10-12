import { test, expect } from '@playwright/test';

test('login -> browse menu -> add to cart -> order -> invoice PDF exists (HTTP 200)', async ({ page, request }) => {
    await page.goto('/login-register');
    await page.getByLabel(/email/i).first().fill('admin@cafe1.local');
    await page.getByLabel(/password/i).first().fill('Admin123!');
    await page.getByRole('button', { name: /login/i }).first().click();
    await page.waitForURL('**/admin**', { timeout: 15000 });

    // Menu loads on the storefront (tenant-scoped).
    await page.goto('/menu');
    await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible({ timeout: 15000 });

    // Server accepts a guest order (HTTP path; no login needed on POST /orders),
    // and an invoice can be issued + PDF downloaded (auth required).
    const login = await request.post('http://localhost:4969/api/v1/auth/login', {
        data: { email: 'admin@cafe1.local', password: 'Admin123!' },
        headers: { Host: 'cafe1.localhost' },
    });
    expect(login.ok()).toBe(true);
    const token = (await login.json()).data.token;

    const menu = await request.get('http://localhost:4969/api/v1/menu', { headers: { Host: 'cafe1.localhost' } });
    const items = (await menu.json()).data || [];
    expect(items.length).toBeGreaterThan(0);
    const itemId = items[0]._id || items[0].id;

    const orderResp = await request.post('http://localhost:4969/api/v1/orders', {
        data: {
            items: [{ menuItemId: itemId, size: 'medium', quantity: 1 }],
            paymentMethod: 'cash',
            phone: '9800000000',
            customerName: 'Playwright',
        },
        headers: { Host: 'cafe1.localhost' },
    });
    expect(orderResp.ok()).toBe(true);
    const orderId = (await orderResp.json()).data.order._id;

    const invoiceResp = await request.post(`http://localhost:4969/api/v1/orders/${orderId}/invoice`, {
        headers: { Host: 'cafe1.localhost', Authorization: `Bearer ${token}` },
    });
    expect(invoiceResp.ok()).toBe(true);
    const invoiceId = (await invoiceResp.json()).data.id;

    const pdf = await request.get(`http://localhost:4969/api/v1/invoices/${invoiceId}/pdf?format=a4&download=1&token=${token}`, {
        headers: { Host: 'cafe1.localhost' },
    });
    expect(pdf.status()).toBe(200);
    expect(await pdf.body()).toHaveLengthGreaterThan(400);
});