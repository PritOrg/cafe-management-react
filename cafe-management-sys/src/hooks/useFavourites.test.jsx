import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFavourites from './useFavourites';
import { favouritesStore } from '../utils/favouritesStore';

describe('useFavourites', () => {
    beforeEach(() => {
        localStorage.clear();
        favouritesStore.clear();
    });

    it('toggles a favourite and persists it', () => {
        const { result } = renderHook(() => useFavourites());

        act(() => result.current.toggleFavourite('muffins'));
        expect(result.current.isFavourite('muffins')).toBe(true);
        expect(result.current.count).toBe(1);
        expect(JSON.parse(localStorage.getItem('favourites'))).toContain('muffins');

        act(() => result.current.toggleFavourite('muffins'));
        expect(result.current.isFavourite('muffins')).toBe(false);
        expect(result.current.count).toBe(0);
    });

    it('keeps favourites in sync across subscribers', () => {
        const a = renderHook(() => useFavourites());
        const b = renderHook(() => useFavourites());

        act(() => a.result.current.toggleFavourite('latte'));
        expect(b.result.current.isFavourite('latte')).toBe(true);
    });
});
