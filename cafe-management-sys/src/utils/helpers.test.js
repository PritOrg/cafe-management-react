import { describe, it, expect } from 'vitest';
import * as helpers from './helpers.js';
import * as constants from './constants.js';

describe('frontend utils helpers/constants', () => {
    it('exports helper functions', () => {
        const keys = Object.keys(helpers);
        expect(keys.length).toBeGreaterThan(0);
        for (const k of keys) {
            expect(typeof helpers[k]).toBe('function');
        }
    });

    it('exports constants object', () => {
        expect(constants).toBeTypeOf('object');
        expect(Object.keys(constants).length).toBeGreaterThan(0);
    });
});
