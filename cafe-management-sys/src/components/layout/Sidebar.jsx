import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { styled, alpha } from '@mui/material/styles';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CloseIcon from '@mui/icons-material/Close';
import Logout from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContext';
import { useBrand } from '../../contexts/BrandContext';
import { adminNavItems, isAdminNavActive } from '../../constants/navigation';
import { inventoryAPI, unwrap } from '../../services/api';

const DRAWER_WIDTH = 280;
const RAIL_WIDTH = 72;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, #f1f3f6 100%)',
    borderRight: `1px solid ${theme.palette.divider}`,
    overflowX: 'hidden',
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  minHeight: 70,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: '#fff',
  '& .MuiTypography-root': { textShadow: '0 2px 4px rgba(0,0,0,0.2)' },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, active }) => ({
  margin: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1, 2),
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  '&:hover': {
    backgroundColor: active
      ? alpha(theme.palette.primary.main, 0.15)
      : theme.palette.action.hover,
  },
  '& .MuiListItemIcon-root': {
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    minWidth: 40,
  },
  '& .MuiListItemText-primary': { fontWeight: active ? 700 : 500 },
}));

const useLowStockCount = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    inventoryAPI
      .list({ lowStock: 'true' })
      .then((body) => {
        if (cancelled) return;
        const data = unwrap(body) || {};
        setCount((data.items || []).length);
      })
      .catch(() => { if (!cancelled) setCount(0); });
    return () => { cancelled = true; };
  }, []);
  return count;
};

const Sidebar = ({ mobileOpen, handleDrawerToggle, rail = false }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout, isPlatformAdmin } = useAuth();
  const { brand } = useBrand();
  const lowStockCount = useLowStockCount();

  const items = useMemo(() => adminNavItems(isPlatformAdmin()), [isPlatformAdmin, user]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login-register');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <StorefrontIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
            {brand?.title || 'Restaurant'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Admin Panel
          </Typography>
        </Box>
      </LogoContainer>

      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main' }}>
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'Admin User'}
            </Typography>
            <Chip
              label={user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 22, mt: 0.5 }}
            />
          </Box>
        </Box>
      </Box>

      <List sx={{ px: 1, py: 1.5, flex: 1, overflowY: 'auto' }}>
        {items.map((item) => {
          const active = isAdminNavActive(item, pathname);
          const Icon = item.icon;
          const badge = item.badge === 'lowStock' && lowStockCount > 0 ? String(lowStockCount) : null;
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.25 }}>
              <StyledListItemButton active={active ? 1 : 0} onClick={() => navigate(item.href)}>
                <ListItemIcon><Icon /></ListItemIcon>
                <ListItemText primary={item.title} />
                {badge && <Badge badgeContent={badge} color="warning" />}
              </StyledListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: 'error.main',
            '&:hover': { backgroundColor: alpha('#f44336', 0.1) },
          }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}><Logout /></ListItemIcon>
          <ListItemText primary="Sign Out" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { lg: rail ? RAIL_WIDTH : DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
      {rail && (
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block', lg: 'none' },
            width: RAIL_WIDTH,
            '& .MuiDrawer-paper': { width: RAIL_WIDTH, overflowX: 'hidden', borderRight: '1px solid', borderColor: 'divider' },
          }}
        >
          <List sx={{ pt: 9 }}>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  selected={isAdminNavActive(item, pathname)}
                  aria-label={item.title}
                  sx={{ justifyContent: 'center', minHeight: 48, mx: 1, borderRadius: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}><Icon /></ListItemIcon>
                </ListItemButton>
              );
            })}
          </List>
        </Drawer>
      )}

      <StyledDrawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', lg: 'none' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={handleDrawerToggle} aria-label="Close menu">
            <CloseIcon />
          </IconButton>
        </Box>
        {drawer}
      </StyledDrawer>

      <StyledDrawer variant="permanent" open sx={{ display: { xs: 'none', lg: 'block' } }}>
        {drawer}
      </StyledDrawer>
    </Box>
  );
};

export default React.memo(Sidebar);
