import { describe, it, expect } from 'vitest';
import { compareValues, sortRows, toggleSort } from './sortable';

describe('compareValues', () => {
  it('sorts numbers numerically and strings lexically', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues('b', 'a')).toBeGreaterThan(0);
  });
  it('puts empty/missing values last', () => {
    expect(compareValues('', 'a')).toBeGreaterThan(0);
    expect(compareValues(null, 'a')).toBeGreaterThan(0);
  });
});

describe('sortRows', () => {
  const rows = [
    { id: 'a', orderNumber: 'ORD-0002', total: 100 },
    { id: 'b', orderNumber: 'ORD-0010', total: 50 },
    { id: 'c', orderNumber: 'ORD-0001', total: null },
  ];
  it('sorts ascending (string-aware, not numeric-mangled)', () => {
    expect(sortRows(rows, 'orderNumber', 'asc').map((r) => r.id)).toEqual(['c', 'a', 'b']);
  });
  it('sorts totals numerically with nulls last', () => {
    expect(sortRows(rows, 'total', 'asc').map((r) => r.id)).toEqual(['b', 'a', 'c']);
    expect(sortRows(rows, 'total', 'desc').map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
  it('returns a copy by default and does not mutate input', () => {
    const copy = sortRows(rows, 'total');
    expect(copy).not.toBe(rows);
    expect(rows[0].id).toBe('a');
  });
});

describe('toggleSort', () => {
  it('toggles asc->desc and switches keys', () => {
    expect(toggleSort({ key: 'total', dir: 'asc' }, 'total')).toEqual({ key: 'total', dir: 'desc' });
    expect(toggleSort({ key: 'total', dir: 'desc' }, 'total')).toEqual({ key: 'total', dir: 'asc' });
    expect(toggleSort(null, 'date')).toEqual({ key: 'date', dir: 'asc' });
  });
});