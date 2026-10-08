import { useEffect, useState } from 'react';
import { menuAPI, unwrap } from '../services/api';

// Module-level cache so the menu is fetched once per session and shared across
// pages. `prefetchMenu` can be fired on link hover for instant navigation.
let cache = null;
let inflight = null;

const normalize = (body) => {
  const data = unwrap(body);
  return Array.isArray(data) ? data : [];
};

export const prefetchMenu = () => {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = menuAPI
    .getAll()
    .then((body) => {
      cache = normalize(body);
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export const clearMenuCache = () => {
  cache = null;
};

const useMenuData = () => {
  const [items, setItems] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    if (cache) {
      setItems(cache);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    prefetchMenu()
      .then((data) => {
        if (active) {
          setItems(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const reload = () => {
    clearMenuCache();
    return prefetchMenu();
  };

  return { items, loading, error, reload };
};

export default useMenuData;
