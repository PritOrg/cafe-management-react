import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
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
  Slide,
  Stack,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CartContext from '../CartContext';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;

const buildSizes = (menuItem) => (
  menuItem?.sizes?.length
    ? menuItem.sizes.map((s) => ({ value: s.label, label: s.label, price: Number(s.price) || 0, isDefault: s.isDefault }))
    : [
        { value: 'medium', label: 'Medium', price: Number(menuItem?.price?.medium) || 0 },
        { value: 'large', label: 'Large', price: Number(menuItem?.price?.large) || 0 },
      ]
);

const CustomizationDialog = ({ open, onClose, menuItem }) => {
  const { addToCart } = useContext(CartContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const sizeOptions = useMemo(() => buildSizes(menuItem), [menuItem]);
  const modifierGroups = menuItem?.modifierGroups || [];
  const legacyOptions = menuItem?.customizationOptions || [];
  const defaultSize = sizeOptions.find((s) => s.isDefault)?.value || sizeOptions[0]?.value || 'medium';

  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open) {
      setSelectedSize(defaultSize);
      setSelectedCustomizations({});
      setQuantity(1);
    }
  }, [open, defaultSize]);

  const basePriceFor = (size) => Number(sizeOptions.find((s) => s.value === size)?.price || 0);
  const modifierDelta = (customizations) =>
    Object.values(customizations).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const unitPrice = basePriceFor(selectedSize) + modifierDelta(selectedCustomizations);
  const totalPrice = unitPrice * quantity;

  const toggleExtra = (name, priceDelta, checked) => {
    setSelectedCustomizations((prev) => {
      const next = { ...prev };
      if (checked) next[name] = Number(priceDelta) || 0;
      else delete next[name];
      return next;
    });
  };

  const selectRadio = (groupName, option, priceDelta) => {
    setSelectedCustomizations((prev) => ({ ...prev, [groupName]: Number(priceDelta) || 0 }));
  };

  const handleAddToCart = async () => {
    setSubmitting(true);
    try {
      await addToCart(menuItem, selectedCustomizations, selectedSize);
      setSnack({ open: true, message: `${menuItem.title} added to cart`, severity: 'success' });
      onClose();
    } catch (error) {
      setSnack({ open: true, message: error.message || 'Could not add to cart', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!menuItem) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            overflow: 'hidden',
            maxHeight: isMobile ? '100dvh' : undefined,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: 'relative',
            minHeight: 128,
            display: 'flex',
            alignItems: 'flex-end',
            p: 2.5,
            color: '#fff',
            background: menuItem.imageUrl
              ? `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.7)), url(${menuItem.imageUrl}) center/cover`
              : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }} noWrap>
              {menuItem.title}
            </Typography>
            {menuItem.subTitle && (
              <Typography variant="body2" sx={{ opacity: 0.9 }} noWrap>
                {menuItem.subTitle}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={onClose}
            aria-label="Close"
            sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={3}>
            {/* Size */}
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
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatMoney(opt.price)}
                          </Typography>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  ))}
                </RadioGroup>
              </Paper>
            </Box>

            {/* Modifiers */}
            {(modifierGroups.length > 0 || legacyOptions.length > 0) && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Customizations
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                  <Stack spacing={1.5}>
                    {modifierGroups.map((group) => (
                      <Box key={group._id || group.name}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {group.name}
                        </Typography>
                        {group.displayType === 'radio' ? (
                          <RadioGroup
                            value={Object.keys(selectedCustomizations).find((k) =>
                              (group.options || []).some((o) => o.name === k)) || ''}
                            onChange={(e) => {
                              const opt = (group.options || []).find((o) => o.name === e.target.value);
                              selectRadio(group.name, opt, opt?.priceDelta);
                            }}
                          >
                            {(group.options || []).map((opt) => (
                              <FormControlLabel
                                key={opt._id || opt.name}
                                value={opt.name}
                                control={<Radio />}
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
                          </RadioGroup>
                        ) : (
                          (group.options || []).map((opt) => (
                            <FormControlLabel
                              key={opt._id || opt.name}
                              control={
                                <Checkbox
                                  checked={selectedCustomizations[opt.name] !== undefined}
                                  onChange={(e) => toggleExtra(opt.name, opt.priceDelta, e.target.checked)}
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
                          ))
                        )}
                      </Box>
                    ))}
                    {modifierGroups.length === 0 && legacyOptions.map((option) => (
                      <FormControlLabel
                        key={option}
                        control={
                          <Checkbox
                            checked={selectedCustomizations[option] !== undefined}
                            onChange={(e) => toggleExtra(option, 10, e.target.checked)}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body2">{option}</Typography>
                            <Chip size="small" label="+₹10" />
                          </Box>
                        }
                        sx={{ width: '100%', mr: 0 }}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Box>
            )}

            {/* Quantity */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Quantity
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <IconButton
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="h6" sx={{ minWidth: 32, textAlign: 'center' }}>
                    {quantity}
                  </Typography>
                  <IconButton
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatMoney(unitPrice)} each
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            pt: 0,
            position: 'sticky',
            bottom: 0,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button onClick={onClose} color="inherit" size="large">
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            variant="contained"
            size="large"
            startIcon={<ShoppingCartIcon />}
            disabled={submitting}
            sx={{ flexGrow: { xs: 1, sm: 0 } }}
          >
            Add • {formatMoney(totalPrice)}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CustomizationDialog;
