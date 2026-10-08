import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, ButtonGroup, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress, IconButton, Alert } from '@mui/material';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import BarChart from '@mui/icons-material/BarChart';
import AttachMoney from '@mui/icons-material/AttachMoney';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Download from '@mui/icons-material/Download';
import Refresh from '@mui/icons-material/Refresh';
import PieChart from '@mui/icons-material/PieChart';
import { analyticsAPI, unwrap } from '../../services/api';
import { formatMoney } from '../../utils/formatMoney';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryBody, salesBody, orderStatsBody, topBody, mixBody] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getRevenueStats(period),
        analyticsAPI.getOrderStats(period),
        analyticsAPI.getTopItems(period, 8).catch(() => null),
        analyticsAPI.getCategoryMix(period).catch(() => null),
      ]);

      const summary = unwrap(summaryBody) || {};
      const sales = unwrap(salesBody) || {};
      const orderStats = unwrap(orderStatsBody) || {};
      const topItems = topBody ? (unwrap(topBody) || []) : [];
      const categoryMix = mixBody ? (unwrap(mixBody) || []) : [];

      setAnalyticsData({
        dashboard: summary,
        revenue: sales,
        orders: orderStats,
        productPerformance: (topItems || []).map((t) => ({
          name: t.title,
          orders: t.ordersCount || t.qty || 0,
          revenue: t.revenue || 0,
          growth: 0,
        })),
        categoryMix: categoryMix || [],
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to load analytics');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={fetchAnalyticsData}>Retry</Button>
        }>
          {error}
        </Alert>
      )}
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
            value={formatMoney(analyticsData?.dashboard?.revenue)}
            change={analyticsData?.dashboard?.revenueChange}
            icon={<TrendingUp fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Orders"
            value={analyticsData?.dashboard?.ordersCount?.toLocaleString() || '0'}
            change={`${analyticsData?.dashboard?.pendingCount || 0} pending`}
            icon={<BarChart fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="AOV"
            value={formatMoney(analyticsData?.dashboard?.aov)}
            change={0}
            icon={<AttachMoney fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Taxable (today)"
            value={formatMoney(analyticsData?.dashboard?.taxable)}
            change={0}
            icon={<BarChart fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CGST + SGST"
            value={formatMoney((analyticsData?.dashboard?.cgstMinor || 0) / 100 + (analyticsData?.dashboard?.sgstMinor || 0) / 100)}
            change={0}
            icon={<PieChart fontSize="large" />}
            color="warning"
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
                Category Mix
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(analyticsData?.categoryMix || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No sales in this period
                  </Typography>
                )}
                {(analyticsData?.categoryMix || []).map((cat) => (
                  <Box key={cat.category} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{cat.category}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cat.qty} sold · {formatMoney(cat.revenue)}
                      </Typography>
                    </Box>
                    <Chip size="small" label={`${((cat.shareBps || 0) / 100).toFixed(1)}%`} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales series (period totals) */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Period Totals
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Revenue</Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {formatMoney(analyticsData?.revenue?.totalRevenue)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Orders</Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {analyticsData?.revenue?.totalOrders || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Revenue vs prev period</Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {analyticsData?.revenue?.revenueChangePct || 0}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Orders vs prev period</Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {analyticsData?.revenue?.ordersChangePct || 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Orders by Status ({period})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(analyticsData?.orders?.byStatus || {}).map(([status, count]) => (
                  <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{status}</Typography>
                    <Chip size="small" label={count} color={status === 'pending' ? 'warning' : status === 'served' ? 'success' : 'default'} />
                  </Box>
                ))}
                {Object.keys(analyticsData?.orders?.byStatus || {}).length === 0 && (
                  <Typography variant="body2" color="text.secondary">No orders in this period</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAnalytics;
