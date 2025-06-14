import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, Badge, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, useMediaQuery, useTheme } from '@mui/material';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HomeIcon from '@mui/icons-material/Home';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LoginIcon from '@mui/icons-material/Login';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import InfoIcon from '@mui/icons-material/Info';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 30,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.black, 0.08),
  },
  transition: 'all 0.3s ease',
  marginRight: theme.spacing(2),
  marginLeft: 'auto',
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.25, 1, 1.25, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
        backgroundColor: alpha(theme.palette.common.black, 0.05),
      },
    },
  },
}));

const NavLink = styled(Link)(({ theme, active }) => ({
  textDecoration: 'none',
  color: 'inherit',
  position: 'relative',
  '&::after': active ? {
    content: '""',
    position: 'absolute',
    width: '70%',
    height: '3px',
    bottom: '-8px',
    left: '15%',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px',
  } : {},
}));

const NavButton = styled(Button)(({ theme, active }) => ({
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  fontWeight: active ? 600 : 500,
  padding: '6px 16px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
}));

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const cartCount = 2; // This would come from your state management

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation items with icons for both desktop and mobile
  const navItems = [
    { text: 'Home', path: '/', icon: <HomeIcon /> },
    { text: 'Menu', path: '/menu', icon: <RestaurantMenuIcon /> },
    { text: 'Login', path: '/login-register', icon: <LoginIcon /> },
    { text: 'Add Item', path: '/menu/add', icon: <AddCircleIcon /> },
    { text: 'Cart', path: '/cart', icon: <ShoppingCartIcon /> },
    { text: 'About Us', path: '/about', icon: <InfoIcon /> },
  ];

  // Mobile drawer content
  const drawer = (
    <Box sx={{ width: 280, pt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        <LocalCafeIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontFamily: 'Pacifico, cursive', color: 'primary.main' }}>
          Bug Latte
        </Typography>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              to={item.path}
              selected={isActive(item.path)}
              onClick={handleDrawerToggle}
              sx={{ 
                borderRadius: 2, 
                mx: 1, 
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  }
                }
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: isActive(item.path) ? 600 : 500 
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky" color="default" elevation={0} sx={{ 
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Toolbar sx={{ py: { xs: 1, sm: 1.5 } }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                mr: 1.5, 
                width: 40, 
                height: 40,
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              <LocalCafeIcon />
            </Avatar>
            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{ 
                fontFamily: 'Pacifico, cursive',
                textDecoration: 'none',
                color: 'primary.main',
                flexGrow: { xs: 1, md: 0 },
                fontSize: { xs: '1.3rem', sm: '1.5rem' }
              }}
            >
              Bug Latte
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', ml: 4 }}>
            <Stack direction="row" spacing={1}>
              {navItems.map((item) => (
                <NavLink key={item.text} to={item.path} active={isActive(item.path) ? 1 : 0}>
                  <NavButton active={isActive(item.path) ? 1 : 0} startIcon={item.icon}>
                    {item.text}
                  </NavButton>
                </NavLink>
              ))}
            </Stack>
          </Box>

          {/* Mobile: Search & Cart */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
              {!showSearch ? (
                <>
                  <IconButton color="inherit" onClick={() => setShowSearch(true)}>
                    <SearchIcon />
                  </IconButton>
                  <IconButton component={Link} to="/cart" color="inherit">
                    <Badge badgeContent={cartCount} color="primary">
                      <ShoppingCartIcon />
                    </Badge>
                  </IconButton>
                </>
              ) : (
                <Search sx={{ ml: 0, flex: 1 }}>
                  <SearchIconWrapper>
                    <SearchIcon />
                  </SearchIconWrapper>
                  <StyledInputBase
                    placeholder="Search…"
                    inputProps={{ 'aria-label': 'search' }}
                    autoFocus
                  />
                  <IconButton 
                    size="small" 
                    sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                    onClick={() => setShowSearch(false)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Search>
              )}
            </Box>
          )}

          {/* Desktop: Search */}
          {!isMobile && (
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ 'aria-label': 'search' }}
              />
            </Search>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box',
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
}