import { describe, it, expect } from 'vitest';
import {
  normalizeSize,
  resolveSize,
  optionDelta,
  unitPrice,
  lineTotal,
  cartTotals,
  estimateTotals,
  generateCartItemId,
  buildOrderItems,
} from './cartPricing';

const legacy = { _id: 'm1', price: { medium: 100, large: 150 }, quantity: 2, selectedSize: 'large' };
const flexible = {
  _id: 'm2',
  sizes: [
    { label: 'Regular', price: 80 },
    { label: 'Large', price: 120, isDefault: true },
  ],
  quantity: 1,
  selectedSize: 'Regular',
  selectedOptions: { Extra: 10 },
};

describe('cartPricing', () => {
  it('normalizeSize', () => {
    expect(normalizeSize('LARGE')).toBe('large');
    expect(normalizeSize('small')).toBe('medium');
    expect(normalizeSize(undefined)).toBe('medium');
  });

  it('resolveSize picks the explicit/default size, else falls back', () => {
    const item = { sizes: [{ label: 'S', price: 1 }, { label: 'L', price: 2, isDefault: true }] };
    expect(resolveSize(item, 'S')).toBe('S');
    expect(resolveSize(item, 'X')).toBe('L'); // invalid -> default
    expect(resolveSize({ price: {} }, 'large')).toBe('large');
    expect(resolveSize({ price: {} }, 'weird')).toBe('medium');
  });

  it('unitPrice handles flexible sizes and legacy medium/large', () => {
    expect(unitPrice(legacy)).toBe(150);
    expect(unitPrice({ ...flexible, selectedSize: 'Regular' })).toBe(80);
    expect(unitPrice({ price: { medium: 100, large: 150 }, selectedSize: 'medium' })).toBe(100);
  });

  it('optionDelta sums numeric option values', () => {
    expect(optionDelta({ a: 10, b: 5 })).toBe(15);
    expect(optionDelta(undefined)).toBe(0);
  });

  it('lineTotal = (unit + options) x qty', () => {
    expect(lineTotal(legacy)).toBe(300); // 150 x 2
    expect(lineTotal(flexible)).toBe(90); // (80 + 10) x 1
  });

  it('cartTotals aggregates subtotal, prep time and count', () => {
    const t = cartTotals([
      { ...legacy, preparationTime: 5 },
      { ...flexible, preparationTime: 3 },
    ]);
    expect(t.subtotal).toBe(390); // 300 + 90
    expect(t.count).toBe(3);
    expect(t.totalPrepTime).toBe(13); // 5*2 + 3*1
  });

  it('estimateTotals applies GST bps + tip, rounding to paise', () => {
    const items = [{ _id: 'a', price: { medium: 100, large: 100 }, quantity: 1, selectedSize: 'medium' }];
    const est = estimateTotals(items, { taxBps: 500, tipAmount: 10 });
    expect(est.subtotal).toBe(100);
    expect(est.taxAmount).toBe(5);
    expect(est.tipAmount).toBe(10);
    expect(est.total).toBe(115);
  });

  it('empty cart estimates to zero', () => {
    expect(estimateTotals([])).toEqual({
      subtotal: 0, taxAmount: 0, tipAmount: 0, total: 0, totalPrepTime: 0, count: 0,
    });
  });

  it('generateCartItemId is order-independent over options', () => {
    const a = generateCartItemId('m1', 'large', { Cheese: 10, Size: 0 });
    const b = generateCartItemId('m1', 'large', { Size: 0, Cheese: 10 });
    expect(a).toBe(b);
    expect(a).not.toBe(generateCartItemId('m1', 'medium', { Cheese: 10 }));
  });

  it('buildOrderItems maps to the server contract', () => {
    const [line] = buildOrderItems([{ ...flexible, specialInstructions: 'no ice' }]);
    expect(line).toEqual({
      menuItem: 'm2',
      size: 'Regular',
      quantity: 1,
      options: [{ name: 'Extra', priceDelta: 10 }],
      specialInstructions: 'no ice',
    });
  });
});
