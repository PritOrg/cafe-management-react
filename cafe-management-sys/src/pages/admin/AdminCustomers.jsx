import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Pagination,
  Alert,
  LinearProgress,
} from '@mui/material';
import Refresh from '@mui/icons-material/Refresh';
import Search from '@mui/icons-material/Search';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { customersAPI, activityAPI, unwrap } from '../../services/api';
import { formatMoney } from '../../utils/formatMoney';

const MEMBERSHIP = ['Silver', 'Gold', 'Platinum'];

const AdminCustomers = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [membership, setMembership] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };
      if (search) params.search = search;
      if (membership) params.membership = membership;
      const body = await customersAPI.list(params);
      const data = unwrap(body) || {};
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to load customers');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, membership]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openDetail = async (customer) => {
    setSelected(customer);
    setDetailOpen(true);
    setSummary(null);
    setOrders([]);
    setCustomerHistory([]);
    try {
      const [sumBody, ordBody, histBody] = await Promise.all([
        customersAPI.getSummary(customer._id),
        customersAPI.getOrders(customer._id),
        activityAPI.byEntity('customer', customer._id).catch(() => null),
      ]);
      setSummary(unwrap(sumBody));
      setOrders(unwrap(ordBody) || []);
      setCustomerHistory(histBody ? (unwrap(histBody) || []) : []);
    } catch (err) {
      console.error('Error loading customer detail:', err);
    }
  };

  const handleSoftDelete = async () => {
    if (!deleteTarget) return;
    try {
      await customersAPI.softDelete(deleteTarget._id);
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err) {
      console.error('Error deactivating customer:', err);
      setError(err.message || 'Failed to deactivate customer');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Customers</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchCustomers}>Refresh</Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={fetchCustomers}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search name, email, phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Membership"
                value={membership}
                onChange={(e) => { setMembership(e.target.value); setPage(1); }}
              >
                <MenuItem value="">All</MenuItem>
                {MEMBERSHIP.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Membership</TableCell>
                <TableCell>Loyalty</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><LinearProgress /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No customers found</TableCell></TableRow>
              ) : (
                items.map((c) => (
                  <TableRow key={c._id} hover>
                    <TableCell>
                      <Button size="small" onClick={() => openDetail(c)}>
                        {[c.firstName, c.lastName].filter(Boolean).join(' ') || c.email}
                      </Button>
                    </TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone || '—'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={c.membershipLevel || 'Silver'} />
                    </TableCell>
                    <TableCell>{c.loyaltyPoints || 0}</TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteOutline />}
                        onClick={() => setDeleteTarget(c)}
                      >
                        Deactivate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={Math.max(1, Math.ceil(total / limit))}
            page={page}
            onChange={(_, p) => setPage(p)}
          />
        </Box>
      </Card>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Customer Detail</DialogTitle>
        <DialogContent>
          {selected && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={6}>
                <Typography><strong>Name:</strong> {[selected.firstName, selected.lastName].filter(Boolean).join(' ')}</Typography>
                <Typography><strong>Email:</strong> {selected.email}</Typography>
                <Typography><strong>Phone:</strong> {selected.phone || '—'}</Typography>
                <Typography><strong>Membership:</strong> {selected.membershipLevel || 'Silver'}</Typography>
                <Typography><strong>Loyalty points:</strong> {selected.loyaltyPoints || 0}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                {summary ? (
                  <>
                    <Typography><strong>Orders:</strong> {summary.ordersCount}</Typography>
                    <Typography><strong>LTV:</strong> {formatMoney(summary.lifetimeValue)}</Typography>
                    <Typography><strong>Avg order:</strong> {formatMoney(summary.avgOrder)}</Typography>
                    <Typography><strong>Last order:</strong> {summary.lastOrderAt ? new Date(summary.lastOrderAt).toLocaleString() : '—'}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" gutterBottom><strong>Favorite items</strong></Typography>
                      {(summary.favoriteItems || []).map((f) => (
                        <Chip key={f.menuItemId} size="small" label={`${f.title} (${f.qty})`} sx={{ mr: 1, mb: 0.5 }} />
                      ))}
                    </Box>
                  </>
                ) : <LinearProgress />}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Order history</Typography>
                {orders.length === 0 && <Typography variant="body2" color="text.secondary">No orders</Typography>}
                {orders.map((o) => (
                  <Box key={o._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2">{o.orderNumber}</Typography>
                    <Chip size="small" label={o.status} />
                    <Typography variant="body2">{formatMoney(o.finalAmount)}</Typography>
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>History</Typography>
                {customerHistory.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No activity yet</Typography>
                )}
                {customerHistory.map((h) => (
                  <Box key={h._id} sx={{ mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">{h.action}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{h.actorType}</Typography>
                  </Box>
                ))}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Deactivate customer?</DialogTitle>
        <DialogContent>
          <Typography>
            {[deleteTarget?.firstName, deleteTarget?.lastName].filter(Boolean).join(' ')} will be soft-deactivated.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleSoftDelete}>Deactivate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCustomers;
