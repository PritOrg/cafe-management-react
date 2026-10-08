import React, { memo, useCallback, useContext, useState } from 'react';
import {
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Button,
  Chip,
  Box,
  Tooltip,
  Stack,
  alpha,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TuneIcon from '@mui/icons-material/Tune';
import InfoIcon from '@mui/icons-material/Info';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import ImageIcon from '@mui/icons-material/Image';
import CartContext from '../CartContext';
import { useToast } from '../ui';
import useFavourites from '../../hooks/useFavourites';
import CustomizationDialog from './CustomizationDialog';
import MenuItemInfoDialog from './MenuItemInfoDialog';

const formatMoney = (value) => `₹${Number(value || 0).toFixed(0)}`;

const MenuItemCard = ({ menuItem }) => {
  const { addToCart } = useContext(CartContext);
  const toast = useToast();
  const { isFavourite, toggleFavourite } = useFavourites();

  const [openInfo, setOpenInfo] = useState(false);
  const [openCustomize, setOpenCustomize] = useState(false);
  const [imageError, setImageError] = useState(false);

  const id = menuItem._id || menuItem.id;
  const favourite = isFavourite(id);

  const sizes = menuItem.sizes || [];
  const hasSizes = sizes.length > 1;
  const hasModifiers =
    (menuItem.modifierGroups?.length || 0) > 0 || (menuItem.customizationOptions?.length || 0) > 0;
  const needsDialog = hasSizes || hasModifiers;

  const priceLabel = sizes.length
    ? `${formatMoney(sizes[0].price)} onwards`
    : menuItem.price?.large && menuItem.price.large !== menuItem.price.medium
      ? `${formatMoney(menuItem.price.medium)} – ${formatMoney(menuItem.price.large)}`
      : formatMoney(menuItem.price?.medium ?? menuItem.price?.large ?? 0);

  const handleAdd = useCallback(async (event) => {
    event.stopPropagation();
    if (needsDialog) {
      setOpenCustomize(true);
      return;
    }
    try {
      await addToCart(menuItem);
      toast.success(`${menuItem.title} added to cart`);
    } catch (error) {
      toast.error(error.message || 'Could not add to cart');
    }
  }, [addToCart, menuItem, needsDialog, toast]);

  const handleFavourite = (event) => {
    event.stopPropagation();
    toggleFavourite(id);
  };

  const handleShare = (event) => {
    event.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: menuItem.title, url: window.location.href }).catch(() => {});
    }
  };

  const isPopular = menuItem.rating >= 4.5;

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardActionArea onClick={() => setOpenInfo(true)} sx={{ flexGrow: 1, alignItems: 'stretch' }}>
          <Box
            sx={{
              position: 'relative',
              pt: '62%',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
            }}
          >
            {menuItem.imageUrl && !imageError ? (
              <CardMedia
                component="img"
                image={menuItem.imageUrl}
                alt={menuItem.title}
                onError={() => setImageError(true)}
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: (t) => alpha(t.palette.primary.main, 0.5),
                }}
              >
                <ImageIcon sx={{ fontSize: 44 }} />
              </Box>
            )}

            <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 1 }}>
              {menuItem.category && (
                <Chip
                  size="small"
                  label={menuItem.category}
                  sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', fontWeight: 600 }}
                />
              )}
            </Box>

            {isPopular && (
              <Chip
                size="small"
                icon={<StarIcon sx={{ color: '#fff !important' }} />}
                label="Popular"
                sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'warning.main', color: '#fff', fontWeight: 700 }}
              />
            )}
          </Box>

          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
              {menuItem.title}
            </Typography>
            {menuItem.subTitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}
              >
                {menuItem.subTitle}
              </Typography>
            )}

            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {priceLabel}
              </Typography>
              {menuItem.preparationTime ? (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
                  <AccessTimeIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">{menuItem.preparationTime}m</Typography>
                </Stack>
              ) : null}
            </Stack>
          </CardContent>
        </CardActionArea>

        <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={favourite ? 'Remove from favourites' : 'Add to favourites'}>
              <IconButton onClick={handleFavourite} aria-label="Toggle favourite" color={favourite ? 'error' : 'default'}>
                {favourite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Details">
              <IconButton onClick={(e) => { e.stopPropagation(); setOpenInfo(true); }} aria-label="View details">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          <Button
            variant="contained"
            startIcon={needsDialog ? <TuneIcon /> : <ShoppingCartIcon />}
            onClick={handleAdd}
            sx={{ px: 2.5 }}
          >
            {needsDialog ? 'Customize' : 'Add'}
          </Button>
        </CardActions>
      </Card>

      <MenuItemInfoDialog
        open={openInfo}
        onClose={() => setOpenInfo(false)}
        onAddToCart={() => {
          setOpenInfo(false);
          if (needsDialog) setOpenCustomize(true);
          else handleAdd({ stopPropagation() {} });
        }}
        menuItem={menuItem}
      />

      {needsDialog && (
        <CustomizationDialog
          open={openCustomize}
          onClose={() => setOpenCustomize(false)}
          menuItem={menuItem}
        />
      )}
    </>
  );
};

export default memo(MenuItemCard);
