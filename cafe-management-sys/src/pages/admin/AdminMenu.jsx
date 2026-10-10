import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Switch,
  FormControlLabel,
  Pagination,
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import MoreVert from '@mui/icons-material/MoreVert';
import Visibility from '@mui/icons-material/Visibility';
import FilterList from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import { menuAPI, activityAPI, unwrap } from '../../services/api';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';
import { cloudinaryUrl } from '../../utils/cloudinary';

const formatItemPrice = (item) => {
  const fix = (v) => `₹${Number(v ?? 0).toFixed(0)}`;
  if (Array.isArray(item.sizes) && item.sizes.length) {
    return `${fix(item.sizes[0].price)} onwards`;
  }
  const medium = item.price?.medium;
  const large = item.price?.large;
  if (large != null && Number(large) !== Number(medium ?? large)) {
    return `${fix(medium ?? large)} – ${fix(large)}`;
  }
  return fix(medium ?? large);
};

const AdminMenu = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openItemHistory = async (item) => {
    setHistoryItem(item);
    setHistoryOpen(true);
    setHistoryRows([]);
    setHistoryLoading(true);
    try {
      const body = await activityAPI.byEntity('menuItem', item._id);
      setHistoryRows(unwrap(body) || []);
    } catch (err) {
      console.error('Error loading item history:', err);
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Categories are derived from the tenant's own menu (works for any cuisine).
  const categories = useMemo(() => {
    const unique = [...new Set(menuItems.map((item) => item.category).filter(Boolean))].sort();
    return [{ value: 'all', label: 'All Categories' }, ...unique.map((c) => ({ value: c, label: c }))];
  }, [menuItems]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await menuAPI.getAll();
      const menuData = response?.data || response || [];
      setMenuItems(Array.isArray(menuData) ? menuData : []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError(err.message || 'Failed to load menu items');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    try {
      await menuAPI.delete(selectedItem._id);
      setMenuItems(menuItems.filter(item => item._id !== selectedItem._id));
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const handleToggleAvailability = async (itemId, available) => {
    try {
      await menuAPI.update(itemId, { availability: available });
      setMenuItems(menuItems.map(item => 
        item._id === itemId ? { ...item, availability: available } : item
      ));
    } catch (error) {
      console.error('Error updating item availability:', error);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const [page, setPage] = useState(1);
  const PAGE_MENU = 24;
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_MENU));

  // Reset to page 1 whenever the item set changes (search/category).
  useEffect(() => {
    setPage(1);
  }, [filteredItems.length]);

  const pagedItems = filteredItems.slice((page - 1) * PAGE_MENU, page * PAGE_MENU);

  const handleMenuClick = (event, itemId) => {
    setAnchorEl(event.currentTarget);
    setSelectedItemId(itemId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItemId(null);
  };

  const handleEditItem = () => {
    navigate(`/admin/menu/edit/${selectedItemId}`);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    const item = menuItems.find(item => item._id === selectedItemId);
    setSelectedItem(item);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Menu Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/admin/menu/add')}
          sx={{ borderRadius: 2 }}
        >
          Add New Item
        </Button>
      </Box>

      {error && (
        <ErrorState title="Couldn't load menu items" message={error} onRetry={fetchMenuItems} />
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search menu items..."
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <LoadingState label="Loading menu…" rows={4} />
          </Grid>
        ) : filteredItems.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center">No menu items found</Typography>
          </Grid>
        ) : (
          pagedItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: item.availability ? 1 : 0.7,
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  loading="lazy"
                  image={item.imageUrl ? cloudinaryUrl(item.imageUrl, { w: 400 }) : '/logo512.png'}
                  alt={item.title}
                />
                
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, item._id)}
                    sx={{ 
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' }
                    }}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    <Chip
                      label={item.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2, flexGrow: 1 }}
                  >
                    {item.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                      {formatItemPrice(item)}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.availability}
                          onChange={(e) => handleToggleAvailability(item._id, e.target.checked)}
                          size="small"
                        />
                      }
                      label="Available"
                      labelPlacement="start"
                      sx={{ m: 0 }}
                    />
                  </Box>

                  {item.allergens && item.allergens.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.allergens.map((allergen, index) => (
                        <Chip
                          key={index}
                          label={allergen}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
        {filteredItems.length > PAGE_MENU && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, overflow: 'auto' }}>
              <Pagination
                count={pageCount}
                page={Math.min(page, pageCount)}
                onChange={(_, p) => setPage(p)}
                shape="rounded"
                size="medium"
              />
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/admin/menu/add')}
      >
        <Add />
      </Fab>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const item = menuItems.find(item => item._id === selectedItemId);
          openItemHistory(item);
          handleMenuClose();
        }}>
          <Visibility sx={{ mr: 1 }} />
          History
        </MenuItem>
        <MenuItem onClick={handleEditItem}>
          <Edit sx={{ mr: 1 }} />
          Edit Item
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Item
        </MenuItem>
      </Menu>

      {/* Item History Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>History — {historyItem?.title}</DialogTitle>
        <DialogContent>
          {historyLoading && <Typography variant="body2">Loading history…</Typography>}
          {!historyLoading && historyRows.length === 0 && (
            <Typography variant="body2" color="text.secondary">No activity yet</Typography>
          )}
          {!historyLoading && historyRows.map((h) => (
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
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Menu Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedItem?.title}"? This action cannot be undone.
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

export default AdminMenu;
