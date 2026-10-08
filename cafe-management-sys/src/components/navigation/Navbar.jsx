import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import InputBase from '@mui/material/InputBase';
import { styled, alpha } from '@mui/material/styles';

import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LoginIcon from '@mui/icons-material/Login';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';

import CartContext from '../CartContext';
import { useBrand } from '../../contexts/BrandContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomer } from '../../contexts/CustomerContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { CUSTOMER_TEXT_NAV } from '../../constants/navigation';
import { prefetchMenu } from '../../hooks/useMenuData';

// Loaded only when the guest taps "Sign in" — keeps Dialog/TextField off the
// initial bundle.
const CustomerSignInDialog = React.lazy(() => import('../common/CustomerSignInDialog'));

const SearchForm = styled('form')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  flex: 1,
  maxWidth: 420,
  ml: 3,
  px: 2,
  py: 0.5,
  borderRadius: 999,
  backgroundColor: theme.palette.action.hover,
  transition: theme.transitions.create(['background-color', 'box-shadow']),
  '&:focus-within': {
    backgroundColor: alpha(theme.palette.text.primary, 0.09),
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const NavButton = styled(Button, { shouldForwardProp: (prop) => prop !== 'active' })(
  ({ theme, active }) => ({
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    fontWeight: active ? 700 : 500,
    px: 1.5,
    minWidth: 0,
    borderRadius: 999,
    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
  })
);

const BrandLink = styled(RouterLink)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textDecoration: 'none',
  color: 'inherit',
  minWidth: 0,
});

const Navbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { brand } = useBrand();
  const { isAuthenticated, user, isStaff, logout } = useAuth();
  const { phone, name: customerName, tableNumber, isKnown, clearCustomer, setTable } = useCustomer();
  const { isDarkMode, toggleMode } = useThemeContext();
  const { cartCount = 0 } = useContext(CartContext) || {};

  const [query, setQuery] = useState('');
  const [mobileSearch, setMobileSearch] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [signInOpen, setSignInOpen] = useState(false);

  const brandTitle = brand?.title || 'Restaurant';

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Table QR: any `?table=` in the URL becomes the guest's table.
  useEffect(() => {
    const table = searchParams.get('table');
    if (table) setTable(table);
  }, [searchParams, setTable]);

  const submitSearch = useCallback((event) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/menu?q=${encodeURIComponent(q)}` : '/menu');
    setMobileSearch(false);
  }, [navigate, query]);

  const onSearchIntent = useCallback(() => { prefetchMenu().catch(() => {}); }, []);

  const handleAccount = useCallback((event) => {
    if (isAuthenticated || isKnown) setAccountAnchor(event.currentTarget);
    else setSignInOpen(true);
  }, [isAuthenticated, isKnown]);

  const handleAccountClose = useCallback(() => setAccountAnchor(null), []);

  const handleStaffLogout = useCallback(() => {
    setAccountAnchor(null);
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleCustomerSignOut = useCallback(() => {
    setAccountAnchor(null);
    clearCustomer();
  }, [clearCustomer]);

  const initial = useMemo(() => {
    const source = isAuthenticated ? (user?.firstName || user?.email || 'A') : (customerName || phone || 'G');
    return String(source).charAt(0).toUpperCase();
  }, [isAuthenticated, user, customerName, phone]);

  const searchField = (
    <SearchForm onSubmit={submitSearch} role="search">
      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      <InputBase
        placeholder="Search the menu…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={onSearchIntent}
        inputProps={{ 'aria-label': 'Search menu', enterKeyHint: 'search' }}
        sx={{ flex: 1, fontSize: '0.95rem' }}
      />
      {mobileSearch && (
        <IconButton size="small" aria-label="Close search" onClick={() => setMobileSearch(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </SearchForm>
  );

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ gap: { xs: 0.5, md: 1 }, minHeight: { xs: 60, md: 64 } }}>
        {mobileSearch ? (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>{searchField}</Box>
        ) : (
          <>
            <BrandLink to="/" aria-label={`${brandTitle} home`}>
              <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 34, md: 38 }, height: { xs: 34, md: 38 } }}>
                <StorefrontIcon fontSize="small" />
              </Avatar>
              <Typography variant="h6" noWrap sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.05rem', md: '1.25rem' } }}>
                {brandTitle}
              </Typography>
            </BrandLink>

            <Box component="nav" sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 2, gap: 0.5 }}>
              {CUSTOMER_TEXT_NAV.map((item) => (
                <NavButton
                  key={item.key}
                  component={RouterLink}
                  to={item.href}
                  active={item.match(pathname) ? 1 : 0}
                  onMouseEnter={item.key === 'menu' ? onSearchIntent : undefined}
                >
                  {item.label}
                </NavButton>
              ))}
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {tableNumber && (
              <Chip
                icon={<TableRestaurantIcon />}
                label={`Table ${tableNumber}`}
                size="small"
                sx={{ display: { xs: 'none', sm: 'flex' }, mr: 0.5 }}
              />
            )}

            <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, justifyContent: 'flex-end' }}>
              {searchField}
            </Box>

            <Tooltip title="Search">
              <IconButton onClick={() => setMobileSearch(true)} aria-label="Open search" sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
                <SearchIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title={isDarkMode ? 'Light mode' : 'Dark mode'}>
              <IconButton onClick={toggleMode} aria-label="Toggle color theme">
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Cart">
              <IconButton component={RouterLink} to="/cart" aria-label={`Cart, ${cartCount} items`} onMouseEnter={onSearchIntent}>
                <Badge badgeContent={cartCount} color="primary" max={99} overlap="circular">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={isAuthenticated || isKnown ? 'Account' : 'Sign in'}>
              <IconButton onClick={handleAccount} aria-label="Account" edge="end">
                {isAuthenticated || isKnown ? (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                    {initial}
                  </Avatar>
                ) : (
                  <LoginIcon />
                )}
              </IconButton>
            </Tooltip>
          </>
        )}
      </Toolbar>

      <Menu
        anchorEl={accountAnchor}
        open={Boolean(accountAnchor)}
        onClose={handleAccountClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { minWidth: 240, mt: 1, borderRadius: 3 } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
            {isAuthenticated
              ? (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'Account')
              : (customerName || 'Guest')}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {isAuthenticated ? (user?.role === 'admin' ? 'Administrator' : 'Staff') : phone}
          </Typography>
        </Box>
        <Divider />
        {isAuthenticated && isStaff() && (
          <MenuItem component={RouterLink} to="/admin" onClick={handleAccountClose}>
            <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
        )}
        <MenuItem component={RouterLink} to="/orders" onClick={handleAccountClose}>
          <ListItemIcon><ReceiptLongIcon fontSize="small" /></ListItemIcon>
          <ListItemText>My Orders</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={isAuthenticated ? handleStaffLogout : handleCustomerSignOut}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{isAuthenticated ? 'Sign out' : 'Sign out'}</ListItemText>
        </MenuItem>
      </Menu>

      {signInOpen && (
        <React.Suspense fallback={null}>
          <CustomerSignInDialog open onClose={() => setSignInOpen(false)} />
        </React.Suspense>
      )}
    </AppBar>
  );
};

export default memo(Navbar);
