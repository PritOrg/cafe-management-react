import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { outboxCount, flushOutbox } from '../../utils/orderOutbox';

/**
 * Shows queued offline orders and replays them when the connection returns.
 * Notification-only: the server dedupes replays via clientOrderId.
 */
const OfflineBanner = () => {
  const [count, setCount] = useState(0);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  const refresh = async () => setCount(await outboxCount());

  useEffect(() => {
    refresh();
    const handleOnline = async () => {
      setOnline(true);
      await flushOutbox();
      refresh();
    };
    const handleOffline = () => {
      setOnline(false);
      refresh();
    };
    const handleChange = () => refresh();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('outbox:changed', handleChange);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('outbox:changed', handleChange);
    };
  }, []);

  if (count === 0) return null;

  return (
    <Snackbar open anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
      <Alert severity={online ? 'info' : 'warning'} icon={<CloudOffIcon />} variant="filled">
        {count} order{count === 1 ? '' : 's'} queued {online ? '— syncing…' : '— will sync when online'}
      </Alert>
    </Snackbar>
  );
};

export default React.memo(OfflineBanner);
