import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Box,
  Divider,
  IconButton,
  Paper,
  Chip,
  Slide,
  Alert,
  FormControl,
  FormLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CartCustomizationDialog = ({ open, onClose, item, onUpdateCustomization }) => {
  const [selectedSize, setSelectedSize] = useState('medium');
  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);

  // Initialize state when dialog opens
  useEffect(() => {
    if (open && item) {
      setSelectedSize(item.selectedSize || 'medium');
      setSelectedCustomizations(item.selectedOptions || {});
      calculateTotalPrice(item.selectedSize || 'medium', item.selectedOptions || {});
    }
  }, [open, item]);

  const handleSizeChange = (event) => {
    const newSize = event.target.value;
    setSelectedSize(newSize);
    calculateTotalPrice(newSize, selectedCustomizations);
  };

  const handleCustomizationChange = (event) => {
    const option = event.target.name;
    const isChecked = event.target.checked;

    const updatedCustomizations = { ...selectedCustomizations };
    
    if (isChecked) {
      updatedCustomizations[option] = true;
    } else {
      delete updatedCustomizations[option];
    }

    setSelectedCustomizations(updatedCustomizations);
    calculateTotalPrice(selectedSize, updatedCustomizations);
  };

  const calculateTotalPrice = (size, customizations) => {
    if (!item || !item.price) return;
    
    const basePrice = item.price[size?.toLowerCase()] || item.price.medium || item.price.regular || 0;
    const extraCost = Object.keys(customizations).length * 10; // ₹10 for each customization
    setTotalPrice((basePrice + extraCost) * item.quantity);
  };

  const handleSaveChanges = () => {
    if (onUpdateCustomization) {
      onUpdateCustomization(item.cartItemId, {
        selectedSize,
        selectedOptions: selectedCustomizations
      });
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    if (item) {
      setSelectedSize(item.selectedSize || 'medium');
      setSelectedCustomizations(item.selectedOptions || {});
    }
    onClose();
  };

  if (!item) return null;

  // Mock customization options (in real app, this would come from the menu item data)
  const customizationOptions = {
    milk: ['Regular Milk', 'Almond Milk', 'Soy Milk', 'Oat Milk'],
    sweetness: ['No Sugar', 'Less Sweet', 'Regular', 'Extra Sweet'],
    temperature: ['Hot', 'Iced'],
    extras: ['Extra Shot', 'Decaf', 'Extra Foam', 'Whipped Cream', 'Vanilla Syrup', 'Caramel Syrup']
  };

  const sizeOptions = ['Small', 'Medium', 'Large'];

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      TransitionComponent={Transition}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, #FFFFFF 0%, #FAF7F2 100%)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6" component="div">
            Edit Customization
          </Typography>
        </Box>
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Item Info */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'background.secondary' }}>
          <Typography variant="h6" gutterBottom>
            {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current quantity: {item.quantity}
          </Typography>
        </Paper>

        {/* Size Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
              Size
            </FormLabel>
            <RadioGroup
              row
              value={selectedSize}
              onChange={handleSizeChange}
            >
              {sizeOptions.map((size) => (
                <FormControlLabel
                  key={size}
                  value={size}
                  control={<Radio />}
                  label={size}
                  sx={{ mr: 3 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Customization Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Customizations
          </Typography>
          
          {/* Milk Options */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Milk Type
            </Typography>
            <RadioGroup
              row
              value={selectedCustomizations.milk || 'Regular Milk'}
              onChange={(e) => setSelectedCustomizations(prev => ({ ...prev, milk: e.target.value }))}
            >
              {customizationOptions.milk.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio size="small" />}
                  label={option}
                  sx={{ mr: 2 }}
                />
              ))}
            </RadioGroup>
          </Box>

          {/* Sweetness */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Sweetness Level
            </Typography>
            <RadioGroup
              row
              value={selectedCustomizations.sweetness || 'Regular'}
              onChange={(e) => setSelectedCustomizations(prev => ({ ...prev, sweetness: e.target.value }))}
            >
              {customizationOptions.sweetness.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio size="small" />}
                  label={option}
                  sx={{ mr: 2 }}
                />
              ))}
            </RadioGroup>
          </Box>

          {/* Temperature */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Temperature
            </Typography>
            <RadioGroup
              row
              value={selectedCustomizations.temperature || 'Hot'}
              onChange={(e) => setSelectedCustomizations(prev => ({ ...prev, temperature: e.target.value }))}
            >
              {customizationOptions.temperature.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio size="small" />}
                  label={option}
                  sx={{ mr: 2 }}
                />
              ))}
            </RadioGroup>
          </Box>

          {/* Extra Options */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Extra Options (+₹10 each)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {customizationOptions.extras.map((option) => (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      checked={selectedCustomizations[option] || false}
                      onChange={handleCustomizationChange}
                      name={option}
                      size="small"
                    />
                  }
                  label={option}
                  sx={{ mr: 1 }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Price Summary */}
        <Paper sx={{ p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            Updated Total: ₹{totalPrice.toFixed(2)}
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          startIcon={<CancelIcon />}
          sx={{ minWidth: 120 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveChanges}
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{ minWidth: 120 }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartCustomizationDialog;
