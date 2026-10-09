import { useSyncExternalStore } from 'react';
import { subscribeStatus, getSocketStatus } from '../services/socket';

/** Realtime connection status: 'connected' | 'connecting' | 'disconnected'. */
const useSocketStatus = () => useSyncExternalStore(subscribeStatus, getSocketStatus, getSocketStatus);

export default useSocketStatus;
