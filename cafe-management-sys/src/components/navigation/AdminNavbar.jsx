import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: theme.spacing(1),
    minWidth: 200,
    boxShadow: theme.shadows[8],
    border: `1px solid ${theme.palette.divider}`,
  },
}));

const AdminNavbar = ({ onMenuClick, title = 'Admin Dashboard' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationAnchor, setNotificationAnchor] = React.useState(null);

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

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login-register');
  };

  const handleSettings = () => {
    handleProfileMenuClose();
    navigate('/admin/settings');
  };

  const handleDashboard = () => {
    handleProfileMenuClose();
    navigate('/admin/dashboard');
  };

  return (
    <StyledAppBar position="fixed" elevation={0}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <IconButton
            size="large"
            aria-label="show notifications"
            color="inherit"
            onClick={handleNotificationOpen}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Profile */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <StyledMenu
          anchorEl={anchorEl}
          id="profile-menu"
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name || 'Admin User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'admin@cafe.com'}
            </Typography>
          </Box>
          
          <MenuItem onClick={handleDashboard} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </MenuItem>
          
          <MenuItem onClick={handleSettings} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </StyledMenu>

        {/* Notifications Menu */}
        <StyledMenu
          anchorEl={notificationAnchor}
          id="notifications-menu"
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
          </Box>
          
          <MenuItem sx={{ py: 2, maxWidth: 300 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                New Order #1234
              </Typography>
              <Typography variant="caption" color="text.secondary">
                A new order has been placed
              </Typography>
            </Box>
          </MenuItem>
          
          <MenuItem sx={{ py: 2, maxWidth: 300 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Low Stock Alert
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Coffee beans are running low
              </Typography>
            </Box>
          </MenuItem>
          
          <Divider />
          
          <Box sx={{ p: 1.5, textAlign: 'center' }}>
            <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
              View all notifications
            </Typography>
          </Box>
        </StyledMenu>
      </Toolbar>
    </StyledAppBar>
  );
};

export default AdminNavbar;
