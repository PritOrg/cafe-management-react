import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
  Avatar,
  Stack,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  AccessTime as TimeIcon,
  LocalFireDepartment as CaloriesIcon,
  Star as StarIcon,
  RestaurantMenu as CategoryIcon,
  Warning as AllergenIcon,
  Close as CloseIcon,
  TrendingUp as TrendingIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';

const MenuItemInfoDialog = ({ open, onClose, onAddToCart, menuItem }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isPopular = rating >= 4.5;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : '24px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)',
          maxHeight: '90vh',
          overflow: 'hidden',
        }
      }}
    >
      {/* Header with Image Background */}
      <Box sx={{ 
        position: 'relative',
        height: 200,
        background: `linear-gradient(45deg, rgba(255,107,53,0.9) 0%, rgba(255,142,83,0.8) 100%), url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        color: 'white',
      }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: 'rgba(0,0,0,0.5)',
              transform: 'scale(1.1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Popular Badge */}
        {isPopular && (
          <Box sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA726 100%)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 700,
            fontSize: '0.85rem',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
          }}>
            <TrendingIcon sx={{ fontSize: 18 }} />
            Popular Choice
          </Box>
        )}

        {/* Title Section */}
        <Box sx={{ padding: '24px', width: '100%', background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                fontSize: '1.5rem',
                fontWeight: 800,
                border: '2px solid rgba(255,255,255,0.3)',
              }}
            >
              {title.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                mb: 0.5,
                letterSpacing: '-1px',
              }}>
                {title}
              </Typography>
              <Typography variant="h6" sx={{ 
                opacity: 0.9,
                fontWeight: 400,
              }}>
                {subTitle}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              padding: '6px 12px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}>
              <StarIcon sx={{ fontSize: 18 }} />
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {rating}
              </Typography>
            </Box>
            
            <Chip 
              icon={<CategoryIcon sx={{ fontSize: '16px !important', color: 'white !important' }} />}
              label={category} 
              sx={{ 
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'white' }
              }} 
            />
          </Box>
        </Box>
      </Box>
        
      <DialogContent sx={{ padding: '32px' }}>
        <Stack spacing={4}>
          {/* Key Stats */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
            gap: 3 
          }}>
            <Box sx={{ 
              textAlign: 'center',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(255,142,83,0.05) 100%)',
              borderRadius: '20px',
              border: '2px solid rgba(255,107,53,0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <TimeIcon sx={{ color: '#FF6B35', fontSize: 32, mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#2C1810', fontWeight: 800, mb: 0.5 }}>
                {preparationTime}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
                Minutes
              </Typography>
            </Box>

            <Box sx={{ 
              textAlign: 'center',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,193,7,0.05) 100%)',
              borderRadius: '20px',
              border: '2px solid rgba(255,152,0,0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CaloriesIcon sx={{ color: '#FF9800', fontSize: 32, mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#2C1810', fontWeight: 800, mb: 0.5 }}>
                {calories}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
                Calories
              </Typography>
            </Box>

            <Box sx={{ 
              textAlign: 'center',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(139,195,74,0.05) 100%)',
              borderRadius: '20px',
              border: '2px solid rgba(76,175,80,0.1)',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <FavoriteIcon sx={{ color: '#4CAF50', fontSize: 32, mb: 1 }} />
              <Typography variant="h4" sx={{ color: '#2C1810', fontWeight: 800, mb: 0.5 }}>
                98%
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
                Love Rate
              </Typography>
            </Box>
          </Box>

          {/* Pricing */}
          <Box sx={{ 
            background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(255,142,83,0.04) 100%)',
            borderRadius: '20px',
            padding: '24px',
            border: '2px solid rgba(255,107,53,0.1)',
          }}>
            <Typography variant="h5" sx={{ 
              color: '#2C1810', 
              fontWeight: 700, 
              mb: 3,
              textAlign: 'center',
            }}>
              💰 Pricing Options
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-around',
              gap: 2,
            }}>
              <Box sx={{ 
                textAlign: 'center',
                background: 'white',
                padding: '20px',
                borderRadius: '16px',
                flex: 1,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                <Typography variant="h4" sx={{ 
                  color: '#FF6B35', 
                  fontWeight: 800,
                  mb: 1,
                }}>
                  {formatPrice(price.medium)}
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#666',
                  fontWeight: 600,
                }}>
                  Medium Size
                </Typography>
              </Box>
              <Box sx={{ 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '16px',
                flex: 1,
                boxShadow: '0 8px 25px rgba(255,107,53,0.3)',
                position: 'relative',
                '&::before': {
                  content: '"Most Popular"',
                  position: 'absolute',
                  top: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#FFD700',
                  color: '#333',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }
              }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 800,
                  mb: 1,
                }}>
                  {formatPrice(price.large)}
                </Typography>
                <Typography variant="body1" sx={{ 
                  fontWeight: 600,
                  opacity: 0.9,
                }}>
                  Large Size
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Allergens */}
          {allergens.length > 0 && (
            <Box>
              <Typography variant="h5" sx={{ 
                color: '#2C1810', 
                fontWeight: 700, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <AllergenIcon sx={{ color: '#FF9800' }} />
                ⚠️ Allergen Information
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {allergens.map((allergen, index) => (
                  <Fade in timeout={300 + (index * 100)} key={allergen}>
                    <Chip 
                      label={allergen} 
                      sx={{ 
                        backgroundColor: '#FFF3E0',
                        color: '#E65100',
                        fontWeight: 600,
                        border: '2px solid rgba(230, 81, 0, 0.2)',
                        fontSize: '0.85rem',
                        '&:hover': {
                          backgroundColor: '#FFE0B2',
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease',
                      }} 
                    />
                  </Fade>
                ))}
              </Box>
            </Box>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <Box>
              <Typography variant="h5" sx={{ 
                color: '#2C1810', 
                fontWeight: 700, 
                mb: 2,
              }}>
                🏷️ Tags

                </Typography>
             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
               {tags.map((tag, index) => (
                 <Fade in timeout={400 + (index * 100)} key={tag}>
                   <Chip 
                     label={tag} 
                     variant="outlined"
                     sx={{ 
                       borderColor: 'rgba(255,107,53,0.3)',
                       color: '#FF6B35',
                       fontWeight: 600,
                       fontSize: '0.85rem',
                       background: 'rgba(255,107,53,0.05)',
                       transition: 'all 0.2s ease',
                       '&:hover': {
                         backgroundColor: 'rgba(255,107,53,0.1)',
                         borderColor: '#FF6B35',
                         transform: 'scale(1.05)',
                       }
                     }} 
                   />
                 </Fade>
               ))}
             </Box>
           </Box>
         )}

         {/* Fun Facts Section */}
         <Box sx={{
           background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(139,195,74,0.05) 100%)',
           borderRadius: '20px',
           padding: '24px',
           border: '2px solid rgba(76,175,80,0.1)',
         }}>
           <Typography variant="h5" sx={{ 
             color: '#2C1810', 
             fontWeight: 700, 
             mb: 2,
             textAlign: 'center',
           }}>
             🌟 Did You Know?
           </Typography>
           <Stack spacing={2}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
               <Box sx={{
                 width: 8,
                 height: 8,
                 borderRadius: '50%',
                 background: '#4CAF50',
               }} />
               <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
                 This dish is ordered by <strong>250+ customers</strong> every week!
               </Typography>
             </Box>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
               <Box sx={{
                 width: 8,
                 height: 8,
                 borderRadius: '50%',
                 background: '#FF9800',
               }} />
               <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
                 Perfect for sharing with <strong>2-3 friends</strong> (Large size)
               </Typography>
             </Box>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
               <Box sx={{
                 width: 8,
                 height: 8,
                 borderRadius: '50%',
                 background: '#FF6B35',
               }} />
               <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
                 Made fresh to order with <strong>premium ingredients</strong>
               </Typography>
             </Box>
           </Stack>
         </Box>
       </Stack>
     </DialogContent>
       
     <DialogActions sx={{ 
       padding: '24px 32px 32px',
       background: 'linear-gradient(135deg, rgba(255,107,53,0.05) 0%, rgba(255,142,83,0.02) 100%)',
       display: 'flex',
       gap: 2,
       justifyContent: 'center',
     }}>
       <Button 
         onClick={onClose} 
         variant="outlined"
         size="large"
         sx={{ 
           borderRadius: '16px',
           textTransform: 'none',
           fontWeight: 600,
           minWidth: '120px',
           borderColor: '#FF6B35',
           color: '#FF6B35',
           borderWidth: 2,
           '&:hover': {
             borderWidth: 2,
             borderColor: '#FF6B35',
             background: 'rgba(255,107,53,0.05)',
           }
         }}
       >
         Close
       </Button>
       <Button 
         onClick={onAddToCart}
         variant="contained"
         size="large"
         startIcon={<ShoppingCartIcon />}
         sx={{ 
           background: 'linear-gradient(135deg, #FF6B35 0%, #FF8E53 100%)',
           borderRadius: '16px',
           textTransform: 'none',
           fontWeight: 700,
           minWidth: '160px',
           fontSize: '1rem',
           padding: '12px 32px',
           boxShadow: '0 8px 25px rgba(255,107,53,0.3)',
           transition: 'all 0.3s ease',
           '&:hover': {
             boxShadow: '0 12px 35px rgba(255,107,53,0.4)',
             transform: 'translateY(-2px)',
           }
         }}
       >
         Add to Cart
       </Button>
     </DialogActions>
   </Dialog>
 );
};

export default MenuItemInfoDialog;