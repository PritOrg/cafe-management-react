import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import useSocketStatus from '../../hooks/useSocketStatus';

const META = {
  connected: { color: 'success.main', label: 'Live — realtime connected' },
  connecting: { color: 'warning.main', label: 'Connecting to realtime…' },
  disconnected: { color: 'text.disabled', label: 'Realtime offline' },
};

/** Small indicator showing the Socket.IO connection state (admin header). */
const RealtimeStatus = ({ sx }) => {
  const status = useSocketStatus();
  const meta = META[status] || META.disconnected;
  return (
    <Tooltip title={meta.label}>
      <Box
        aria-label={meta.label}
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: meta.color,
          boxShadow: (t) => `0 0 0 3px ${t.palette.action.hover}`,
          transition: 'background-color .2s ease',
          ...sx,
        }}
      />
    </Tooltip>
  );
};

export default React.memo(RealtimeStatus);
