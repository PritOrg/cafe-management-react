import { describe, it, expect } from 'vitest';
import { suggestedPurchase, reorderItems } from './inventorySuggest';

describe('suggestedPurchase', () => {
  it('returns nothing when reorderQty is unset or zero', () => {
    expect(suggestedPurchase({ quantity: 5 })).toBeNull();
    expect(suggestedPurchase({ reorderQty: 0, quantity: 5 })).toBeNull();
  });
  it('returns nothing while on-hand is at or above the reorder level', () => {
    expect(suggestedPurchase({ reorderQty: 10, quantity: 12 })).toBeNull();
    expect(suggestedPurchase({ reorderQty: 10, quantity: 10 })).toBeNull();
  });
  it('suggests the top-up when below the reorder level', () => {
    expect(suggestedPurchase({ reorderQty: 10, quantity: 3 })).toBe(7);
    expect(suggestedPurchase({ reorderQty: 25, quantity: 0 })).toBe(25);
  });
});

describe('reorderItems', () => {
  it('filters to items that need reordering', () => {
    const items = [
      { id: 'a', reorderQty: 10, quantity: 8 },
      { id: 'b', reorderQty: 10, quantity: 12 },
      { id: 'c', reorderQty: 6, quantity: 1 },
    ];
    const list = reorderItems(items);
    expect(list).toHaveLength(2);
    expect(list.map((r) => r.item.id)).toEqual(['a', 'c']);
    expect(list.find((r) => r.item.id === 'a').suggested).toBe(2);
    expect(list.find((r) => r.item.id === 'c').suggested).toBe(5);
  });
});