import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  Paper,
  useTheme,
  useMediaQuery,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Dashboard,
  ShoppingCart,
  Restaurant,
  People,
  AttachMoney,
  Inventory,
  Analytics,
  Settings,
  Logout,
  Coffee,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import AdminSidebarItem from './AdminSidebarItem';

const drawerWidth = 280;

// Styled components for better UX
const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
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
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    background: 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)',
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  minHeight: 64,
  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
  color: 'white',
}));

const sidebarItems = [
  { title: 'Dashboard', href: '/admin', icon: Dashboard, badge: null },
  { title: 'Orders', href: '/admin/orders', icon: ShoppingCart, badge: '12' },
  { title: 'Menu Items', href: '/admin/menu', icon: Restaurant, badge: null },
  { title: 'Staff', href: '/admin/staff', icon: People, badge: null },
  { title: 'Revenue', href: '/admin/revenue', icon: AttachMoney, badge: null },
  { title: 'Inventory', href: '/admin/inventory', icon: Inventory, badge: '3' },
  { title: 'Analytics', href: '/admin/analytics', icon: Analytics, badge: null },
  { title: 'Settings', href: '/admin/settings', icon: Settings, badge: null },
];

export default function AdminLayout({ children, title = 'Dashboard' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const drawer = (
    <Box>
      <LogoContainer>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            mr: 2,
          }}
        >
          <Coffee sx={{ color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            Bug Latte
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Admin Panel
          </Typography>
        </Box>
      </LogoContainer>

      {/* Admin Profile Section */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              border: '2px solid',
              borderColor: 'primary.light',
            }}
          >
            JD
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              John Doe
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cafe Manager
            </Typography>
          </Box>
          <IconButton size="small" color="primary">
            <NotificationsIcon />
          </IconButton>
        </Box>
      </Box>

      <List sx={{ px: 2, py: 1 }}>
        {sidebarItems.map((item) => (
          <AdminSidebarItem
            key={item.href}
            item={item}
            currentPath={window.location.pathname}
          />
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <MenuItem
          sx={{
            borderRadius: 2,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'error.main',
            },
          }}
        >
          <Logout sx={{ mr: 2 }} />
          Sign Out
        </MenuItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <CssBaseline />
      
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {title}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Search */}
          <SearchContainer>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
            />
          </SearchContainer>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationOpen}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Account">
            <IconButton
              size="large"
              edge="end"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      >
        <StyledDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          {drawer}
        </StyledDrawer>
        <StyledDrawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
          }}
          open
        >
          {drawer}
        </StyledDrawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>Profile</MenuItem>
        <MenuItem>Settings</MenuItem>
        <Divider />
        <MenuItem sx={{ color: 'error.main' }}>
          <Logout sx={{ mr: 1 }} fontSize="small" />
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <MenuItem>
          <Box>
            <Typography variant="subtitle2">New order received</Typography>
            <Typography variant="body2" color="text.secondary">
              Order #1234 - $24.50
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="subtitle2">Low inventory alert</Typography>
            <Typography variant="body2" color="text.secondary">
              Coffee beans running low
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box>
            <Typography variant="subtitle2">Staff check-in</Typography>
            <Typography variant="body2" color="text.secondary">
              Sarah started her shift
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
}