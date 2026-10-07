const { sendResponse } = require('../middleware/auth');
const { PAYMENT_METHODS, ORDER_STATUSES } = require('../constants/order');
const money = require('../utils/money');
const { getDb } = require('../db/pool');
const menuRepo = require('../repositories/menuRepo');
const orderRepo = require('../repositories/orderRepo');
const discountRepo = require('../repositories/discountRepo');
const tableRepo = require('../repositories/tableRepo');
const customerRepo = require('../repositories/customerRepo');
const activityRepo = require('../repositories/activityRepo');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const normalizeOptions = (options, selectedOptions) => {
    if (Array.isArray(options)) {
        return options
            .map((o) => ({
                name: typeof o === 'string' ? o : (o && o.name) || '',
                priceDelta: (o && Number(o.priceDelta)) || 0,
            }))
            .filter((o) => o.name);
    }
    if (selectedOptions && typeof selectedOptions === 'object') {
        return Object.entries(selectedOptions)
            .map(([category, name]) => ({
                name: typeof name === 'string' ? name : category,
                priceDelta: 0,
            }))
            .filter((o) => o.name);
    }
    return [];
};

const generateOrderNumber = async (tenantId, trx = getDb()) => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `ORD-${yy}${mm}${dd}`;
    return orderRepo.nextOrderNumber(tenantId, prefix, trx);
};

const resolveDiscount = async (tenantId, discountCode, lines, subtotalMinor) => {
    if (!discountCode) return { discountAmount: 0, discountId: null };
    const discount = await discountRepo.findByCode(tenantId, discountCode);
    if (!discount || new Date() > discount.expiresAt) {
        return { discountAmount: 0, discountId: null };
    }
    const applicable = (discount.applicableItems || []).map((id) => id.toString());
    const eligibleMinor = lines.reduce((sum, line) => {
        return applicable.includes(String(line.menuItem))
            ? sum + money.toMinor(line.itemPrice) * line.quantity
            : sum;
    }, 0);
    if (subtotalMinor < money.toMinor(discount.minOrderAmount || 0)) {
        return { discountAmount: 0, discountId: null };
    }
    const discountMinor = Math.min(
        money.applyBps(eligibleMinor, Math.round(discount.discountPercentage * 100)),
        money.toMinor(discount.maxDiscountAmount || 0)
    );
    return { discountAmount: money.fromMinor(discountMinor), discountId: discount._id };
};

const placeOrder = async (req) => {
    const tenantId = req.tenantId;
    const { tableNumber, items, tipAmount, discountCode, paymentMethod, phone, customerName } = req.body || {};

    if (!tenantId) {
        return { status: 400, message: 'Tenant context is required' };
    }
    if (!Array.isArray(items) || items.length === 0) {
        return { status: 400, message: 'Order must contain at least one item' };
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
        return { status: 400, message: `Invalid payment method. Allowed: ${PAYMENT_METHODS.join(', ')}` };
    }

    const parsedTip = tipAmount == null || tipAmount === '' ? 0 : Number(tipAmount);
    if (!Number.isFinite(parsedTip) || parsedTip < 0) {
        return { status: 400, message: 'tipAmount must be a non-negative number' };
    }

    let parsedTable;
    if (tableNumber != null && tableNumber !== '') {
        parsedTable = Number(tableNumber);
        if (!Number.isInteger(parsedTable) || parsedTable < 1) {
            return { status: 400, message: 'tableNumber must be a positive integer' };
        }
    }

    let subtotal = 0;
    let totalPreparationTime = 0;
    const lines = [];

    for (const raw of items) {
        const menuId = (raw && (raw.menuItemId || raw.menuItem)) || null;
        const size = String((raw && (raw.size || raw.selectedSize)) || '').toLowerCase();
        const quantity = Number(raw && raw.quantity);

        if (!menuId) return { status: 400, message: 'Each item requires a menuItemId' };
        if (!['medium', 'large'].includes(size)) {
            return { status: 400, message: `Invalid size "${size}". Allowed: medium, large` };
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            return { status: 400, message: 'Each item quantity must be a positive integer' };
        }

        const menu = await menuRepo.findByIdLean(tenantId, menuId);
        if (!menu) return { status: 400, message: `Menu item not found: ${menuId}` };
        const price = Number(menu.price && menu.price[size]);
        if (!Number.isFinite(price)) {
            return { status: 400, message: `Menu item "${menu.title}" has no price for size ${size}` };
        }

        subtotal += price * quantity;
        const prep = Number(menu.preparationTime) || 0;
        totalPreparationTime += prep;

        const options = normalizeOptions(raw.options, raw.selectedOptions);
        lines.push({
            menuItem: menu._id,
            size,
            quantity,
            customizations: options.map((o) => o.name),
            specialInstructions: (raw && typeof raw.specialInstructions === 'string') ? raw.specialInstructions : '',
            itemPrice: price,
            preparationTime: prep,
        });
    }

    const subtotalMinor = money.toMinor(subtotal);
    const { discountAmount, discountId } = await resolveDiscount(tenantId, discountCode, lines, subtotalMinor);
    const discountMinor = money.toMinor(discountAmount);
    const taxableMinor = Math.max(subtotalMinor - discountMinor, 0);
    const taxMinor = money.applyBps(taxableMinor, money.TAX_BPS);
    const tipMinor = money.toMinor(parsedTip);
    const finalMinor = taxableMinor + taxMinor + tipMinor;

    const isStaffRole = req.role === 'admin' || req.role === 'staff';
    const placedByStaff = isStaffRole ? req.userId : undefined;

    const saved = await getDb().transaction(async (trx) => {
        let customer = null;
        if (phone) {
            const parts = String(customerName || '').trim().split(/\s+/);
            customer = await customerRepo.upsertByPhone(tenantId, {
                phone: String(phone).trim(),
                firstName: parts[0],
                lastName: parts.slice(1).join(' ') || undefined,
            }, trx);
        }

        const placedByCustomer = customer ? customer._id : undefined;

        const order = await orderRepo.create(tenantId, {
            orderNumber: await generateOrderNumber(tenantId, trx),
            tableNumber: parsedTable,
            placedByCustomer,
            placedByStaff,
            items: lines,
            tipAmount: parsedTip,
            discountCode: discountId,
            discountAmount,
            paymentMethod,
            paymentStatus: 'paid',
            totalAmount: round2(money.fromMinor(subtotalMinor)),
            finalAmount: round2(money.fromMinor(finalMinor)),
        }, trx);

        for (const line of lines) {
            await orderRepo.incrementMenuItemOrderCount(tenantId, line.menuItem, trx);
        }

        if (parsedTable) {
            await tableRepo.updateByNumber(tenantId, parsedTable, {
                status: 'occupied',
                currentOrder: order._id,
            }, trx);
        }

        await activityRepo.log({
            tenantId,
            actorId: req.userId,
            actorType: isStaffRole ? req.role : customer ? 'customer' : 'system',
            action: 'order.place',
            entity: 'order',
            entityId: order._id,
            meta: {
                orderNumber: order.orderNumber,
                paymentMethod,
                finalAmount: order.finalAmount,
            },
        });

        return order;
    });

    // Loyalty hook (Phase K): points per ₹10 paid; membership from thresholds
    if (saved.placedByCustomer) {
        const addPoints = Math.floor(finalMinor / 1000);
        const current = await customerRepo.findById(tenantId, saved.placedByCustomer);
        let membershipLevel = current?.membershipLevel || 'Silver';
        const points = (current?.loyaltyPoints || 0) + addPoints;
        if (points >= 5000) membershipLevel = 'Platinum';
        else if (points >= 2000) membershipLevel = 'Gold';
        else membershipLevel = 'Silver';
        if (addPoints > 0 || membershipLevel !== current?.membershipLevel) {
            await customerRepo.updateLoyalty(tenantId, saved.placedByCustomer, {
                addPoints,
                membershipLevel,
            });
        }
    }

    const fullOrder = await orderRepo.findByIdForOwner(tenantId, saved._id);

    return {
        status: 201,
        message: 'Order placed successfully',
        data: {
            order: fullOrder || saved,
            orderNumber: saved.orderNumber,
            taxAmount: round2(money.fromMinor(taxMinor)),
            totalPreparationTime,
        },
    };
};

module.exports = { placeOrder, generateOrderNumber, ORDER_STATUSES };
