import React, { useCallback, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';

const DRAWER_WIDTH = 280;

const Header = ({ toggleDrawer, pageTitle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleMode } = useThemeContext();
  const [anchorEl, setAnchorEl] = useState(null);

  const openProfile = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const closeProfile = useCallback(() => setAnchorEl(null), []);

  const handleLogout = useCallback(() => {
    setAnchorEl(null);
    logout();
    navigate('/login-register');
  }, [logout, navigate]);

  const initial = (user?.firstName || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { lg: `${DRAWER_WIDTH}px` },
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: { xs: 60, md: 64 } }}>
        <IconButton
          color="inherit"
          aria-label="Open navigation"
          edge="start"
          onClick={toggleDrawer}
          sx={{ display: { lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="h1"
          sx={{ fontWeight: 700, color: 'text.primary', flexShrink: 1 }}
        >
          {pageTitle}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title={isDarkMode ? 'Light mode' : 'Dark mode'}>
          <IconButton color="inherit" onClick={toggleMode} aria-label="Toggle color theme">
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Storefront">
          <IconButton color="inherit" component={RouterLink} to="/" aria-label="View storefront">
            <StorefrontIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Account">
          <IconButton
            color="inherit"
            edge="end"
            onClick={openProfile}
            aria-label="Account menu"
            aria-haspopup="menu"
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.95rem' }}>
              {initial}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeProfile}
        onClick={closeProfile}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { minWidth: 240, mt: 1, borderRadius: 2 } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.email || 'Admin User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.email || ''}
          </Typography>
        </Box>
        <Divider />
        <MenuItem component={RouterLink} to="/admin/settings">
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem component={RouterLink} to="/">
          <ListItemIcon><StorefrontIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View storefront</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default React.memo(Header);
