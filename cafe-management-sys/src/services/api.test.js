import { describe, it, expect } from 'vitest';
import { unwrap } from '../services/api';

describe('unwrap', () => {
    it('returns data from envelope', () => {
        expect(unwrap({ success: true, data: [1, 2] })).toEqual([1, 2]);
        expect(unwrap({ success: true, data: { a: 1 } })).toEqual({ a: 1 });
    });

    it('passes through raw arrays and objects without data key', () => {
        expect(unwrap([1, 2, 3])).toEqual([1, 2, 3]);
        const raw = { title: 'Latte' };
        expect(unwrap(raw)).toBe(raw);
    });

    it('handles null/undefined', () => {
        expect(unwrap(null)).toBe(null);
        expect(unwrap(undefined)).toBe(undefined);
    });
});
