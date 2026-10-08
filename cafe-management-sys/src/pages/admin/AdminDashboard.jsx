import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, Chip, Paper, LinearProgress, Fade, Grow, alpha, Alert } from '@mui/material';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Inventory from '@mui/icons-material/Inventory';
import Add from '@mui/icons-material/Add';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChart from '@mui/icons-material/BarChart';
import Schedule from '@mui/icons-material/Schedule';
import Warning from '@mui/icons-material/Warning';
import CheckCircle from '@mui/icons-material/CheckCircle';

import { styled } from '@mui/material/styles';

import { analyticsAPI, ordersAPI, inventoryAPI, unwrap } from '../../services/api';
import { formatMoney } from '../../utils/formatMoney';
import { adaptOrder } from '../../adapters';

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

const quickActions = [
  { title: 'Add Menu Item', icon: RestaurantMenuIcon, color: 'primary' },
  { title: 'Process Orders', icon: ShoppingCart, color: 'secondary' },
  { title: 'View Reports', icon: BarChart, color: 'info' },
  { title: 'Manage Inventory', icon: Inventory, color: 'warning' },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [, setLastUpdated] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryBody, topBody, ordersResponse, lowBody] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getTopItems('7d', 5).catch(() => null),
        ordersAPI.getRecent(5),
        inventoryAPI.list({ lowStock: 'true' }).catch(() => null),
      ]);

      const summary = unwrap(summaryBody);
      setDashboardData(summary);
      const top = topBody ? unwrap(topBody) : [];
      setTopItems(Array.isArray(top) ? top : []);

      const orders = unwrap(ordersResponse) || [];
      setRecentOrders((Array.isArray(orders) ? orders : []).map(adaptOrder));

      const lowData = lowBody ? unwrap(lowBody) : {};
      setLowStock(lowData.items || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
      setDashboardData(null);
      setTopItems([]);
      setRecentOrders([]);
      setLowStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statsCards = dashboardData ? [
    {
      title: 'Revenue Today',
      value: formatMoney(dashboardData.revenue),
      change: `${dashboardData.prevDayDeltaBps >= 0 ? '+' : ''}${((dashboardData.prevDayDeltaBps || 0) / 100).toFixed(1)}% vs yesterday`,
      trend: (dashboardData.prevDayDeltaBps || 0) >= 0 ? 'up' : 'down',
      icon: AttachMoney,
      color: 'success',
      subtitle: 'business day',
    },
    {
      title: 'Orders Today',
      value: String(dashboardData.ordersCount || 0),
      change: `${dashboardData.pendingOrders || 0} pending`,
      trend: (dashboardData.pendingOrders || 0) > 0 ? 'warning' : 'up',
      icon: ShoppingCart,
      color: 'primary',
      subtitle: `AOV ${formatMoney(dashboardData.aov)}`,
    },
    {
      title: 'Pending',
      value: String(dashboardData.pendingOrders || 0),
      change: dashboardData.pendingOrders > 0 ? 'Need attention' : 'All clear',
      trend: dashboardData.pendingOrders > 0 ? 'warning' : 'up',
      icon: Schedule,
      color: dashboardData.pendingOrders > 0 ? 'warning' : 'success',
      subtitle: 'in queue',
    },
    {
      title: 'Served Today',
      value: String(dashboardData.servedCount || 0),
      change: `${dashboardData.cancelledCount || 0} cancelled`,
      trend: 'up',
      icon: CheckCircle,
      color: 'info',
      subtitle: 'completed',
    },
    {
      title: 'Low stock',
      value: String(lowStock.length),
      change: lowStock.length > 0 ? 'Needs reorder' : 'All good',
      trend: lowStock.length > 0 ? 'warning' : 'up',
      icon: Warning,
      color: lowStock.length > 0 ? 'warning' : 'success',
      subtitle: lowStock.length ? lowStock.slice(0, 2).map((i) => i.itemName).join(', ') : 'inventory OK',
    },
  ] : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'served': return 'success';
      case 'ready': return 'success';
      case 'preparing': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading && !dashboardData) {
    return (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
    );
  }

  return (
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} action={
            <Button color="inherit" size="small" onClick={fetchDashboardData}>Retry</Button>
          }>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, index) => (
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
                    {recentOrders.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No recent orders
                      </Typography>
                    )}
                    {recentOrders.map((order, index) => (
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
                                {order.orderNumber || `#${String(order._id || '').slice(-6)}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {order.customer?.name || 'Walk-in'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.placedAt || order.createdAt ?
                                  `${Math.floor((Date.now() - new Date(order.placedAt || order.createdAt).getTime()) / 60000)} min ago` :
                                  'Just now'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {formatMoney(order.total || order.totalAmount)}
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

              {/* Top items (7d) */}
              <Fade in={!loading} timeout={1400}>
                <Card sx={{ flex: 1 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
                      <BarChart sx={{ mr: 1, color: 'primary.main' }} />
                      Top Items (7 days)
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {topItems.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No sales in the last 7 days
                        </Typography>
                      )}
                      {topItems.map((item, index) => (
                        <Grow in={!loading} timeout={1600 + index * 100} key={item.menuItemId || item.title}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {item.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.qty} sold
                              </Typography>
                            </Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {formatMoney(item.revenue)}
                            </Typography>
                          </Box>
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