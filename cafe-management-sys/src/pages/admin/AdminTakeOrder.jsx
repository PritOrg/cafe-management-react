import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  InputBase,
  IconButton,
  Chip,
  Button,
  Divider,
  Stack,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import PageHeader from '../../components/common/PageHeader';
import MenuItemCard from '../../components/menu/MenuItemCard';
import CartContext from '../../components/CartContext';
import { useToast } from '../../components/ui';
import useMenuData from '../../hooks/useMenuData';
import useOpsEvents from '../../hooks/useOpsEvents';
import { tablesAPI, unwrap } from '../../services/api';

const formatMoney = (v) => `₹${Number(v || 0).toFixed(2)}`;

const unitPrice = (item) => {
  const sizes = item.sizes || [];
  if (sizes.length) {
    const match = sizes.find((s) => s.label === item.selectedSize) || sizes.find((s) => s.isDefault) || sizes[0];
    return Number(match?.price || 0);
  }
  return Number(item.price?.[String(item.selectedSize || 'medium').toLowerCase()] ?? item.price?.medium ?? 0);
};

const lineTotal = (item) => {
  const delta = Object.values(item.selectedOptions || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
  return (unitPrice(item) + delta) * (item.quantity || 1);
};

const AdminTakeOrder = () => {
  const toast = useToast();
  const { items, loading } = useMenuData();
  const {
    cartItems = [],
    updateCartItem,
    removeCartItem,
    total = 0,
    cartCount = 0,
    createOrder,
    isLoading,
  } = useContext(CartContext) || {};

  const [tables, setTables] = useState([]);
  const [target, setTarget] = useState('takeaway'); // 'takeaway' | table number (string)
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const loadTables = useCallback(async () => {
    try {
      const body = await tablesAPI.list();
      setTables(unwrap(body) || []);
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);
  useOpsEvents({ 'order:created': loadTables, 'order:status': loadTables });

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(),
    [items]
  );
  const filtered = useMemo(
    () => items.filter((i) =>
      (i.title || '').toLowerCase().includes(query.toLowerCase())
      && (!category || i.category === category)),
    [items, query, category]
  );

  const isTable = target !== 'takeaway';
  const canPlace = cartItems.length > 0 && !isLoading;

  const handlePlace = async () => {
    try {
      const data = await createOrder(paymentMethod, {
        tableNumber: isTable ? target : undefined,
      });
      const orderNumber = data?.orderNumber || data?.order?.orderNumber;
      toast.success(`Sent to kitchen${orderNumber ? ` — ${orderNumber}` : ''}`);
      setTarget('takeaway');
      loadTables();
    } catch (err) {
      toast.error(err.message || 'Could not place the order');
    }
  };

  const changeQty = (cartItemId, quantity) => {
    if (quantity < 1) return;
    updateCartItem(cartItemId, { quantity });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageHeader
        title="Take order"
        icon={<TableRestaurantIcon fontSize="small" />}
        subtitle="Pick a table (or takeaway) and add items — send straight to the kitchen"
      />

      {/* Table / takeaway picker */}
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 2, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        <Chip
          icon={<TakeoutDiningIcon />}
          label="Takeaway"
          color={target === 'takeaway' ? 'primary' : 'default'}
          variant={target === 'takeaway' ? 'filled' : 'outlined'}
          onClick={() => setTarget('takeaway')}
        />
        {tables.map((table) => {
          const value = String(table.number);
          const selected = target === value;
          return (
            <Chip
              key={table._id || value}
              icon={<TableRestaurantIcon />}
              label={`Table ${table.number}`}
              color={selected ? 'primary' : table.status === 'occupied' ? 'warning' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => setTarget(value)}
            />
          );
        })}
      </Box>

      <Grid2 container spacing={2}>
        {/* Menu */}
        <Grid2 xs={12} md={8}>
          <Paper component="form" onSubmit={(e) => e.preventDefault()} elevation={0}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, borderRadius: 999, bgcolor: 'action.hover', mb: 1.5 }}>
            <SearchIcon color="action" />
            <InputBase
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu"
              inputProps={{ 'aria-label': 'Search menu' }}
              sx={{ flex: 1, py: 1 }}
            />
          </Paper>

          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 1.5, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
            <Chip label="All" onClick={() => setCategory('')} color={category ? 'default' : 'primary'} variant={category ? 'outlined' : 'filled'} />
            {categories.map((c) => (
              <Chip key={c} label={c} onClick={() => setCategory(category === c ? '' : c)} color={category === c ? 'primary' : 'default'} variant={category === c ? 'filled' : 'outlined'} />
            ))}
          </Box>

          {loading ? (
            <LoadingState label="Loading menu…" rows={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No menu items"
              description="Nothing matches this filter yet."
            />
          ) : (
            <Grid2 container spacing={2}>
              {filtered.map((item) => (
                <Grid2 xs={12} sm={6} lg={4} key={item._id || item.id}>
                  <MenuItemCard menuItem={item} />
                </Grid2>
              ))}
            </Grid2>
          )}
        </Grid2>

        {/* Cart / send to kitchen */}
        <Grid2 xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: { md: 'sticky' }, top: { md: 88 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Order</Typography>
              <Chip
                size="small"
                icon={isTable ? <TableRestaurantIcon /> : <TakeoutDiningIcon />}
                label={isTable ? `Table ${target}` : 'Takeaway'}
                color={isTable ? 'primary' : 'default'}
              />
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {cartItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No items yet — tap Add on a menu item.</Typography>
            ) : (
              <Stack spacing={1.5} sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
                {cartItems.map((it) => (
                  <Box key={it.cartItemId}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
                        {it.title}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatMoney(lineTotal(it))}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                      <IconButton size="small" aria-label="Decrease" onClick={() => changeQty(it.cartItemId, (it.quantity || 1) - 1)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>{it.quantity}</Typography>
                      <IconButton size="small" aria-label="Increase" onClick={() => changeQty(it.cartItemId, (it.quantity || 1) + 1)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <Box sx={{ flexGrow: 1 }} />
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" aria-label="Remove item" onClick={() => removeCartItem(it.cartItemId)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography color="text.secondary">{cartCount} item{cartCount === 1 ? '' : 's'}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatMoney(total)}</Typography>
            </Stack>

            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
              <InputLabel>Payment</InputLabel>
              <Select label="Payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="upi_manual">UPI (manual)</MenuItem>
                <MenuItem value="card_manual">Card (manual)</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              onClick={handlePlace}
              disabled={!canPlace}
            >
              Send to kitchen
            </Button>
          </Paper>
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default AdminTakeOrder;
