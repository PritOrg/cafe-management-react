import React, { useCallback, useContext, useEffect, useState } from 'react';
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
import SearchIcon from '@mui/icons-material/Search';
import ReplayIcon from '@mui/icons-material/Replay';
import { ordersAPI, unwrap } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../components/ui';
import CartContext from '../../components/CartContext';
import { useCustomer } from '../../contexts/CustomerContext';
import { useNavigate } from 'react-router-dom';
import { findMenuItem, prefetchMenu } from '../../hooks/useMenuData';

const STATUS_META = {
  pending: { label: 'Pending', color: 'warning' },
  preparing: { label: 'Preparing', color: 'info' },
  ready: { label: 'Ready', color: 'success' },
  served: { label: 'Served', color: 'default' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

const ORDER_STEPS = ['pending', 'preparing', 'ready', 'served'];

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const normalizeOptions = (customizations) => {
  if (Array.isArray(customizations)) {
    return Object.fromEntries(
      customizations.map((c) => (typeof c === 'string' ? [c, 0] : [c.name, Number(c.priceDelta) || 0]))
    );
  }
  return customizations || {};
};

const StatusTrack = ({ status }) => {
  const activeIndex = ORDER_STEPS.indexOf(status);
  if (status === 'cancelled') {
    return <Chip size="small" color="error" label="Cancelled" />;
  }
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {ORDER_STEPS.map((step, index) => (
        <React.Fragment key={step}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: index <= activeIndex ? 'primary.main' : 'action.disabledBackground',
            }}
          />
          {index < ORDER_STEPS.length - 1 && (
            <Box sx={{ width: 18, height: 2, bgcolor: index < activeIndex ? 'primary.main' : 'action.disabledBackground' }} />
          )}
        </React.Fragment>
      ))}
    </Stack>
  );
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { addToCart } = useContext(CartContext) || {};
  const { phone: savedPhone, setCustomer } = useCustomer();

  const [phone, setPhone] = useState(savedPhone || '');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reorderingId, setReorderingId] = useState(null);
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
      setCustomer({ phone: trimmed, name: data.customer?.name || '' });
    } catch (err) {
      setError(err.message || 'Could not load your orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [setCustomer]);

  useEffect(() => {
    if (phone) load(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    load(phone);
  };

  const handleReorder = async (order) => {
    setReorderingId(order._id || order.orderNumber);
    try {
      await prefetchMenu();
      let added = 0;
      for (const item of order.items || []) {
        const menuItem = findMenuItem(item.menuItem) || findMenuItem(item.menuItemDoc?._id);
        if (!menuItem) continue;
        // eslint-disable-next-line no-await-in-loop
        await addToCart(menuItem, normalizeOptions(item.customizations), item.size || 'medium');
        added += 1;
      }
      if (added > 0) {
        toast.success(`Added ${added} item${added === 1 ? '' : 's'} to your cart`);
        navigate('/cart');
      } else {
        toast.warning('Those items are no longer on the menu');
      }
    } catch (err) {
      toast.error('Could not reorder. Please try again.');
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <PageHeader
        title="My Orders"
        icon={<ReceiptLongIcon fontSize="small" />}
        subtitle="Enter the phone number you used at checkout to see your order history"
      />

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
            InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>) }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            disabled={loading}
            sx={{ minWidth: 150, minHeight: 56 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Find orders'}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && searched && orders.length === 0 && !error && (
        <EmptyState
          icon={<ReceiptLongIcon />}
          title="No orders found"
          description="We couldn't find any orders for that number. Double-check it and try again."
        />
      )}

      <Stack spacing={2}>
        {orders.map((order) => {
          const meta = STATUS_META[order.status] || { label: order.status, color: 'default' };
          const itemCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
          const busy = reorderingId === (order._id || order.orderNumber);
          return (
            <Paper key={order._id || order.orderNumber} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{order.orderNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDate(order.placedAt || order.createdAt)}</Typography>
                </Box>
                <Chip size="small" label={meta.label} color={meta.color} />
              </Stack>

              <Box sx={{ my: 1.5 }}>
                <StatusTrack status={order.status} />
              </Box>

              <Divider sx={{ mb: 1.5 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
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
                    <Typography variant="caption" color="text.secondary">+{order.items.length - 4} more</Typography>
                  )}
                </Box>
              )}

              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={busy ? <CircularProgress size={16} /> : <ReplayIcon />}
                  onClick={() => handleReorder(order)}
                  disabled={busy}
                >
                  Reorder
                </Button>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
};

export default OrderHistoryPage;
