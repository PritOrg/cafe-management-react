import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Box,
  Avatar,
  Tooltip,
  InputBase,
  useTheme,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Help as HelpIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 280;

// Styled components for better UX
const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 3,
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
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  boxShadow: `0 2px 5px ${alpha(theme.palette.common.black, 0.05)}`,
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
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 1, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '30ch',
    },
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
  '& .MuiIconButton-root': {
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'scale(1.1)',
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
    },
  },
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: theme.shape.borderRadius * 2,
    marginTop: theme.spacing(1),
    minWidth: 250,
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(8px)',
    boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
    border: `1px solid ${theme.palette.divider}`,
  },
  '& .MuiMenuItem-root': {
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(0.5),
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
      transform: 'translateX(4px)',
    },
    '& .MuiListItemIcon-root': {
      minWidth: 36,
      color: theme.palette.text.secondary,
    },
  },
}));

const Header = ({ 
  toggleDrawer, 
  pageTitle, 
  isDarkMode, 
  toggleTheme 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  
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
    try {
      await logout();
      navigate('/login-register');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleProfileMenuClose();
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(['width', 'margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ display: 'flex', alignItems: 'center', height: 70 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h5" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #82B1FF 30%, #2979FF 90%)'
                : 'linear-gradient(45deg, #1976D2 30%, #2196F3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {pageTitle}
            {pageTitle === 'Orders Management' && (
              <Chip 
                label="12 New" 
                size="small" 
                color="error" 
                sx={{ height: 24, fontWeight: 600 }} 
              />
            )}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Search */}
          <SearchContainer
            sx={{
              transition: 'all 0.3s ease',
              '&:focus-within': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
              }
            }}
          >
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
            />
          </SearchContainer>

          {/* Theme Toggle */}
          <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton 
              color="inherit" 
              onClick={toggleTheme}
              sx={{ ml: 1 }}
            >
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationOpen}
              sx={{ ml: 1 }}
            >
              <StyledBadge badgeContent={3} color="error">
                <NotificationsIcon />
              </StyledBadge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Account settings">
            <IconButton
              size="large"
              edge="end"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: 'primary.main',
                  border: '2px solid',
                  borderColor: 'primary.light',
                }}
              >
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <StyledMenu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            width: 250,
            borderRadius: 2,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.email || 'Admin User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'admin@example.com'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem sx={{ py: 1.5 }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="My Profile" />
        </MenuItem>
        <MenuItem sx={{ py: 1.5 }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <MenuItem sx={{ py: 1.5 }}>
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Help & Support" />
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
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            width: 320,
            maxHeight: 400,
            borderRadius: 2,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Notifications</Typography>
          <Chip label="3 new" size="small" color="primary" />
        </Box>
        
        <MenuItem sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'error.main', width: 36, height: 36 }}>N</Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>New order received</Typography>
              <Typography variant="body2" color="text.secondary">
                Order #1234 - $24.50
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                2 minutes ago
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        
        <MenuItem sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'warning.main', width: 36, height: 36 }}>I</Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Low inventory alert</Typography>
              <Typography variant="body2" color="text.secondary">
                Coffee beans running low
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                1 hour ago
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        
        <MenuItem sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'info.main', width: 36, height: 36 }}>S</Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Staff check-in</Typography>
              <Typography variant="body2" color="text.secondary">
                Sarah started her shift
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                3 hours ago
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        
        <Divider />
        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            color="primary" 
            sx={{ 
              cursor: 'pointer', 
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline' } 
            }}
          >
            View all notifications
          </Typography>
        </Box>
      </StyledMenu>
    </>
  );
};

export default Header;