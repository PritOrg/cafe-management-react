import React, { useState } from 'react';
import {
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Button,
  Rating,
  Chip,
  Box,
  Tooltip,
  Zoom,
  Stack,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Info as InfoIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  RestaurantMenu as CategoryIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import CustomizationDialog from './CustomizationDialog';
import MenuItemInfoDialog from './MenuItemInfoDialog';

const MenuItemCard = ({ menuItem, addToCart }) => {
  const [openInfoDialog, setOpenInfoDialog] = useState(false);
  const [openCustomizationDialog, setOpenCustomizationDialog] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const { 
    title, 
    subTitle, 
    price, 
    category, 
    imageUrl, 
    calories, 
    preparationTime, 
    rating, 
    tags, 
    allergens 
  } = menuItem;

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    setOpenCustomizationDialog(true);
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    setOpenInfoDialog(true);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    // Add share functionality
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out this amazing ${title} at our restaurant!`,
        url: window.location.href,
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isPopular = rating >= 4.5;
  const isTrending = tags.includes('Popular') || tags.includes('Trending');

  return (
    <>
      <Zoom in timeout={400}>
        <Card 
          sx={{ 
            maxWidth: 340, 
            position: 'relative',
            background: 'linear-gradient(145deg, #FFFFFF 0%, #FAF7F2 100%)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0px 4px 20px rgba(139, 69, 19, 0.08)',
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            border: '1px solid rgba(139, 69, 19, 0.06)',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0px 12px 40px rgba(139, 69, 19, 0.15)',
              border: '1px solid rgba(139, 69, 19, 0.12)',
              '& .card-image': {
                transform: 'scale(1.08)',
              },
              '& .floating-actions': {
                opacity: 1,
                transform: 'translateY(0)',
              },
              '& .price-badge': {
                transform: 'translateY(-2px)',
              },
              '& .add-btn': {
                transform: 'translateY(-2px)',
                boxShadow: '0px 8px 24px rgba(139, 69, 19, 0.35)',
              }
            }
          }}
        >
          {/* Trending/Popular Badge */}
          {(isPopular || isTrending) && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 16,
              zIndex: 10,
              background: 'linear-gradient(135deg, #D4A574 0%, #F4A460 100%)',
              color: '#2C1810',
              padding: '8px 16px',
              borderRadius: '0 0 16px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              boxShadow: '0px 4px 12px rgba(139, 69, 19, 0.2)',
            }}>
              <TrendingIcon sx={{ fontSize: 14 }} />
              {isPopular ? 'Popular' : 'Trending'}
            </Box>
          )}

          <CardActionArea>
            <Box sx={{ 
              position: 'relative', 
              overflow: 'hidden',
              height: 200,
              background: 'linear-gradient(45deg, #F5F2ED 0%, #FAF7F2 100%)',
            }}>
              <CardMedia
                component="img"
                height="200"
                image={imageUrl}
                alt={title}
                className="card-image"
                onLoad={() => setImageLoaded(true)}
                sx={{ 
                  objectFit: 'cover',
                  transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  opacity: imageLoaded ? 1 : 0,
                }}
              />
              
              {/* Subtle Gradient Overlay */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(44,24,16,0) 0%, rgba(44,24,16,0.05) 70%, rgba(44,24,16,0.15) 100%)',
                pointerEvents: 'none',
              }} />

              {/* Category & Rating */}
              <Box sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <Chip 
                  icon={<CategoryIcon sx={{ fontSize: '14px !important' }} />}
                  label={category} 
                  size="small" 
                  sx={{ 
                    background: 'rgba(44, 24, 16, 0.85)',
                    backdropFilter: 'blur(10px)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    '& .MuiChip-icon': { color: '#FFFFFF' }
                  }} 
                />

                <Box sx={{
                  background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.95) 0%, rgba(244, 164, 96, 0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}>
                  <StarIcon sx={{ fontSize: 16, color: '#2C1810' }} />
                  <Typography variant="caption" sx={{ color: '#2C1810', fontWeight: 700 }}>
                    {rating}
                  </Typography>
                </Box>
              </Box>

              {/* Floating Action Buttons */}
              <Box sx={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                opacity: 0,
                transform: 'translateY(10px)',
                transition: 'all 0.3s ease',
              }}
              className="floating-actions">
                <Tooltip title="More Info" arrow placement="left">
                  <IconButton
                    onClick={handleInfoClick}
                    size="small"
                    sx={{
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(10px)',
                      color: '#8B4513',
                      width: 36,
                      height: 36,
                      boxShadow: '0px 4px 12px rgba(139, 69, 19, 0.15)',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        background: '#8B4513',
                        color: 'white',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Share" arrow placement="left">
                  <IconButton 
                    onClick={handleShareClick}
                    size="small"
                    sx={{ 
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(10px)',
                      color: '#5D4E37',
                      width: 36,
                      height: 36,
                      boxShadow: '0px 4px 12px rgba(139, 69, 19, 0.15)',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        background: '#D4A574',
                        color: '#2C1810',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <CardContent sx={{ padding: '20px 20px 16px' }}>
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    color: '#2C1810', 
                    fontWeight: 800, 
                    fontSize: '1.25rem',
                    lineHeight: 1.2,
                    mb: 0.5,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {title}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#5D4E37', 
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                    opacity: 0.9,
                  }}
                >
                  {subTitle}
                </Typography>
              </Box>

              {/* Price Badge */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 2,
              }}
              className="price-badge">
                <Box sx={{
                  background: 'linear-gradient(135deg, #8B4513 0%, #A67B5B 100%)',
                  color: 'white',
                  padding: '10px 18px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '120px',
                  boxShadow: '0px 4px 16px rgba(139, 69, 19, 0.25)',
                  transition: 'all 0.3s ease',
                }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 800, 
                      fontSize: '0.9rem',
                      lineHeight: 1,
                    }}
                  >
                    {formatPrice(price.medium)} - {formatPrice(price.large)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                    Medium - Large
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  background: 'rgba(139, 69, 19, 0.08)',
                  padding: '8px 14px',
                  borderRadius: '16px',
                  border: '1px solid rgba(139, 69, 19, 0.12)',
                }}>
                  <TimeIcon sx={{ fontSize: 16, color: '#8B4513' }} />
                  <Typography variant="caption" sx={{ 
                    color: '#8B4513', 
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}>
                    {preparationTime}m
                  </Typography>
                </Box>
              </Box>

              {/* Tags */}
              {tags.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {tags.slice(0, 3).map((tag, index) => (
                    <Chip 
                      key={tag}
                      label={tag} 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(139, 69, 19, 0.06)',
                        color: '#8B4513',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        border: '1px solid rgba(139, 69, 19, 0.12)',
                        '&:hover': {
                          backgroundColor: 'rgba(139, 69, 19, 0.12)',
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease',
                      }} 
                    />
                  ))}
                  {tags.length > 3 && (
                    <Chip 
                      label={`+${tags.length - 3}`} 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#8B4513',
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }} 
                    />
                  )}
                </Stack>
              )}
            </CardContent>
          </CardActionArea>

          <CardActions sx={{ 
            padding: '0 20px 20px', 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"} arrow>
                <IconButton 
                  onClick={handleFavoriteClick}
                  sx={{ 
                    color: isFavorite ? '#F44336' : '#A0937A',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      transform: 'scale(1.2)',
                      color: '#F44336',
                    },
                  }}
                >
                  {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
            </Box>

            <Button
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              onClick={handleAddToCartClick}
              className="add-btn"
              sx={{
                background: 'linear-gradient(135deg, #8B4513 0%, #A67B5B 100%)',
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 700,
                padding: '12px 24px',
                fontSize: '0.875rem',
                boxShadow: '0px 4px 16px rgba(139, 69, 19, 0.25)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.3px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6A3400 0%, #8B4513 100%)',
                  boxShadow: '0px 8px 24px rgba(139, 69, 19, 0.35)',
                },
              }}
            >
              Add to Cart
            </Button>
          </CardActions>
        </Card>
      </Zoom>

      {/* Info Dialog */}
      <MenuItemInfoDialog
        open={openInfoDialog}
        onClose={() => setOpenInfoDialog(false)}
        onAddToCart={() => {
          setOpenInfoDialog(false);
          setOpenCustomizationDialog(true);
        }}
        menuItem={menuItem}
      />

      {/* Customization Dialog */}
      <CustomizationDialog
        open={openCustomizationDialog}
        onClose={() => setOpenCustomizationDialog(false)}
        menuItem={menuItem}
        addToCart={addToCart}
      />
    </>
  );
};

export default MenuItemCard;