import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  useTheme,
  useMediaQuery,
  Paper,
  Breadcrumbs,
  Link,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';

const AdminLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap = {
      '/admin': 'Dashboard',
      '/admin/dashboard': 'Dashboard',
      '/admin/orders': 'Orders Management',
      '/admin/menu': 'Menu Management',
      '/admin/menu/add': 'Add Menu Item',
      '/admin/staff': 'Staff Management',
      '/admin/revenue': 'Revenue Analytics',
      '/admin/inventory': 'Inventory Management',
      '/admin/analytics': 'Analytics & Reports',
      '/admin/settings': 'Settings'
    };
    return titleMap[path] || 'Admin Panel';
  };

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const path = location.pathname;
    const pathSegments = path.split('/').filter(segment => segment);
    
    const breadcrumbs = [];
    let currentPath = '';
    
    // Add Home breadcrumb
    breadcrumbs.push({
      label: 'Home',
      path: '/admin',
      icon: <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
    });
    
    // Add other breadcrumbs based on path segments
    pathSegments.forEach((segment, index) => {
      if (index === 0 && segment === 'admin') return; // Skip the first 'admin' segment
      
      currentPath += `/${segment}`;
      const formattedLabel = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        label: formattedLabel,
        path: index === pathSegments.length - 1 ? null : currentPath // Last item is not clickable
      });
    });
    
    return breadcrumbs;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, you would also update your theme context here
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        bgcolor: theme.palette.background.default,
        transition: theme.transitions.create('background-color', {
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      <CssBaseline />
      
      {/* Header */}
      <Header 
        toggleDrawer={handleDrawerToggle}
        pageTitle={getPageTitle()}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      
      {/* Sidebar */}
      <Sidebar 
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { lg: `calc(100% - 280px)` },
          mt: '70px',
          minHeight: 'calc(100vh - 70px)',
          bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          overflow: 'hidden',
        }}
      >
        {/* Breadcrumbs */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            mb: 3, 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
            border: `1px solid ${theme.palette.divider}`,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
            },
          }}
        >
          <Breadcrumbs 
            separator={
              <NavigateNextIcon 
                fontSize="small" 
                sx={{ 
                  color: 'text.secondary',
                  transition: 'transform 0.2s ease-in-out',
                  transform: 'scale(0.8)',
                }} 
              />
            } 
            aria-label="breadcrumb"
            sx={{
              '& .MuiBreadcrumbs-ol': {
                alignItems: 'center',
              },
              '& .MuiBreadcrumbs-li': {
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
              },
            }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              
              return isLast ? (
                <Typography 
                  key={index} 
                  color="text.primary" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontWeight: 600
                  }}
                >
                  {crumb.icon}
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  key={index}
                  underline="none"
                  color="inherit"
                  href={crumb.path}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: 'text.secondary',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: 'primary.main',
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateY(-1px)',
                    },
                    '& .MuiSvgIcon-root': {
                      transition: 'transform 0.2s ease-in-out',
                    },
                    '&:hover .MuiSvgIcon-root': {
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  {crumb.icon}
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Paper>
        
        {/* Page content with error boundary */}
        <ErrorBoundary resetRoute="/admin">
          <Outlet />
        </ErrorBoundary>
      </Box>
    </Box>
  );
};

export default AdminLayout;