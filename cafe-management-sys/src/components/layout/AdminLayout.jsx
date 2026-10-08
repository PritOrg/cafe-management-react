import React, { useMemo, useState } from 'react';
import { Outlet, useLocation, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';
import { matchAdminNav } from '../../constants/navigation';

const SPECIAL_SEGMENT = { add: 'Add', edit: 'Edit' };

const AdminLayout = () => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const railMode = isTablet && !isMobile;

  const navItem = useMemo(() => matchAdminNav(pathname), [pathname]);
  const pageTitle = navItem?.title || 'Admin Panel';

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ label: 'Admin', to: '/admin' }];
    if (navItem && navItem.href !== '/admin') crumbs.push({ label: navItem.title, to: navItem.href });
    const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
    const special = segments.find((segment) => SPECIAL_SEGMENT[segment]);
    if (special) crumbs.push({ label: SPECIAL_SEGMENT[special] });
    return crumbs;
  }, [navItem, pathname]);

  const handleDrawerToggle = () => setMobileOpen((open) => !open);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />

      <Header toggleDrawer={handleDrawerToggle} pageTitle={pageTitle} />

      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        rail={railMode}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { lg: 'calc(100% - 280px)' },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
        }}
      >
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 3 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            if (isLast) {
              return (
                <Typography key={crumb.label} color="text.primary" sx={{ fontWeight: 700 }}>
                  {crumb.label}
                </Typography>
              );
            }
            return (
              <Link
                key={crumb.label}
                component={RouterLink}
                to={crumb.to}
                underline="hover"
                color="text.secondary"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                {index === 0 && <HomeIcon fontSize="inherit" />}
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>

        <ErrorBoundary resetRoute="/admin">
          <Outlet />
        </ErrorBoundary>
      </Box>
    </Box>
  );
};

export default AdminLayout;
