import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import SearchIcon from '@mui/icons-material/Search';
import { ordersAPI, unwrap } from '../../services/api';

const STATUS_META = {
  pending: { label: 'Pending', color: 'warning' },
  preparing: { label: 'Preparing', color: 'info' },
  ready: { label: 'Ready', color: 'success' },
  served: { label: 'Served', color: 'default' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const OrderHistoryPage = () => {
  const [phone, setPhone] = useState(() => localStorage.getItem('customerPhone') || '');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const load = useCallback(async (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      setError('Enter the phone number you used at checkout.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await ordersAPI.getHistory(trimmed);
      const data = unwrap(body) || {};
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setSearched(true);
      localStorage.setItem('customerPhone', trimmed);
    } catch (err) {
      setError(err.message || 'Could not load your orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (phone) load(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    load(phone);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <ReceiptLongIcon color="primary" />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          My Orders
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the phone number you used at checkout to see your order history.
      </Typography>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="Phone number"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            disabled={loading}
            sx={{ minWidth: 140, minHeight: 56 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Find orders'}
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && searched && orders.length === 0 && !error && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <LocalCafeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            No orders found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We couldn&apos;t find any orders for that number.
          </Typography>
        </Paper>
      )}

      <Stack spacing={2}>
        {orders.map((order) => {
          const meta = STATUS_META[order.status] || { label: order.status, color: 'default' };
          const itemCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
          return (
            <Paper
              key={order._id || order.orderNumber}
              elevation={0}
              sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {order.orderNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(order.placedAt || order.createdAt)}
                  </Typography>
                </Box>
                <Chip size="small" label={meta.label} color={meta.color} />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {itemCount} item{itemCount === 1 ? '' : 's'}
                  {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {formatMoney(order.finalAmount ?? order.totalAmount)}
                </Typography>
              </Stack>

              {(order.items || []).length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  {order.items.slice(0, 4).map((item, index) => (
                    <Typography key={index} variant="body2" color="text.secondary" noWrap>
                      {item.quantity || 1}× {item.name || item.menuItemDoc?.title || 'Item'}
                      {item.size ? ` (${item.size})` : ''}
                    </Typography>
                  ))}
                  {order.items.length > 4 && (
                    <Typography variant="caption" color="text.secondary">
                      +{order.items.length - 4} more
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
};

export default OrderHistoryPage;
