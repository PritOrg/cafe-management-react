import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Paper,
} from '@mui/material';
import Refresh from '@mui/icons-material/Refresh';
import AccessTime from '@mui/icons-material/AccessTime';
import LocalDining from '@mui/icons-material/LocalDining';
import Whatshot from '@mui/icons-material/Whatshot';
import { kitchenAPI, ordersAPI, unwrap } from '../../services/api';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const statusColor = (s) => (s === 'pending' ? 'warning' : s === 'preparing' ? 'info' : 'success');

const AdminKitchen = () => {
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

  useEffect(() => {
    fetchOrders();
    const t = setInterval(fetchOrders, 15000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  const advance = async (order, next) => {
    try {
      await ordersAPI.updateStatus(order._id, next);
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalDining /> Kitchen Display
        </Typography>
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
        {orders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order._id}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                borderLeft: 6,
                borderColor: order.minutesOpen > 15 ? 'error.main' : order.minutesOpen > 8 ? 'warning.main' : 'success.main',
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  {order.orderNumber}
                </Typography>
                <Chip size="small" color={statusColor(order.status)} label={order.status} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTime fontSize="small" color={order.minutesOpen > 15 ? 'error' : 'action'} />
                <Typography variant="body2">{order.minutesOpen} min open</Typography>
                {order.tableNumber && <Chip size="small" label={`Table ${order.tableNumber}`} />}
              </Box>
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
