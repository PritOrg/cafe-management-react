import React, { useState, useEffect } from 'react';
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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Fab,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  MoreVert,
  Warning,
  CheckCircle,
  Inventory,
  TrendingDown,
  Refresh,
} from '@mui/icons-material';
import { analyticsAPI } from '../../services/api';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: '',
    category: '',
    supplier: '',
    cost: 0,
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const alertsData = await analyticsAPI.getInventoryAlerts();
      setAlerts(alertsData);
      
      // Mock inventory data since we don't have a specific inventory API
      setInventory([
        {
          _id: '1',
          name: 'Coffee Beans (Arabica)',
          currentStock: 5,
          minStock: 10,
          maxStock: 50,
          unit: 'lbs',
          category: 'Coffee',
          supplier: 'Premium Coffee Co.',
          cost: 12.50,
          lastUpdated: new Date().toISOString(),
        },
        {
          _id: '2',
          name: 'Milk (Whole)',
          currentStock: 2,
          minStock: 5,
          maxStock: 20,
          unit: 'gallons',
          category: 'Dairy',
          supplier: 'Local Dairy Farm',
          cost: 4.25,
          lastUpdated: new Date().toISOString(),
        },
        {
          _id: '3',
          name: 'Sugar',
          currentStock: 15,
          minStock: 5,
          maxStock: 25,
          unit: 'lbs',
          category: 'Sweeteners',
          supplier: 'Sweet Supply Co.',
          cost: 2.80,
          lastUpdated: new Date().toISOString(),
        },
        {
          _id: '4',
          name: 'Paper Cups (16oz)',
          currentStock: 200,
          minStock: 100,
          maxStock: 1000,
          unit: 'pieces',
          category: 'Supplies',
          supplier: 'Packaging Plus',
          cost: 0.15,
          lastUpdated: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item) => {
    const percentage = (item.currentStock / item.maxStock) * 100;
    if (item.currentStock <= item.minStock) return 'critical';
    if (percentage <= 30) return 'low';
    if (percentage <= 60) return 'medium';
    return 'good';
  };

  const getStatusColor = (status) => {
    const colors = {
      critical: 'error',
      low: 'warning',
      medium: 'info',
      good: 'success',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      critical: <Warning />,
      low: <TrendingDown />,
      medium: <Inventory />,
      good: <CheckCircle />,
    };
    return icons[status] || <Inventory />;
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMenuClick = (event, itemId) => {
    setAnchorEl(event.currentTarget);
    setSelectedItemId(itemId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItemId(null);
  };

  const handleEditItem = () => {
    const item = inventory.find(item => item._id === selectedItemId);
    setSelectedItem(item);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    const item = inventory.find(item => item._id === selectedItemId);
    setSelectedItem(item);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleAddItem = () => {
    // Add new item logic
    const newInventoryItem = {
      ...newItem,
      _id: Date.now().toString(),
      lastUpdated: new Date().toISOString(),
    };
    setInventory([...inventory, newInventoryItem]);
    setAddDialogOpen(false);
    setNewItem({
      name: '',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unit: '',
      category: '',
      supplier: '',
      cost: 0,
    });
  };

  const handleDeleteItem = () => {
    setInventory(inventory.filter(item => item._id !== selectedItem._id));
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const criticalItems = inventory.filter(item => getStockStatus(item) === 'critical').length;
  const lowStockItems = inventory.filter(item => ['critical', 'low'].includes(getStockStatus(item))).length;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Inventory Management
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchInventoryData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {criticalItems} critical items, {lowStockItems} items need restocking
          </Typography>
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Inventory color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="primary" fontWeight={700}>
                    {inventory.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Items
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning color="error" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="error" fontWeight={700}>
                    {criticalItems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Stock
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingDown color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="warning.main" fontWeight={700}>
                    {lowStockItems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Stock
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    {inventory.filter(item => getStockStatus(item) === 'good').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Good Stock
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search inventory items..."
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
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Current Stock</TableCell>
                <TableCell>Min/Max Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Cost per Unit</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Unit: {item.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {item.currentStock} {item.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.minStock} - {item.maxStock} {item.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(status)}
                          label={status.charAt(0).toUpperCase() + status.slice(1)}
                          color={getStatusColor(status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          ${item.cost.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.supplier}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, item._id)}
                          size="small"
                        >
                          <MoreVert />
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setAddDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditItem}>
          <Edit sx={{ mr: 1 }} />
          Edit Item
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Item
        </MenuItem>
      </Menu>

      {/* Add Item Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Category"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Unit"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Current Stock"
                type="number"
                value={newItem.currentStock}
                onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Min Stock"
                type="number"
                value={newItem.minStock}
                onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Max Stock"
                type="number"
                value={newItem.maxStock}
                onChange={(e) => setNewItem({ ...newItem, maxStock: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Cost per Unit"
                type="number"
                step="0.01"
                value={newItem.cost}
                onChange={(e) => setNewItem({ ...newItem, cost: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained">
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Inventory Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteItem} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminInventory;
