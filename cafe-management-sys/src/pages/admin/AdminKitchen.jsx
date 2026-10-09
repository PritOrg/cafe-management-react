import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Paper,
  Stack,
} from '@mui/material';
import Refresh from '@mui/icons-material/Refresh';
import AccessTime from '@mui/icons-material/AccessTime';
import LocalDining from '@mui/icons-material/LocalDining';
import Whatshot from '@mui/icons-material/Whatshot';
import { kitchenAPI, ordersAPI, unwrap } from '../../services/api';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../components/ui';
import useOpsEvents from '../../hooks/useOpsEvents';
import { playChime } from '../../utils/chime';

// KDS age thresholds: green < 10m, amber 10–15m, red > 15m.
const ageBorder = (m) => (m > 15 ? 'error.main' : m >= 10 ? 'warning.main' : 'success.main');
const ageChip = (m) => (m > 15 ? 'error' : m >= 10 ? 'warning' : 'success');
const statusColor = (s) => (s === 'pending' ? 'warning' : s === 'preparing' ? 'info' : 'success');
const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'served' };

const AdminKitchen = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const body = await kitchenAPI.getActiveOrders();
      setOrders(unwrap(body) || []);
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
      setError(err.message || 'Failed to load kitchen board');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const advance = useCallback(async (order, next) => {
    try {
      await ordersAPI.updateStatus(order._id, next);
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 15000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  // Realtime: new tickets chime + toast; any status change refreshes.
  const handleNewOrder = useCallback((payload) => {
    fetchOrders();
    playChime();
    toast.info(`New ticket${payload?.orderNumber ? ` ${payload.orderNumber}` : ''}`);
  }, [fetchOrders, toast]);

  useOpsEvents({ 'order:created': handleNewOrder, 'order:status': fetchOrders });

  // Keyboard bump: press 1–9 to advance the Nth ticket.
  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      const index = Number(event.key);
      if (index >= 1 && index <= 9) {
        const order = orders[index - 1];
        const next = order && NEXT_STATUS[order.status];
        if (next) advance(order, next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [orders, advance]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalDining /> Kitchen Display
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Press <strong>1–9</strong> to bump a ticket · green &lt;10m · amber 10–15m · red &gt;15m
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchOrders}>Refresh</Button>
      </Box>

      {loading && !orders.length ? (
        <LoadingState label="Loading kitchen tickets…" rows={3} />
      ) : error && !orders.length ? (
        <ErrorState title="Couldn't load the kitchen board" message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary">No active kitchen tickets</Typography></CardContent></Card>
      ) : null}

      <Grid container spacing={2}>
        {orders.map((order, index) => (
          <Grid item xs={12} sm={6} md={4} key={order._id}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                borderLeft: 6,
                borderColor: ageBorder(order.minutesOpen),
                height: '100%',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {index < 9 && (
                    <Chip size="small" variant="outlined" label={index + 1} sx={{ fontWeight: 700 }} />
                  )}
                  <Typography variant="h6" fontWeight={700}>{order.orderNumber}</Typography>
                </Stack>
                <Chip size="small" color={statusColor(order.status)} label={order.status} />
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip
                  size="small"
                  color={ageChip(order.minutesOpen)}
                  icon={<AccessTime />}
                  label={`${order.minutesOpen} min`}
                />
                {order.tableNumber && <Chip size="small" label={`Table ${order.tableNumber}`} />}
              </Stack>

              {order.items.map((item, idx) => (
                <Box key={idx} sx={{ mb: 1, pb: 1, borderBottom: '1px dashed', borderColor: 'divider' }}>
                  <Typography fontWeight={600}>
                    {item.quantity} × {item.name} ({item.size})
                  </Typography>
                  {(item.customizations || []).length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {(item.customizations || []).join(', ')}
                    </Typography>
                  )}
                  {item.specialInstructions && (
                    <Typography variant="caption" color="error.main" sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      <Whatshot fontSize="inherit" /> {item.specialInstructions}
                    </Typography>
                  )}
                </Box>
              ))}

              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {order.status === 'pending' && (
                  <Button size="small" variant="contained" onClick={() => advance(order, 'preparing')}>Start</Button>
                )}
                {order.status === 'preparing' && (
                  <Button size="small" variant="contained" color="success" onClick={() => advance(order, 'ready')}>Ready</Button>
                )}
                {order.status === 'ready' && (
                  <Button size="small" variant="outlined" onClick={() => advance(order, 'served')}>Serve</Button>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminKitchen;
