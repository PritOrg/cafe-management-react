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
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Fab,
  LinearProgress,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Add,
  Delete,
  Warning,
  CheckCircle,
  Refresh,
  Inventory2,
} from '@mui/icons-material';
import { inventoryAPI, unwrap } from '../../services/api';
import { formatMoney } from '../../utils/formatMoney';

const MOVEMENT_TYPES = [
  { value: 'purchase', label: 'Receive (purchase)' },
  { value: 'waste', label: 'Waste' },
  { value: 'adjust', label: 'Adjust' },
];

const AdminInventory = () => {
  const [items, setItems] = useState([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ itemName: '', quantity: 0, unit: 'kg', category: '', minQty: 0 });
  const [moveTarget, setMoveTarget] = useState(null);
  const [moveForm, setMoveForm] = useState({ type: 'purchase', delta: 10, note: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (lowOnly) params.lowStock = 'true';
      const body = await inventoryAPI.list(params);
      const data = unwrap(body) || {};
      setItems(data.items || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to load inventory');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, lowOnly]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const lowCount = items.filter((i) => Number(i.quantity) <= Number(i.minQty || 0)).length;

  const openCreate = () => {
    setEditing(null);
    setForm({ itemName: '', quantity: 0, unit: 'kg', category: '', minQty: 0 });
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      minQty: item.minQty || 0,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) await inventoryAPI.update(editing._id, form);
      else await inventoryAPI.create(form);
      setFormOpen(false);
      fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to save item');
    }
  };

  const handleMovement = async () => {
    if (!moveTarget) return;
    try {
      await inventoryAPI.addMovement(moveTarget._id, moveForm);
      setMoveTarget(null);
      fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to record movement');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryAPI.remove(deleteTarget._id);
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to deactivate item');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory2 /> Inventory
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchItems}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add item</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={fetchItems}>Retry</Button>
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
                placeholder="Search name, category, unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant={lowOnly ? 'contained' : 'outlined'}
                color={lowOnly ? 'warning' : 'primary'}
                startIcon={<Warning />}
                onClick={() => setLowOnly((v) => !v)}
              >
                Low stock {lowCount > 0 ? `(${lowCount})` : ''}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Min</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center"><LinearProgress /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No inventory items</TableCell></TableRow>
              ) : (
                items.map((item) => {
                  const isLow = Number(item.quantity) <= Number(item.minQty || 0);
                  return (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Button size="small" onClick={() => openEdit(item)}>{item.itemName}</Button>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.minQty || 0}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={isLow ? <Warning /> : <CheckCircle />}
                          label={isLow ? 'Low stock' : 'OK'}
                          color={isLow ? 'warning' : 'success'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" onClick={() => { setMoveTarget(item); setMoveForm({ type: 'purchase', delta: 10, note: '' }); }}>
                          Move
                        </Button>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24 }} onClick={openCreate}>
        <Add />
      </Fab>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit item' : 'Add inventory item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Item name" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Min qty" type="number" value={form.minQty} onChange={(e) => setForm({ ...form, minQty: Number(e.target.value) })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.itemName || !form.unit || !form.category}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!moveTarget} onClose={() => setMoveTarget(null)}>
        <DialogTitle>Movement — {moveTarget?.itemName}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Type"
                value={moveForm.type}
                onChange={(e) => setMoveForm({ ...moveForm, type: e.target.value })}
              >
                {MOVEMENT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={moveForm.type === 'waste' ? 'Delta (negative)' : 'Delta'}
                type="number"
                value={moveForm.delta}
                onChange={(e) => setMoveForm({ ...moveForm, delta: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Note" value={moveForm.note} onChange={(e) => setMoveForm({ ...moveForm, note: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleMovement}>Record</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Deactivate item?</DialogTitle>
        <DialogContent>
          <Typography>{deleteTarget?.itemName} will be soft-deactivated.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Deactivate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminInventory;
