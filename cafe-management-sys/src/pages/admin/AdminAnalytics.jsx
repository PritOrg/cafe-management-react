import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  ButtonGroup,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Timeline,
  Download,
  Refresh,
  DateRange,
} from '@mui/icons-material';
import { analyticsAPI } from '../../services/api';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [dashboardStats, revenueStats, orderStats] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        analyticsAPI.getRevenueStats(period),
        analyticsAPI.getOrderStats(period),
      ]);
      
      setAnalyticsData({
        dashboard: dashboardStats,
        revenue: revenueStats,
        orders: orderStats,
        // Mock additional analytics data
        customerMetrics: {
          totalCustomers: 1247,
          newCustomers: 89,
          returningCustomers: 1158,
          customerRetentionRate: 92.8,
        },
        productPerformance: [
          { name: 'Latte', orders: 342, revenue: 1539, growth: 15.2 },
          { name: 'Cappuccino', orders: 298, revenue: 1192, growth: 8.7 },
          { name: 'Espresso', orders: 256, revenue: 640, growth: -2.3 },
          { name: 'Americano', orders: 189, revenue: 567, growth: 12.1 },
          { name: 'Mocha', orders: 167, revenue: 751, growth: 22.4 },
        ],
        timeAnalytics: {
          peakHours: [
            { hour: '8:00 AM', orders: 45 },
            { hour: '12:00 PM', orders: 52 },
            { hour: '3:00 PM', orders: 38 },
            { hour: '6:00 PM', orders: 29 },
          ],
          busyDays: [
            { day: 'Monday', orders: 156 },
            { day: 'Tuesday', orders: 142 },
            { day: 'Wednesday', orders: 167 },
            { day: 'Thursday', orders: 189 },
            { day: 'Friday', orders: 234 },
            { day: 'Saturday', orders: 298 },
            { day: 'Sunday', orders: 201 },
          ],
        },
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, change, icon, color = 'primary', suffix = '' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {change !== undefined && (
              <>
                {change > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : change < 0 ? (
                  <TrendingDown color="error" fontSize="small" />
                ) : null}
                <Typography
                  variant="caption"
                  color={change > 0 ? 'success.main' : change < 0 ? 'error.main' : 'text.secondary'}
                  fontWeight={600}
                >
                  {change > 0 ? '+' : ''}{change}%
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <Typography variant="h4" color={`${color}.main`} fontWeight={700} gutterBottom>
          {value}{suffix}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading && !analyticsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Analytics Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <IconButton onClick={fetchAnalyticsData} disabled={loading}>
            <Refresh />
          </IconButton>
          <Button variant="outlined" startIcon={<Download />}>
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Period Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Analysis Period</Typography>
            <ButtonGroup variant="outlined" size="small">
              {periods.map((p) => (
                <Button
                  key={p.value}
                  variant={period === p.value ? 'contained' : 'outlined'}
                  onClick={() => setPeriod(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={`$${analyticsData?.dashboard?.totalRevenue?.toLocaleString() || '0'}`}
            change={analyticsData?.dashboard?.revenueChange}
            icon={<TrendingUp fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Orders"
            value={analyticsData?.dashboard?.ordersToday?.toLocaleString() || '0'}
            change={analyticsData?.dashboard?.ordersChange}
            icon={<BarChart fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Customers"
            value={analyticsData?.customerMetrics?.totalCustomers?.toLocaleString() || '0'}
            change={12.5}
            icon={<PieChart fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Retention Rate"
            value={analyticsData?.customerMetrics?.customerRetentionRate || '0'}
            change={2.3}
            icon={<Timeline fontSize="large" />}
            color="warning"
            suffix="%"
          />
        </Grid>
      </Grid>

      {/* Product Performance */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performing Products
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Orders</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Growth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData?.productPerformance?.map((product) => (
                      <TableRow key={product.name} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {product.orders}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={600}>
                            ${product.revenue}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${product.growth > 0 ? '+' : ''}${product.growth}%`}
                            color={product.growth > 0 ? 'success' : product.growth < 0 ? 'error' : 'default'}
                            size="small"
                            icon={product.growth > 0 ? <TrendingUp /> : product.growth < 0 ? <TrendingDown /> : null}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Insights
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    New Customers
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="primary">
                    {analyticsData?.customerMetrics?.newCustomers || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Returning Customers
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="success.main">
                    {analyticsData?.customerMetrics?.returningCustomers || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Retention Rate
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="info.main">
                    {analyticsData?.customerMetrics?.customerRetentionRate || 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Time Analytics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Peak Hours
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {analyticsData?.timeAnalytics?.peakHours?.map((hour, index) => (
                  <Box key={hour.hour} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {hour.hour}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(hour.orders / 60) * 100}
                        sx={{ width: 100, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="subtitle2" fontWeight={600}>
                        {hour.orders}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Performance
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {analyticsData?.timeAnalytics?.busyDays?.map((day, index) => (
                  <Box key={day.day} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      {day.day}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(day.orders / 300) * 100}
                        sx={{ width: 100, height: 8, borderRadius: 4 }}
                        color={day.orders > 200 ? 'success' : day.orders > 150 ? 'warning' : 'error'}
                      />
                      <Typography variant="subtitle2" fontWeight={600}>
                        {day.orders}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalytics;
