import { describe, it, expect } from 'vitest';
import { slugify, groupByCategory, categoryIds } from './menuCategorise';

describe('slugify', () => {
  it('lowercases and dashes non-alphanumerics', () => {
    expect(slugify('Hot Coffee')).toBe('hot-coffee');
    expect(slugify('Bakery & Sweets')).toBe('bakery-sweets');
  });
  it('falls back to other', () => {
    expect(slugify('#')).toBe('other');
  });
});

describe('groupByCategory', () => {
  const items = [
    { id: 1, category: 'Bakery', title: 'Croissant' },
    { id: 2, category: 'Coffee', title: 'Latte' },
    { id: 3, category: 'Bakery', title: 'Muffin' },
    { id: 4, title: 'Water' },
  ];
  const groups = groupByCategory(items);

  it('groups by category, sorted, with uncategorised under Other', () => {
    expect(groups.map((g) => g.category)).toEqual(['Bakery', 'Coffee', 'Other']);
    expect(groups[0].items.map((i) => i.title)).toEqual(['Croissant', 'Muffin']);
  });
  it('keeps the insertion order of items within a group', () => {
    expect(groupByCategory([{ id: 1, category: 'A' }, { id: 2, category: 'A' }])[0].items.map((i) => i.id)).toEqual([1, 2]);
  });
  it('derives stable slugs for anchor jumps', () => {
    expect(categoryIds(items)).toEqual(['bakery', 'coffee', 'other']);
  });
});