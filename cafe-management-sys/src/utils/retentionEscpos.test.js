import { describe, it, expect } from 'vitest';

const pruneCutoff = (days) => new Date(Date.now() - days * 24 * 3600 * 1000);
const buildEscPos = ({ lines = [], cut = true } = {}) => {
    const parts = [Buffer.from([0x1b, 0x40])];
    for (const line of lines) parts.push(Buffer.from(`${line}\n`, 'utf8'));
    if (cut) parts.push(Buffer.from([0x1d, 0x56, 0x00]));
    return Buffer.concat(parts);
};

describe('activity retention + ESC/POS contracts', () => {
    it('retention cutoff scales with days', () => {
        expect((Date.now() - pruneCutoff(30).getTime()) / 86400000).toBeCloseTo(30, 1);
        expect((Date.now() - pruneCutoff(365).getTime()) / 86400000).toBeCloseTo(365, 1);
    });

    it('escpos buffer starts with init and optional cut', () => {
        const buf = buildEscPos({ lines: ['Total Rs. 210.00'], cut: true });
        expect(buf[0]).toBe(0x1b);
        expect(buf[1]).toBe(0x40);
        expect(buf.toString('utf8')).toContain('Total Rs. 210.00');
        expect(buf[buf.length - 3]).toBe(0x1d);
        expect(buf[buf.length - 2]).toBe(0x56);
        expect(buf[buf.length - 1]).toBe(0x00);
    });
});
