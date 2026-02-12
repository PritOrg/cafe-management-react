import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { menuAPI } from '../../services/api';

const AdminMenu = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'coffee', label: 'Coffee' },
    { value: 'tea', label: 'Tea' },
    { value: 'pastries', label: 'Pastries' },
    { value: 'sandwiches', label: 'Sandwiches' },
    { value: 'desserts', label: 'Desserts' },
  ];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await menuAPI.getAll();
      const menuData = response?.data || response || [];
      setMenuItems(Array.isArray(menuData) ? menuData : []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
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
      const item = menuItems.find(item => item._id === itemId);
      await menuAPI.update(itemId, { ...item, available });
      setMenuItems(menuItems.map(item => 
        item._id === itemId ? { ...item, available } : item
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
            <Typography align="center">Loading menu items...</Typography>
          </Grid>
        ) : filteredItems.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center">No menu items found</Typography>
          </Grid>
        ) : (
          filteredItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: item.available ? 1 : 0.7,
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={item.image || '/api/placeholder/300/200'}
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
                      ${item.price.toFixed(2)}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.available}
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
          console.log('View item:', item);
          handleMenuClose();
        }}>
          <Visibility sx={{ mr: 1 }} />
          View Details
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
