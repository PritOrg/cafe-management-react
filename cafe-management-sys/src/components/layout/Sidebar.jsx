import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  Avatar,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Chip,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
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
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)' 
      : 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)',
    borderRight: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
      borderRadius: '3px',
    },
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  minHeight: 70,
  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: -100,
    width: 50,
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: 'shimmer 3s infinite linear',
    transform: 'skewX(-25deg)',
  },
  '@keyframes shimmer': {
    '0%': {
      left: -100,
    },
    '100%': {
      left: '100%',
    },
  },
  '& .MuiTypography-root': {
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  '& .logo-icon': {
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
      transform: 'rotate(10deg) scale(1.1)',
    },
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, active }) => ({
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: theme.spacing(1, 2),
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  position: 'relative',
  transition: 'all 0.2s ease-in-out',
  '&::before': active && {
    content: '""',
    position: 'absolute',
    left: -theme.spacing(1),
    top: '50%',
    transform: 'translateY(-50%)',
    height: '60%',
    width: 4,
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.shape.borderRadius,
  },
  '&:hover': {
    backgroundColor: active 
      ? alpha(theme.palette.primary.main, 0.15) 
      : alpha(theme.palette.action.hover, 0.8),
    transform: 'translateX(4px)',
  },
  '& .MuiListItemIcon-root': {
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    transition: 'transform 0.2s ease-in-out',
  },
  '&:hover .MuiListItemIcon-root': {
    transform: 'scale(1.1)',
  },
  '& .MuiListItemText-primary': {
    fontWeight: active ? 600 : 400,
    transition: 'color 0.2s ease-in-out',
  },
  '&:hover .MuiListItemText-primary': {
    color: theme.palette.primary.main,
  },
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

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login-register');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <LogoContainer>
        <Box
            className="logo-icon"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              mr: 2,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Coffee sx={{ color: 'white', fontSize: 24 }} />
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
      <Box 
        sx={{ 
          p: 3, 
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)'
            : 'linear-gradient(to bottom, rgba(0,0,0,0.02), transparent)',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -theme.spacing(3),
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(to right, ${theme.palette.divider}, transparent)`,
            },
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              border: '2px solid',
              borderColor: 'primary.light',
              boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: `0 0 0 6px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
            }}
          >
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
            {user?.lastName ? user.lastName.charAt(0).toUpperCase() : 'D'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: 0.5,
                transition: 'color 0.2s ease-in-out',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'Admin User'}
            </Typography>
            <Chip 
              label={user?.role === 'admin' ? 'Administrator' : 'Staff Member'} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ 
                height: 24,
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: alpha(theme.palette.primary.main, 0.2),
                '& .MuiChip-label': {
                  px: 1,
                  fontWeight: 500,
                },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  transform: 'translateY(-1px)',
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Navigation Items */}
      <List sx={{ px: 1, py: 2, flex: 1, overflowY: 'auto' }}>
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <StyledListItemButton
                active={isActive ? 1 : 0}
                onClick={() => navigate(item.href)}
              >
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.title} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
                {item.badge && (
                  <Badge 
                    badgeContent={item.badge} 
                    color={item.title === 'Orders' ? 'error' : 'warning'}
                    sx={{ '& .MuiBadge-badge': { fontWeight: 600 } }}
                  />
                )}
              </StyledListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      {/* Logout Button */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: theme.palette.error.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.error.main }}>
            <Logout />
          </ListItemIcon>
          <ListItemText 
            primary="Sign Out" 
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
    >
      {/* Mobile drawer */}
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
      
      {/* Desktop drawer */}
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
  );
};

export default Sidebar;