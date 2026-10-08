import React, { useEffect, useMemo, useState } from 'react';
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
  IconButton,
  Paper,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;

const buildSizes = (item) => (
  item?.sizes?.length
    ? item.sizes.map((s) => ({ value: s.label, label: s.label, price: Number(s.price) || 0, isDefault: s.isDefault }))
    : [
        { value: 'medium', label: 'Medium', price: Number(item?.price?.medium) || 0 },
        { value: 'large', label: 'Large', price: Number(item?.price?.large) || 0 },
      ]
);

const CartCustomizationDialog = ({ open, onClose, item, onUpdateCustomization }) => {
  const sizeOptions = useMemo(() => buildSizes(item), [item]);
  const modifierGroups = item?.modifierGroups || [];

  const [selectedSize, setSelectedSize] = useState('medium');
  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    if (open && item) {
      setSelectedSize(item.selectedSize || sizeOptions[0]?.value || 'medium');
      setSelectedOptions(item.selectedOptions || {});
    }
  }, [open, item, sizeOptions]);

  if (!item) return null;

  const basePrice = Number(sizeOptions.find((s) => s.value === selectedSize)?.price || 0);
  const delta = Object.values(selectedOptions).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const total = (basePrice + delta) * item.quantity;

  const toggleOption = (name, priceDelta, checked) => {
    setSelectedOptions((prev) => {
      const next = { ...prev };
      if (checked) next[name] = Number(priceDelta) || 0;
      else delete next[name];
      return next;
    });
  };

  const handleSave = () => {
    onUpdateCustomization?.(item.cartItemId, { selectedSize, selectedOptions });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
        Edit {item.title || item.name}
        <IconButton onClick={onClose} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Size
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
              <RadioGroup value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                {sizeOptions.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={opt.value}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body1">{opt.label}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatMoney(opt.price)}</Typography>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                ))}
              </RadioGroup>
            </Paper>
          </Box>

          {modifierGroups.length > 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Options
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                <Stack spacing={1.5}>
                  {modifierGroups.map((group) => (
                    <Box key={group._id || group.name}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {group.name}
                      </Typography>
                      {group.options?.map((opt) => (
                        <FormControlLabel
                          key={opt._id || opt.name}
                          control={
                            <Checkbox
                              checked={selectedOptions[opt.name] !== undefined}
                              onChange={(e) => toggleOption(opt.name, opt.priceDelta, e.target.checked)}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <Typography variant="body2">{opt.name}</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {Number(opt.priceDelta) > 0 ? `+${formatMoney(opt.priceDelta)}` : 'Free'}
                              </Typography>
                            </Box>
                          }
                          sx={{ width: '100%', mr: 0 }}
                        />
                      ))}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>
          )}

          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Updated total
            </Typography>
            <Chip color="primary" label={formatMoney(total)} sx={{ fontWeight: 700, fontSize: '1rem' }} />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CartCustomizationDialog;
