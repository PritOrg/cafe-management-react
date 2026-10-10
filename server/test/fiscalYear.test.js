import { describe, it, expect } from 'vitest';
import { fiscalYear } from '../repositories/settingsRepo.js';

describe('fiscalYear (Indian FY, April start by default)', () => {
    it('maps April+ to the current FY and Jan–Mar to the previous FY', () => {
        expect(fiscalYear(new Date(2025, 3, 1), 4)).toBe('2025-26'); // 2025-04-01
        expect(fiscalYear(new Date(2025, 11, 31), 4)).toBe('2025-26'); // 2025-12-31
        expect(fiscalYear(new Date(2025, 0, 15), 4)).toBe('2024-25'); // 2025-01-15
        expect(fiscalYear(new Date(2025, 2, 31), 4)).toBe('2024-25'); // 2025-03-31
    });
    it('supports a custom fiscal start month', () => {
        expect(fiscalYear(new Date(2025, 0, 15), 1)).toBe('2025-26'); // calendar year
    });
    it('rolls the short year label correctly at decade ends', () => {
        expect(fiscalYear(new Date(2029, 5, 1), 4)).toBe('2029-30');
        expect(fiscalYear(new Date(2030, 5, 1), 4)).toBe('2030-31');
    });
});