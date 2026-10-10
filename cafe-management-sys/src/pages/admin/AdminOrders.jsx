import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Chip, Checkbox, Select, IconButton, Button, TextField, InputAdornment, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tabs, Tab, Badge, TableRow, TableCell } from '@mui/material';
import Search from '@mui/icons-material/Search';
import FilterList from '@mui/icons-material/FilterList';
import MoreVert from '@mui/icons-material/MoreVert';
import Visibility from '@mui/icons-material/Visibility';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import Schedule from '@mui/icons-material/Schedule';
import LocalShipping from '@mui/icons-material/LocalShipping';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { ordersAPI, activityAPI, staffAPI, unwrap } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ErrorState from '../../components/common/ErrorState';
import ResponsiveTable from '../../components/common/ResponsiveTable';
import useOpsEvents from '../../hooks/useOpsEvents';
import { adaptOrder } from '../../adapters';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { user } = useAuth();
  const [mineOnly, setMineOnly] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);

  const orderStatuses = [
    { value: 'all', label: 'All Orders', count: 0 },
    { value: 'pending', label: 'Pending', count: 0 },
    { value: 'preparing', label: 'Preparing', count: 0 },
    { value: 'ready', label: 'Ready', count: 0 },
    { value: 'served', label: 'Served', count: 0 },
    { value: 'cancelled', label: 'Cancelled', count: 0 },
  ];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await ordersAPI.getAll(params);
      const ordersData = unwrap(response) || [];
      setOrders((Array.isArray(ordersData) ? ordersData : []).map(adaptOrder));
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime: refetch when this tenant's orders change elsewhere (server wins).
  useOpsEvents({ 'order:created': fetchOrders, 'order:status': fetchOrders });

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      setAnchorEl(null);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      preparing: 'info',
      ready: 'success',
      served: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Schedule />,
      preparing: <Schedule />,
      ready: <CheckCircle />,
      served: <CheckCircle />,
      cancelled: <Cancel />,
    };
    return icons[status] || <Schedule />;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const staffId = order.placedByStaff?._id || order.placedByStaff || null;
    const matchesMine = !mineOnly || (staffId && String(staffId) === String(user?.id));
    return matchesSearch && matchesStatus && matchesMine;
  });

  // ---- Bulk status change (N1) ----
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');

  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Clear the selection whenever the visible set changes.
  useEffect(() => {
    setSelectedIds([]);
  }, [searchQuery, statusFilter, mineOnly]);

  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => ordersAPI.updateStatus(id, bulkStatus)));
      setOrders(orders.map((o) => (selectedIds.includes(o._id) ? { ...o, status: bulkStatus } : o)));
      setSelectedIds([]);
      setBulkStatus('');
    } catch (error) {
      console.error('Error applying bulk status change:', error);
    }
  };

  const openTransfer = async () => {
    setAnchorEl(null);
    setTransferOpen(true);
    try {
      const body = await staffAPI.getAll();
      const data = unwrap(body) || [];
      setStaffList(Array.isArray(data) ? data : (data.items || data.staff || []));
    } catch {
      setStaffList([]);
    }
  };

  const handleAssign = async (staffId) => {
    try {
      await ordersAPI.assign(selectedOrderId, staffId);
      setTransferOpen(false);
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to transfer order');
    }
  };

  const getStatusCounts = () => {
    const counts = { all: orders.length };
    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const handleMenuClick = (event, orderId) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderId(orderId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrderId(null);
  };

  // lg+ keyboard shortcuts: digits 1-5 switch the status filter tab.
  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(min-width: 1200px)')
      : null;
    const onKey = (e) => {
      if (mq && !mq.matches) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const map = { 1: 'all', 2: 'pending', 3: 'preparing', 4: 'ready', 5: 'served' };
      if (map[e.key]) setStatusFilter(map[e.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
    setOrderHistory([]);
    if (order?._id) {
      setHistoryLoading(true);
      try {
        const body = await activityAPI.byEntity('order', order._id);
        setOrderHistory(unwrap(body) || []);
      } catch (err) {
        console.error('Error loading order history:', err);
        setOrderHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }
    handleMenuClose();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Order Management
      </Typography>

      {error && (
        <ErrorState title="Couldn't load orders" message={error} onRetry={fetchOrders} />
      )}

      {/* Status Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(e, newValue) => setStatusFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {orderStatuses.map((status) => (
            <Tab
              key={status.value}
              value={status.value}
              label={
                <Badge badgeContent={statusCounts[status.value] || 0} color="primary">
                  {status.label}
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Card>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                <Chip
                  label="Mine"
                  color={mineOnly ? 'primary' : 'default'}
                  variant={mineOnly ? 'filled' : 'outlined'}
                  onClick={() => setMineOnly((v) => !v)}
                />
                <Button variant="outlined" startIcon={<FilterList />}>
                  More Filters
                </Button>
                <Button variant="contained" onClick={fetchOrders}>
                  Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders — table on md+, cards on touch */}
      <Card>
        {selectedIds.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="body2"><strong>{selectedIds.length}</strong> selected</Typography>
            <Select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              displayEmpty
              size="small"
              inputProps={{ 'aria-label': 'Bulk status' }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="" disabled>Set status…</MenuItem>
              <MenuItem value="preparing">Preparing</MenuItem>
              <MenuItem value="ready">Ready</MenuItem>
              <MenuItem value="served">Served</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
            <Button variant="contained" disabled={!bulkStatus} onClick={applyBulkStatus} sx={{ minHeight: 44 }}>Apply</Button>
            <Button onClick={() => setSelectedIds([])} sx={{ minHeight: 44 }}>Clear</Button>
          </Box>
        )}
        <ResponsiveTable
          rows={filteredOrders}
          loading={loading}
          emptyMessage="No orders found"
          columns={[
            { label: '', align: 'center' },
            { label: 'Order #' },
            { label: 'Customer' },
            { label: 'Items' },
            { label: 'Total' },
            { label: 'Status' },
            { label: 'Date' },
            { label: '', align: 'center' },
          ]}
          renderRow={(order) => (
            <TableRow key={order._id} hover sx={{ '& td': { py: 1.5 } }}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedIds.includes(order._id)}
                  onChange={() => toggleSelect(order._id)}
                  inputProps={{ 'aria-label': `Select ${order.orderNumber}` }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  {order.orderNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {order.customer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.customer.email}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{order.items.length} item(s)</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight={600}>
                  {order.total != null ? `₹${order.total.toFixed(2)}` : '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  icon={getStatusIcon(order.status)}
                  label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  color={getStatusColor(order.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(order.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <IconButton
                  onClick={(e) => handleMenuClick(e, order._id)}
                  size="medium"
                  aria-label="Order actions"
                >
                  <MoreVert />
                </IconButton>
              </TableCell>
            </TableRow>
          )}
          renderCard={(order) => (
            <Card
              key={order._id}
              sx={{ mx: 2, mb: 1.5, overflow: 'hidden', borderLeft: 5, borderColor: `${getStatusColor(order.status)}.main` }}
            >
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Checkbox
                    checked={selectedIds.includes(order._id)}
                    onChange={() => toggleSelect(order._id)}
                    inputProps={{ 'aria-label': `Select ${order.orderNumber}` }}
                    sx={{ ml: -1 }}
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {order.orderNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2">
                  <strong>{order.customer.name}</strong> · {order.items.length} item(s)
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {order.total != null ? `₹${order.total.toFixed(2)}` : '—'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                  <Button size="medium" startIcon={<Visibility />} onClick={() => handleViewOrder(order)}>
                    View
                  </Button>
                  <IconButton size="medium" onClick={(e) => handleMenuClick(e, order._id)} aria-label="Order actions">
                    <MoreVert />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          )}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const order = orders.find(o => o._id === selectedOrderId);
          handleViewOrder(order);
        }}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedOrderId, 'preparing')}>
          <Schedule sx={{ mr: 1 }} />
          Mark as Preparing
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedOrderId, 'ready')}>
          <CheckCircle sx={{ mr: 1 }} />
          Mark as Ready
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedOrderId, 'served')}>
          <LocalShipping sx={{ mr: 1 }} />
          Mark as Served
        </MenuItem>
        <MenuItem onClick={openTransfer}>
          <SwapHoriz sx={{ mr: 1 }} />
          Transfer to staff
        </MenuItem>
      </Menu>

      {/* Transfer order dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Transfer order to…</DialogTitle>
        <DialogContent dividers>
          <MenuItem onClick={() => handleAssign(null)}>Unassigned</MenuItem>
          {staffList.map((s) => (
            <MenuItem key={s._id} onClick={() => handleAssign(s._id)}>
              {[s.firstName, s.lastName].filter(Boolean).join(' ') || s.email}
              {s.role === 'admin' ? ' · admin' : ''}
            </MenuItem>
          ))}
          {staffList.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
              No staff found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog
        open={orderDetailOpen}
        onClose={() => setOrderDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Order Details - {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Customer Information</Typography>
                <Typography><strong>Name:</strong> {selectedOrder.customer?.name}</Typography>
                <Typography><strong>Email:</strong> {selectedOrder.customer?.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Order Information</Typography>
                <Typography><strong>Status:</strong> {selectedOrder.status}</Typography>
                <Typography><strong>Total:</strong> ₹{selectedOrder.total?.toFixed(2)}</Typography>
                <Typography><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Items</Typography>
                {selectedOrder.items.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{item.name} x {item.quantity}</Typography>
                    <Typography>₹{(item.price * item.quantity).toFixed(2)}</Typography>
                  </Box>
                ))}
              </Grid>
              {selectedOrder.notes && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Typography>{selectedOrder.notes}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>History</Typography>
                {historyLoading && <Typography variant="body2">Loading history…</Typography>}
                {!historyLoading && orderHistory.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No activity yet</Typography>
                )}
                {!historyLoading && orderHistory.map((h) => (
                  <Box key={h._id} sx={{ mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">{h.action}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {h.actorType}{h.requestId ? ` · ${String(h.requestId).slice(0, 8)}` : ''}
                    </Typography>
                    {h.meta && Object.keys(h.meta).length > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {JSON.stringify(h.meta)}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminOrders;
