import { useCallback, useSyncExternalStore } from 'react';
import { favouritesStore } from '../utils/favouritesStore';

/**
 * Reactive favourites backed by a module-level store (localStorage persisted).
 * Every component using this hook re-renders together when a favourite toggles.
 */
const useFavourites = () => {
  const favourites = useSyncExternalStore(
    favouritesStore.subscribe,
    favouritesStore.getSnapshot,
    favouritesStore.getSnapshot
  );

  const toggleFavourite = useCallback((id) => favouritesStore.toggle(id), []);
  const isFavourite = useCallback((id) => favourites.has(id), [favourites]);

  return { favourites, isFavourite, toggleFavourite, count: favourites.size };
};

export default useFavourites;
