import { describe, it, expect } from 'vitest';
import { onColor, buildTheme } from './m3Theme';

describe('m3Theme', () => {
    it('picks a contrasting "on" color', () => {
        expect(onColor('#ffffff')).toBe('#1D1B20');
        expect(onColor('#000000')).toBe('#FFFFFF');
    });

    it('exposes a readable brand text token distinct from the bright fill', () => {
        const theme = buildTheme('light', '#ff6b35', '#f7931e');
        expect(theme.brand.primary).toBe('#ff6b35');
        expect(theme.brand.primaryText).toBeTruthy();
        expect(theme.brand.primaryText).not.toBe('#ff6b35');
        expect(theme.shape.borderRadius).toBe(12);
    });

    it('honours the palette mode', () => {
        expect(buildTheme('dark', '#ff6b35', '#f7931e').palette.mode).toBe('dark');
        expect(buildTheme('light', '#ff6b35', '#f7931e').palette.mode).toBe('light');
    });

    it('falls back to a valid hex for bad input', () => {
        const theme = buildTheme('light', 'not-a-color', 'nope');
        expect(theme.brand.primary).toBe('#ff6b35');
        expect(theme.brand.accent).toBe('#f7931e');
    });
});
