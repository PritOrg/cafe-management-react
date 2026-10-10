import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Fab,
  MenuItem,
} from '@mui/material';
import ResponsiveTable from '../../components/common/ResponsiveTable';
import Search from '@mui/icons-material/Search';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import Warning from '@mui/icons-material/Warning';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Refresh from '@mui/icons-material/Refresh';
import Inventory2 from '@mui/icons-material/Inventory2';
import MenuBook from '@mui/icons-material/MenuBook';
import { inventoryAPI, menuAPI, unwrap } from '../../services/api';
import { formatMoneyMinor } from '../../utils/formatMoney';
import useOpsEvents from '../../hooks/useOpsEvents';

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
  const [form, setForm] = useState({ itemName: '', quantity: 0, unit: 'kg', category: '', minQty: 0, costPerUnitMinor: '', reorderQty: '', supplier: '' });
  const [moveTarget, setMoveTarget] = useState(null);
  const [moveForm, setMoveForm] = useState({ type: 'purchase', delta: 10, note: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [recipeTarget, setRecipeTarget] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [recipeForm, setRecipeForm] = useState({ menuItemId: '', qty: 0.25, unit: 'kg' });
  const [recipeError, setRecipeError] = useState('');

  const loadRecipes = useCallback(async (inventoryId) => {
    try {
      const body = await inventoryAPI.listRecipesForItem(inventoryId);
      setRecipes(unwrap(body) || []);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setRecipes([]);
    }
  }, []);

  const openRecipes = async (item) => {
    setRecipeTarget(item);
    setRecipeError('');
    setRecipeForm({ menuItemId: '', qty: 0.25, unit: 'kg' });
    await loadRecipes(item._id);
    try {
      const body = await menuAPI.getAll();
      const data = unwrap(body);
      setMenuItems(Array.isArray(data) ? data : []);
    } catch {
      setMenuItems([]);
    }
  };

  const handleAddRecipe = async () => {
    if (!recipeTarget) return;
    const { menuItemId, qty, unit } = recipeForm;
    if (!menuItemId || !unit || !(Number(qty) > 0)) {
      setRecipeError('Select a menu item, qty > 0, and unit');
      return;
    }
    try {
      setRecipeError('');
      await inventoryAPI.addRecipe({
        menuItemId,
        inventoryItemId: recipeTarget._id,
        qty: Number(qty),
        unit,
      });
      await loadRecipes(recipeTarget._id);
    } catch (err) {
      setRecipeError(err.message || 'Failed to add recipe line');
    }
  };

  const handleRemoveRecipe = async (recipeId) => {
    try {
      await inventoryAPI.removeRecipe(recipeId);
      if (recipeTarget) await loadRecipes(recipeTarget._id);
    } catch (err) {
      setRecipeError(err.message || 'Failed to remove recipe line');
    }
  };

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

  // Realtime: refresh when stock becomes low elsewhere (e.g. order deduction).
  useOpsEvents({ 'stock:low': fetchItems });

  const lowCount = items.filter((i) => Number(i.quantity) <= Number(i.minQty || 0)).length;

  const openCreate = () => {
    setEditing(null);
    setForm({ itemName: '', quantity: 0, unit: 'kg', category: '', minQty: 0, costPerUnitMinor: '', reorderQty: '', supplier: '' });
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
      costPerUnitMinor: item.costPerUnitMinor != null ? String(item.costPerUnitMinor / 100) : '',
      reorderQty: item.reorderQty != null ? String(item.reorderQty) : '',
      supplier: item.supplier || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        // UI enters rupees; the API stores minor units (paise).
        costPerUnitMinor: form.costPerUnitMinor !== '' && form.costPerUnitMinor != null
          ? Math.round(Number(form.costPerUnitMinor) * 100)
          : null,
        reorderQty: form.reorderQty !== '' && form.reorderQty != null ? Number(form.reorderQty) : null,
      };
      if (editing) await inventoryAPI.update(editing._id, payload);
      else await inventoryAPI.create(payload);
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
        <ResponsiveTable
          rows={items}
          loading={loading}
          emptyMessage="No inventory items"
          columns={[
            { label: 'Item' },
            { label: 'Category' },
            { label: 'Qty' },
            { label: 'Min' },
            { label: 'Supplier' },
            { label: 'Status' },
            { label: 'Valuation', align: 'right' },
            { label: '', align: 'center' },
          ]}
          renderRow={(item) => {
            const isLow = Number(item.quantity) <= Number(item.minQty || 0);
            return (
              <TableRow key={item._id} hover>
                <TableCell>
                  <Button size="medium" onClick={() => openEdit(item)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                    {item.itemName}
                  </Button>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.minQty || 0}</TableCell>
                <TableCell>{item.supplier || '—'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    icon={isLow ? <Warning /> : <CheckCircle />}
                    label={isLow ? 'Low stock' : 'OK'}
                    color={isLow ? 'warning' : 'success'}
                  />
                </TableCell>
                <TableCell align="right">{item.valuation != null ? formatMoneyMinor(item.valuation) : '—'}</TableCell>
                <TableCell align="center">
                  <Button size="medium" onClick={() => { setMoveTarget(item); setMoveForm({ type: 'purchase', delta: 10, note: '' }); }}>
                    Move
                  </Button>
                  <Button size="medium" startIcon={<MenuBook />} onClick={() => openRecipes(item)}>
                    Recipes
                  </Button>
                  <IconButton size="medium" color="error" aria-label="Delete item" onClick={() => setDeleteTarget(item)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          }}
          renderCard={(item) => {
            const isLow = Number(item.quantity) <= Number(item.minQty || 0);
            return (
              <Card key={item._id} sx={{ mx: 2, mb: 1.5 }}>
                <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{item.itemName}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.category || '—'}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      icon={isLow ? <Warning /> : <CheckCircle />}
                      label={isLow ? 'Low stock' : 'OK'}
                      color={isLow ? 'warning' : 'success'}
                    />
                  </Box>
                  <Typography variant="body2">
                    <strong>{item.quantity} {item.unit}</strong> · min {item.minQty || 0}
                    {item.valuation != null ? ` · value ${formatMoneyMinor(item.valuation)}` : ''}
                    {item.supplier ? ` · ${item.supplier}` : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Button size="medium" onClick={() => { setMoveTarget(item); setMoveForm({ type: 'purchase', delta: 10, note: '' }); }}>
                      Move
                    </Button>
                    <Button size="medium" startIcon={<MenuBook />} onClick={() => openRecipes(item)}>
                      Recipes
                    </Button>
                    <IconButton size="medium" color="error" aria-label="Delete item" onClick={() => setDeleteTarget(item)}>
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          }}
        />
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
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Cost / unit (₹)" type="number" value={form.costPerUnitMinor} onChange={(e) => setForm({ ...form, costPerUnitMinor: e.target.value })} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Reorder qty" type="number" value={form.reorderQty} onChange={(e) => setForm({ ...form, reorderQty: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
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

      <Dialog open={!!recipeTarget} onClose={() => setRecipeTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle>Recipe (BOM) — {recipeTarget?.itemName}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Qty of this inventory item consumed per menu item sold. Orders auto-deduct stock.
          </Typography>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Menu item</TableCell>
                <TableCell>Qty / unit</TableCell>
                <TableCell align="right">Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recipes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">No recipe lines yet</TableCell>
                </TableRow>
              )}
              {recipes.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>{r.menuItemTitle || r.menuItemId}</TableCell>
                  <TableCell>{r.qty} {r.unit}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleRemoveRecipe(r._id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField
                select
                fullWidth
                size="small"
                label="Menu item"
                value={recipeForm.menuItemId}
                onChange={(e) => setRecipeForm({ ...recipeForm, menuItemId: e.target.value })}
              >
                <MenuItem value="">Select…</MenuItem>
                {menuItems.map((m) => (
                  <MenuItem key={m._id} value={m._id}>{m.title}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Qty"
                value={recipeForm.qty}
                onChange={(e) => setRecipeForm({ ...recipeForm, qty: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                size="small"
                label="Unit"
                value={recipeForm.unit}
                onChange={(e) => setRecipeForm({ ...recipeForm, unit: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button fullWidth variant="contained" onClick={handleAddRecipe}>Add</Button>
            </Grid>
          </Grid>
          {recipeError && (
            <Alert severity="error" sx={{ mt: 1 }}>{recipeError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecipeTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminInventory;
