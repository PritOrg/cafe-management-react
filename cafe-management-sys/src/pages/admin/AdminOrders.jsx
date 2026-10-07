import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Button, TextField, InputAdornment, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tabs, Tab, Badge } from '@mui/material';
import { Search, FilterList, MoreVert, Visibility, CheckCircle, Cancel, Schedule, LocalShipping } from '@mui/icons-material';
import { ordersAPI, activityAPI, unwrap } from '../../services/api';
import { adaptOrder } from '../../adapters';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

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
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await ordersAPI.getAll(params);
      const ordersData = unwrap(response) || [];
      setOrders((Array.isArray(ordersData) ? ordersData : []).map(adaptOrder));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
    return matchesSearch && matchesStatus;
  });

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
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                >
                  More Filters
                </Button>
                <Button
                  variant="contained"
                  onClick={fetchOrders}
                >
                  Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order._id} hover>
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
                      <Typography variant="body2">
                        {order.items.length} item(s)
                      </Typography>
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
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
      </Menu>

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
