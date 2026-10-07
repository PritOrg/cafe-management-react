import { describe, it, expect } from 'vitest';

/** Mirrors CartContext cart total: size price + option priceDeltas */
const computeLineTotal = (item) => {
    const sizes = item?.sizes || [];
    let unitBase = 0;
    if (sizes.length) {
        const match = sizes.find((s) => s.label === item.selectedSize)
            || sizes.find((s) => s.isDefault)
            || sizes[0];
        unitBase = Number(match?.price || 0);
    } else {
        const size = String(item.selectedSize || 'medium').toLowerCase();
        unitBase = Number(item.price?.[size] || item.price?.medium || 0);
    }
    const optionsDelta = Object.values(item.selectedOptions || {})
        .reduce((s, v) => s + (Number(v) || 0), 0);
    return (unitBase + optionsDelta) * (item.quantity || 1);
};

describe('cart modifier pricing (customer picker)', () => {
    it('includes custom size price', () => {
        const total = computeLineTotal({
            sizes: [{ label: '250ml', price: 99, isDefault: true }, { label: '500ml', price: 149 }],
            selectedSize: '500ml',
            quantity: 2,
        });
        expect(total).toBe(298);
    });

    it('includes modifier priceDeltas from selectedOptions', () => {
        const total = computeLineTotal({
            price: { medium: 100, large: 100 },
            selectedSize: 'medium',
            selectedOptions: { 'Whipped cream': 30, 'Almond milk': 20 },
            quantity: 1,
        });
        expect(total).toBe(150);
    });

    it('scales modifiers by quantity', () => {
        const total = computeLineTotal({
            price: { medium: 100, large: 100 },
            selectedSize: 'medium',
            selectedOptions: { 'Extra shot': 40 },
            quantity: 3,
        });
        expect(total).toBe(420);
    });

    it('legacy item without options uses size price only', () => {
        const total = computeLineTotal({
            price: { medium: 80, large: 100 },
            selectedSize: 'large',
            quantity: 1,
            selectedOptions: {},
        });
        expect(total).toBe(100);
    });
});
