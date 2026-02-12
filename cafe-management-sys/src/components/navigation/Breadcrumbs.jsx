import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Typography,
  Link,
  Box,
  Chip,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const StyledBreadcrumbs = styled(MuiBreadcrumbs)(({ theme }) => ({
  padding: theme.spacing(2, 0),
  
  '& .MuiBreadcrumbs-li': {
    display: 'flex',
    alignItems: 'center',
  },
  
  '& .MuiBreadcrumbs-separator': {
    margin: theme.spacing(0, 1),
    color: theme.palette.text.disabled,
  },
}));

const BreadcrumbLink = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
  
  '&:hover': {
    color: theme.palette.primary.main,
    textDecoration: 'underline',
  },
}));

const CurrentPage = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
  fontWeight: 600,
}));

// Route configuration for breadcrumbs
const routeConfig = {
  '/': { label: 'Home', icon: HomeIcon },
  '/admin': { label: 'Admin', icon: DashboardIcon },
  '/admin/dashboard': { label: 'Dashboard', icon: DashboardIcon },
  '/admin/orders': { label: 'Orders' },
  '/admin/menu': { label: 'Menu Management' },
  '/admin/menu/add': { label: 'Add Menu Item' },
  '/admin/menu/edit': { label: 'Edit Menu Item' },
  '/admin/staff': { label: 'Staff Management' },
  '/admin/revenue': { label: 'Revenue' },
  '/admin/inventory': { label: 'Inventory' },
  '/admin/analytics': { label: 'Analytics' },
  '/admin/settings': { label: 'Settings' },
  '/menu': { label: 'Menu' },
  '/cart': { label: 'Cart' },
  '/login-register': { label: 'Login' },
};

const Breadcrumbs = ({ 
  customItems = [], 
  showHome = true, 
  maxItems = 8,
  sx = {},
  ...props 
}) => {
  const location = useLocation();
  
  const generateBreadcrumbs = () => {
    // If custom items are provided, use them
    if (customItems.length > 0) {
      return customItems;
    }
    
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs = [];
    
    // Add home if requested
    if (showHome && location.pathname !== '/') {
      breadcrumbs.push({
        label: 'Home',
        path: '/',
        icon: HomeIcon,
      });
    }
    
    // Generate breadcrumbs from current path
    let currentPath = '';
    pathnames.forEach((pathname, index) => {
      currentPath += `/${pathname}`;
      const config = routeConfig[currentPath];
      const isLast = index === pathnames.length - 1;
      
      breadcrumbs.push({
        label: config?.label || pathname.charAt(0).toUpperCase() + pathname.slice(1),
        path: currentPath,
        icon: config?.icon,
        isLast,
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Box sx={{ ...sx }}>
      <StyledBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        maxItems={maxItems}
        aria-label="breadcrumb"
        {...props}
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const IconComponent = breadcrumb.icon;

          if (isLast) {
            return (
              <CurrentPage key={breadcrumb.path}>
                {IconComponent && <IconComponent fontSize="small" />}
                {breadcrumb.label}
              </CurrentPage>
            );
          }

          return (
            <BreadcrumbLink
              key={breadcrumb.path}
              component={RouterLink}
              to={breadcrumb.path}
            >
              {IconComponent && <IconComponent fontSize="small" />}
              {breadcrumb.label}
            </BreadcrumbLink>
          );
        })}
      </StyledBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
