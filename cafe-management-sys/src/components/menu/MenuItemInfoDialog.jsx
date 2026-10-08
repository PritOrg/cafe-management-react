import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
  Stack,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TimeIcon from '@mui/icons-material/AccessTime';
import CaloriesIcon from '@mui/icons-material/LocalFireDepartment';
import StarIcon from '@mui/icons-material/Star';
import CategoryIcon from '@mui/icons-material/RestaurantMenu';
import AllergenIcon from '@mui/icons-material/ReportProblem';
import CloseIcon from '@mui/icons-material/Close';

const formatMoney = (value) => `₹${Number(value || 0).toFixed(0)}`;

const MenuItemInfoDialog = ({ open, onClose, onAddToCart, menuItem }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  if (!menuItem) return null;

  const { title, subTitle, price, category, imageUrl, calories, preparationTime, rating, tags = [], allergens = [] } = menuItem;

  const sizePrices = menuItem.sizes?.length
    ? menuItem.sizes.map((s) => ({ label: s.label, value: Number(s.price) || 0, isDefault: s.isDefault }))
    : [
        { label: 'Medium', value: Number(price?.medium) || 0 },
        { label: 'Large', value: Number(price?.large) || 0 },
      ];

  const stats = [
    preparationTime ? { icon: <TimeIcon />, value: `${preparationTime}`, label: 'Minutes' } : null,
    calories ? { icon: <CaloriesIcon />, value: `${calories}`, label: 'Calories' } : null,
    { icon: <CategoryIcon />, value: category || '—', label: 'Category' },
  ].filter(Boolean);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 4, overflow: 'hidden', maxHeight: '92vh' } }}
    >
      <Box
        sx={{
          position: 'relative',
          minHeight: 200,
          display: 'flex',
          alignItems: 'flex-end',
          color: '#fff',
          p: 3,
          background: imageUrl
            ? `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.75)), url(${imageUrl}) center/cover`
            : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
      >
        <IconButton
          onClick={onClose}
          aria-label="Close"
          sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.35)', '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' } }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
            {category && (
              <Chip
                size="small"
                icon={<CategoryIcon sx={{ color: '#fff !important' }} />}
                label={category}
                sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 600 }}
              />
            )}
            {rating != null && (
              <Chip
                size="small"
                icon={<StarIcon sx={{ color: '#fff !important' }} />}
                label={rating}
                sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 600 }}
              />
            )}
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 800 }} noWrap>
            {title}
          </Typography>
          {subTitle && (
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {subTitle}
            </Typography>
          )}
        </Box>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          {/* Stats */}
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 1.5 }}>
            {stats.map((stat) => (
              <Paper key={stat.label} variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 0.5 }}>{stat.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Pricing */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Pricing
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {sizePrices.map((size) => (
                <Paper
                  key={size.label}
                  variant={size.isDefault ? 'elevation' : 'outlined'}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    textAlign: 'center',
                    borderColor: size.isDefault ? 'primary.main' : 'divider',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: size.isDefault ? 'primary.main' : 'text.primary' }}>
                    {formatMoney(size.value)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {size.label}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>

          {allergens.length > 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AllergenIcon color="warning" fontSize="small" /> Allergens
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {allergens.map((allergen) => (
                  <Chip key={allergen} label={allergen} color="warning" variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}

          {tags.length > 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Tags
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} variant="outlined" />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0, gap: 1 }}>
        <Button onClick={onClose} color="inherit" size="large">
          Close
        </Button>
        <Button onClick={onAddToCart} variant="contained" size="large" startIcon={<ShoppingCartIcon />}>
          Add to cart
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MenuItemInfoDialog;
