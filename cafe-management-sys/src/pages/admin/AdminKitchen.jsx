import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Paper,
  Stack,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
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
const NEXT_STATUS = { pending: 'preparing', preparing: 'ready', ready: 'served' };

const COLUMNS = [
  { status: 'pending', title: 'New', action: 'Start', actionColor: 'primary' },
  { status: 'preparing', title: 'Preparing', action: 'Ready', actionColor: 'success' },
  { status: 'ready', title: 'Ready to serve', action: 'Serve', actionVariant: 'outlined' },
];

const Ticket = ({ order, shortcut, onAdvance }) => {
  const column = COLUMNS.find((c) => c.status === order.status) || COLUMNS[0];
  return (
    <Paper
      elevation={3}
      sx={{ p: 2, borderLeft: 6, borderColor: ageBorder(order.minutesOpen), mb: 2 }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {shortcut && <Chip size="small" variant="outlined" label={shortcut} sx={{ fontWeight: 700 }} />}
          <Typography variant="h6" fontWeight={700}>{order.orderNumber}</Typography>
        </Stack>
        <Chip size="small" color={ageChip(order.minutesOpen)} icon={<AccessTime />} label={`${order.minutesOpen}m`} />
      </Stack>

      {order.tableNumber && (
        <Typography variant="caption" color="text.secondary">Table {order.tableNumber}</Typography>
      )}

      {order.items.map((item, idx) => (
        <Box key={idx} sx={{ mt: 1, pb: 1, borderBottom: '1px dashed', borderColor: 'divider' }}>
          <Typography fontWeight={600}>{item.quantity} × {item.name} ({item.size})</Typography>
          {(item.customizations || []).length > 0 && (
            <Typography variant="caption" color="text.secondary">{(item.customizations || []).join(', ')}</Typography>
          )}
          {item.specialInstructions && (
            <Typography variant="caption" color="error.main" sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              <Whatshot fontSize="inherit" /> {item.specialInstructions}
            </Typography>
          )}
        </Box>
      ))}

      <Button
        fullWidth
        size="large"
        variant={column.actionVariant || 'contained'}
        color={column.actionColor || 'primary'}
        onClick={() => onAdvance(order, NEXT_STATUS[order.status])}
        sx={{ mt: 1.5, minHeight: 44 }}
      >
        {column.action}
      </Button>
    </Paper>
  );
};

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
    if (!next) return;
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

  const handleNewOrder = useCallback((payload) => {
    fetchOrders();
    playChime();
    toast.info(`New ticket${payload?.orderNumber ? ` ${payload.orderNumber}` : ''}`);
  }, [fetchOrders, toast]);

  useOpsEvents({ 'order:created': handleNewOrder, 'order:status': fetchOrders });

  // Flattened in column order so shortcut 1..9 matches the board left→right.
  const byStatus = useMemo(() => {
    const grouped = { pending: [], preparing: [], ready: [] };
    orders.forEach((o) => { (grouped[o.status] || (grouped[o.status] = [])).push(o); });
    grouped.pending.sort((a, b) => b.minutesOpen - a.minutesOpen);
    grouped.preparing.sort((a, b) => b.minutesOpen - a.minutesOpen);
    grouped.ready.sort((a, b) => b.minutesOpen - a.minutesOpen);
    return grouped;
  }, [orders]);

  const flat = useMemo(() => COLUMNS.flatMap((c) => byStatus[c.status] || []), [byStatus]);
  const shortcutFor = (order) => {
    const i = flat.indexOf(order);
    return i >= 0 && i < 9 ? i + 1 : null;
  };

  useEffect(() => {
    const onKey = (event) => {
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      const index = Number(event.key);
      if (index >= 1 && index <= 9) {
        const order = flat[index - 1];
        if (order) advance(order, NEXT_STATUS[order.status]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flat, advance]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalDining /> Kitchen Display
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Press <strong>1–9</strong> to bump · green &lt;10m · amber 10–15m · red &gt;15m
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
      ) : (
        <Grid2 container spacing={2}>
          {COLUMNS.map((col) => {
            const list = byStatus[col.status] || [];
            return (
              <Grid2 xs={12} md={4} key={col.status}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{col.title}</Typography>
                  <Chip size="small" label={list.length} />
                </Box>
                {list.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="body2" color="text.secondary">Nothing here</Typography>
                  </Paper>
                ) : (
                  list.map((order) => (
                    <Ticket key={order._id} order={order} shortcut={shortcutFor(order)} onAdvance={advance} />
                  ))
                )}
              </Grid2>
            );
          })}
        </Grid2>
      )}
    </Box>
  );
};

export default AdminKitchen;
