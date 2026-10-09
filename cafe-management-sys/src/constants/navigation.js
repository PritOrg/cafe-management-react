import HomeIcon from '@mui/icons-material/Home';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';

const prefixMatcher = (base) => (path) => path === base || path.startsWith(`${base}/`);

/**
 * Public storefront navigation — single source of truth for the top bar links
 * and the mobile bottom navigation. Keep this list in sync with App.jsx routes.
 */
export const CUSTOMER_NAV = [
  { key: 'home', label: 'Home', href: '/', icon: HomeIcon, match: (p) => p === '/', bottom: true },
  { key: 'menu', label: 'Menu', href: '/menu', icon: RestaurantMenuIcon, match: prefixMatcher('/menu'), bottom: true },
  { key: 'orders', label: 'My Orders', href: '/orders', icon: ReceiptLongIcon, match: prefixMatcher('/orders'), bottom: true },
  { key: 'cart', label: 'Cart', href: '/cart', icon: ShoppingCartIcon, match: prefixMatcher('/cart'), bottom: true, badge: 'cart' },
];

export const CUSTOMER_TEXT_NAV = CUSTOMER_NAV.filter((item) => item.key !== 'cart');
export const CUSTOMER_BOTTOM_NAV = CUSTOMER_NAV.filter((item) => item.bottom);

/**
 * Admin sidebar navigation. `exact` items highlight only on an exact path;
 * the rest match on path prefix (so /admin/menu/add keeps "Menu Items" active).
 */
export const ADMIN_NAV = [
  { title: 'Dashboard', href: '/admin', icon: DashboardIcon, exact: true },
  { title: 'Take Order', href: '/admin/order', icon: PointOfSaleIcon },
  { title: 'Orders', href: '/admin/orders', icon: ShoppingCartIcon },
  { title: 'Kitchen', href: '/admin/kitchen', icon: LocalDiningIcon },
  { title: 'Menu Items', href: '/admin/menu', icon: RestaurantIcon },
  { title: 'Inventory', href: '/admin/inventory', icon: InventoryIcon, badge: 'lowStock' },
  { title: 'Customers', href: '/admin/customers', icon: PeopleAltIcon },
  { title: 'Staff', href: '/admin/staff', icon: PeopleIcon },
  { title: 'Revenue', href: '/admin/revenue', icon: AttachMoneyIcon },
  { title: 'Analytics', href: '/admin/analytics', icon: AnalyticsIcon },
  { title: 'Invoices', href: '/admin/invoices', icon: ReceiptLongIcon },
  { title: 'Activity', href: '/admin/activity', icon: HistoryIcon },
  { title: 'Settings', href: '/admin/settings', icon: SettingsIcon },
];

export const ADMIN_PLATFORM_ITEM = {
  title: 'Tenants',
  href: '/admin/tenants',
  icon: BusinessIcon,
  platformOnly: true,
};

export const adminNavItems = (isPlatformAdmin = false) =>
  isPlatformAdmin ? [...ADMIN_NAV, ADMIN_PLATFORM_ITEM] : ADMIN_NAV;

export const isAdminNavActive = (item, path) =>
  item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);

/** Resolve the nav item that owns the current admin path (title + breadcrumb). */
export const matchAdminNav = (path) =>
  [...ADMIN_NAV, ADMIN_PLATFORM_ITEM].find((item) => isAdminNavActive(item, path)) || null;
