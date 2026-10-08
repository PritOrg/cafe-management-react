import { useEffect, useRef } from 'react';
import { subscribeOps } from '../services/socket';

/**
 * Subscribe to realtime ops events for the current tenant. Handlers are kept in
 * a ref so the subscription stays stable across re-renders.
 *
 *   useOpsEvents({ 'order:created': refetch, 'order:status': refetch });
 */
const useOpsEvents = (handlers) => {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const unsubscribers = Object.keys(ref.current).map((event) =>
      subscribeOps(event, (payload) => ref.current[event]?.(payload))
    );
    return () => unsubscribers.forEach((unsub) => unsub && unsub());
  }, []);
};

export default useOpsEvents;
