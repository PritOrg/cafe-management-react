import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Paper,
  Avatar,
  IconButton,
  LinearProgress,
  Fade,
  Grow,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  AttachMoney,
  Inventory,
  Add,
  Coffee,
  PersonAdd,
  BarChart,
  Schedule,
  Warning,
  CheckCircle,
  Info,
  MoreVert,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AdminLayout from '../../components/layout/AdminLayout';
import { analyticsAPI, ordersAPI, menuAPI } from '../../services/api';

// Styled components for enhanced UI
const StatsCard = styled(Card)(({ theme, color = 'primary' }) => ({
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
  
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 24px ${alpha(theme.palette[color].main, 0.15)}`,
    
    '& .stats-icon': {
      transform: 'scale(1.1) rotate(5deg)',
    },
  },
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
    borderRadius: '4px 4px 0 0',
  },
}));

const IconContainer = styled(Box)(({ theme, color = 'primary' }) => ({
  width: 60,
  height: 60,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)}, ${alpha(theme.palette[color].main, 0.05)})`,
  transition: 'all 0.3s ease',
}));

const QuickActionCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: `1px solid ${theme.palette.divider}`,
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.main,
  },
}));

const AlertCard = styled(Paper)(({ theme, severity = 'info' }) => {
  const colors = {
    error: theme.palette.error,
    warning: theme.palette.warning,
    info: theme.palette.info,
    success: theme.palette.success,
  };
  
  return {
    padding: theme.spacing(2),
    border: `1px solid ${alpha(colors[severity].main, 0.2)}`,
    backgroundColor: alpha(colors[severity].main, 0.05),
    borderRadius: 12,
    transition: 'all 0.2s ease',
    
    '&:hover': {
      backgroundColor: alpha(colors[severity].main, 0.1),
      transform: 'translateX(4px)',
    },
  };
});

// Mock data
const statsData = [
  {
    title: 'Total Revenue',
    value: '$12,426',
    change: '+12.5%',
    trend: 'up',
    icon: AttachMoney,
    color: 'success',
    subtitle: 'vs last month',
  },
  {
    title: 'Orders Today',
    value: '147',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'primary',
    subtitle: '12 pending',
  },
  {
    title: 'Menu Items',
    value: '42',
    change: '+3 new',
    trend: 'up',
    icon: Coffee,
    color: 'info',
    subtitle: 'active items',
  },
  {
    title: 'Inventory Items',
    value: '156',
    change: '3 low stock',
    trend: 'warning',
    icon: Inventory,
    color: 'error',
    subtitle: 'needs attention',
  },
];

const quickActions = [
  { title: 'Add Menu Item', icon: Coffee, color: 'primary' },
  { title: 'Process Orders', icon: ShoppingCart, color: 'secondary' },
  { title: 'View Reports', icon: BarChart, color: 'info' },
  { title: 'Manage Inventory', icon: Inventory, color: 'warning' },
];

const alerts = [
  {
    id: 1,
    title: 'Low Stock Alert',
    message: 'Coffee beans running low (5 lbs left)',
    severity: 'error',
    time: '5 min ago',
    action: 'Reorder',
  },
  {
    id: 2,
    title: 'New Orders',
    message: '3 new orders waiting for confirmation',
    severity: 'warning',
    time: '10 min ago',
    action: 'View Orders',
  },
  {
    id: 3,
    title: 'Equipment Maintenance',
    message: 'Espresso machine maintenance scheduled',
    severity: 'info',
    time: '1 hour ago',
    action: 'Schedule',
  },
];



export default function AdminDashboard() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, ordersResponse] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        ordersAPI.getRecent(5),
      ]);

      setDashboardData(stats);
      // Handle different response formats
      const orders = ordersResponse?.data || ordersResponse || [];
      setRecentOrders(Array.isArray(orders) ? orders : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty data on error
      setDashboardData({
        totalRevenue: 0,
        ordersToday: 0,
        menuItems: 0,
        pendingOrders: 0,
        revenueChange: 0,
        ordersChange: 0,
      });
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'preparing': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return <Warning color="error" />;
      case 'warning': return <Info color="warning" />;
      case 'info': return <CheckCircle color="info" />;
      default: return <Info />;
    }
  };

  if (loading) {
    return (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
    );
  }

  return (
      <Box sx={{ flexGrow: 1 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {(dashboardData ? [
            {
              title: 'Today\'s Revenue',
              value: `₹${dashboardData.totalRevenue?.toLocaleString() || '0'}`,
              change: `${dashboardData.revenueChange >= 0 ? '+' : ''}${dashboardData.revenueChange || 0}%`,
              trend: dashboardData.revenueChange >= 0 ? 'up' : 'down',
              icon: AttachMoney,
              color: 'success',
              subtitle: 'vs yesterday'
            },
            {
              title: 'Orders Today',
              value: dashboardData.ordersToday?.toLocaleString() || '0',
              change: `${dashboardData.pendingOrders || 0} pending`,
              trend: 'up',
              icon: ShoppingCart,
              color: 'primary',
              subtitle: 'total orders'
            },
            {
              title: 'Menu Items',
              value: dashboardData.menuItems?.toLocaleString() || '0',
              change: 'Active items',
              trend: 'up',
              icon: Coffee,
              color: 'info',
              subtitle: 'available'
            },
            {
              title: 'Pending Orders',
              value: dashboardData.pendingOrders?.toLocaleString() || '0',
              change: dashboardData.pendingOrders > 0 ? 'Need attention' : 'All clear',
              trend: dashboardData.pendingOrders > 0 ? 'warning' : 'up',
              icon: Schedule,
              color: dashboardData.pendingOrders > 0 ? 'warning' : 'success',
              subtitle: 'awaiting preparation'
            }
          ] : statsData).map((stat, index) => (
            <Grid item xs={12} sm={6} lg={3} key={stat.title}>
              <Grow in={!loading} timeout={500 + index * 100}>
                <div>
                  <StatsCard color={stat.color}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {stat.title}
                          </Typography>
                          <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                            {stat.value}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={stat.change}
                              size="small"
                              color={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'error' : 'warning'}
                              icon={stat.trend === 'up' ? <TrendingUp /> : stat.trend === 'down' ? <TrendingDown /> : <Warning />}
                              sx={{ fontSize: '0.75rem' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {stat.subtitle}
                            </Typography>
                          </Box>
                        </Box>
                        <IconContainer color={stat.color}>
                          <stat.icon 
                            className="stats-icon"
                            sx={{ 
                              fontSize: 28, 
                              color: `${stat.color}.main`,
                              transition: 'all 0.3s ease',
                            }} 
                          />
                        </IconContainer>
                      </Box>
                    </CardContent>
                  </StatsCard>
                </div>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Recent Orders */}
          <Grid item xs={12} lg={8}>
            <Fade in={!loading} timeout={800}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Recent Orders
                    </Typography>
                    <Button variant="outlined" size="small" color="primary">
                      View All
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(recentOrders.length > 0 ? recentOrders : [
                      { _id: '1', orderNumber: '#1234', customer: { name: 'John Doe' }, items: [{ name: 'Latte' }, { name: 'Croissant' }], total: 12.50, status: 'completed', createdAt: new Date(Date.now() - 120000).toISOString() },
                      { _id: '2', orderNumber: '#1235', customer: { name: 'Jane Smith' }, items: [{ name: 'Cappuccino' }, { name: 'Muffin' }], total: 8.75, status: 'preparing', createdAt: new Date(Date.now() - 300000).toISOString() },
                    ]).map((order, index) => (
                      <Grow in={!loading} timeout={1000 + index * 100} key={order._id || order.id}>
                        <Paper
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: 'primary.main',
                              transform: 'translateY(-1px)',
                              boxShadow: 2,
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Order #{order._id?.slice(-6) || order.orderNumber || order.id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {order.items?.map(item =>
                                  item.menuItem?.title || item.name || item
                                ).join(', ') || 'No items'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.placedAt || order.createdAt ?
                                  `${Math.floor((Date.now() - new Date(order.placedAt || order.createdAt).getTime()) / 60000)} min ago` :
                                  'Just now'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                ₹{(order.totalAmount || order.total || 0).toFixed(2)}
                              </Typography>
                              <Chip
                                label={order.status}
                                size="small"
                                color={getStatusColor(order.status)}
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </Box>
                          </Box>
                        </Paper>
                      </Grow>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Quick Actions & Alerts */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
              {/* Quick Actions */}
              <Fade in={!loading} timeout={1000}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Add sx={{ mr: 1 }} />
                      Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                      {quickActions.map((action, index) => (
                        <Grid item xs={6} key={action.title}>
                          <Grow in={!loading} timeout={1200 + index * 100}>
                            <div>
                              <QuickActionCard sx={{ textAlign: 'center', p: 2 }}>
                                <IconContainer color={action.color} sx={{ width: 48, height: 48, mx: 'auto', mb: 1 }}>
                                  <action.icon />
                                </IconContainer>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {action.title}
                                </Typography>
                              </QuickActionCard>
                            </div>
                          </Grow>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>

              {/* Alerts */}
              <Fade in={!loading} timeout={1400}>
                <Card sx={{ flex: 1 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Warning sx={{ mr: 1, color: 'warning.main' }} />
                      Alerts
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {alerts.map((alert, index) => (
                        <Grow in={!loading} timeout={1600 + index * 100} key={alert.id}>
                          <AlertCard severity={alert.severity}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
                                {getSeverityIcon(alert.severity)}
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {alert.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {alert.message}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {alert.time}
                                  </Typography>
                                </Box>
                              </Box>
                              <Button size="small" variant="outlined">
                                {alert.action}
                              </Button>
                            </Box>
                          </AlertCard>
                        </Grow>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Box>
          </Grid>
        </Grid>
      </Box>
  );
}