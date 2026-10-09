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
  Collapse,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import ReplayIcon from '@mui/icons-material/Replay';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ordersAPI, unwrap } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
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

const lineTotal = (item) => Number(item.itemPrice ?? item.price ?? 0) * (item.quantity || 1);

const buildBill = (order) => {
  const lines = (order.items || []).map((i) => ({
    name: i.name || i.menuItemDoc?.title || 'Item',
    size: i.size,
    qty: i.quantity || 1,
    amount: lineTotal(i),
  }));
  const subtotal = Number(order.totalAmount ?? lines.reduce((sum, l) => sum + l.amount, 0));
  const tip = Number(order.tipAmount || 0);
  const discount = Number(order.discountAmount || 0);
  const total = Number(order.finalAmount ?? subtotal + tip);
  const tax = Math.max(0, Number((total - subtotal - tip).toFixed(2)));
  return { lines, subtotal, tip, discount, tax, total };
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
  const [expandedId, setExpandedId] = useState(null);
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

      {error && (
        <ErrorState
          title="Couldn't load your orders"
          message={error}
          onRetry={phone ? () => load(phone) : undefined}
        />
      )}

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
  const shareBill = (order) => {
    const { lines, subtotal, tax, total } = buildBill(order);
    const text = [
      `Order ${order.orderNumber}`,
      ...lines.map((l) => `${l.qty}× ${l.name}${l.size ? ` (${l.size})` : ''} — ₹${l.amount.toFixed(2)}`),
      `Subtotal: ₹${subtotal.toFixed(2)}`,
      `GST: ₹${tax.toFixed(2)}`,
      `Total: ₹${total.toFixed(2)}`,
    ].join('\n');
    if (navigator.share) {
      navigator.share({ title: `Order ${order.orderNumber}`, text }).catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => toast.success('Bill copied'));
    }
  };

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

              {(() => {
                const bill = buildBill(order);
                const key = order._id || order.orderNumber;
                const expanded = expandedId === key;
                return (
                  <>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 1.5 }}>
                        {bill.lines.map((l, i) => (
                          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {l.qty}× {l.name}{l.size ? ` (${l.size})` : ''}
                            </Typography>
                            <Typography variant="body2">₹{l.amount.toFixed(2)}</Typography>
                          </Box>
                        ))}
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                          <Typography variant="body2">₹{bill.subtotal.toFixed(2)}</Typography>
                        </Box>
                        {bill.discount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Discount</Typography>
                            <Typography variant="body2">−₹{bill.discount.toFixed(2)}</Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">GST</Typography>
                          <Typography variant="body2">₹{bill.tax.toFixed(2)}</Typography>
                        </Box>
                        {bill.tip > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Tip</Typography>
                            <Typography variant="body2">₹{bill.tip.toFixed(2)}</Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>₹{bill.total.toFixed(2)}</Typography>
                        </Box>
                      </Box>
                    </Collapse>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                      <Button
                        size="small"
                        onClick={() => setExpandedId(expanded ? null : key)}
                        endIcon={<ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />}
                      >
                        {expanded ? 'Hide bill' : 'View bill'}
                      </Button>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" startIcon={<ShareIcon />} onClick={() => shareBill(order)}>Share</Button>
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
                    </Stack>
                  </>
                );
              })()}
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
};

export default OrderHistoryPage;
