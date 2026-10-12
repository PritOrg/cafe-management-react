import { describe, it, expect } from 'vitest';
import { toCsv, downloadCsv } from './dashboardCsv';

describe('toCsv', () => {
  it('quotes values and escapes embedded quotes', () => {
    expect(toCsv([{ date: '2026-10-01', revenue: 1050, note: 'GST "vat"' }]))
      .toBe('"2026-10-01","1050","GST ""vat"""');
  });
  it('renders null as empty and supports multiple rows', () => {
    expect(toCsv([{ a: 1, b: null }, { a: 2, b: 3 }])).toBe('"1",""\n"2","3"');
  });
  it('handles an empty dataset', () => {
    expect(toCsv([])).toBe('');
  });
});

describe('downloadCsv', () => {
  it('is a safe no-op outside the browser (SSR/tests)', () => {
    expect(() => downloadCsv('x.csv', toCsv([{ a: 1 }]))).not.toThrow();
  });
});