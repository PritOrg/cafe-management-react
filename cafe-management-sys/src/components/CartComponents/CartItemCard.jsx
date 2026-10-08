import React, { memo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import TuneIcon from '@mui/icons-material/Tune';
import ImageIcon from '@mui/icons-material/Image';
import QuantitySelector from './QuantitySelector';
import CartCustomizationDialog from './CartCustomizationDialog';

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;

const CartItemCard = ({ item, onQuantityChange, onRemoveItem, onUpdateCustomization }) => {
  const [openCustomizationDialog, setOpenCustomizationDialog] = useState(false);

  if (!item) return null;

  const selectedSize = item.selectedSize || 'medium';
  const sizePrice = () => {
    const sizes = item.sizes || [];
    if (sizes.length) {
      const match = sizes.find((s) => s.label === item.selectedSize)
        || sizes.find((s) => s.isDefault)
        || sizes[0];
      return Number(match?.price || 0);
    }
    return Number(item.price?.[String(selectedSize).toLowerCase()] ?? item.price?.medium ?? 0);
  };

  const optionsDelta = Object.values(item.selectedOptions || {})
    .reduce((sum, value) => sum + (Number(value) || 0), 0);
  const unitPrice = sizePrice() + optionsDelta;
  const lineTotal = unitPrice * item.quantity;
  const optionEntries = Object.entries(item.selectedOptions || {});

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 64,
              height: 64,
              flexShrink: 0,
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.disabled',
            }}
          >
            {item.imageUrl ? (
              <Box component="img" src={item.imageUrl} alt={item.title} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <ImageIcon />
            )}
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                  {item.title || item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.selectedSize} · {formatMoney(unitPrice)} each
                </Typography>
              </Box>
              <Tooltip title="Remove">
                <IconButton onClick={() => onRemoveItem(item.cartItemId)} color="error" aria-label="Remove item">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {optionEntries.map(([key, value]) => {
                const delta = Number(value) || 0;
                return (
                  <Chip
                    key={key}
                    size="small"
                    label={delta > 0 ? `${key} +${formatMoney(delta)}` : key}
                    variant="outlined"
                  />
                );
              })}
              <Tooltip title="Edit customizations">
                <IconButton size="small" onClick={() => setOpenCustomizationDialog(true)} aria-label="Edit customizations">
                  <TuneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <QuantitySelector
            quantity={item.quantity}
            onQuantityChange={(newQuantity) => onQuantityChange(item.cartItemId, newQuantity)}
          />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {formatMoney(lineTotal)}
          </Typography>
        </Stack>
      </CardContent>

      <CartCustomizationDialog
        open={openCustomizationDialog}
        onClose={() => setOpenCustomizationDialog(false)}
        item={item}
        onUpdateCustomization={onUpdateCustomization}
      />
    </Card>
  );
};

export default memo(CartItemCard);
