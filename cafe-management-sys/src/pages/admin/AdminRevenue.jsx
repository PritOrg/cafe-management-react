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
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  DateRange,
  Download,
  Refresh,
} from '@mui/icons-material';
import { analyticsAPI } from '../../services/api';

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [revenueData, setRevenueData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getRevenueStats(period);
      setRevenueData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      // Mock data fallback
      setRevenueData({
        total: 12426,
        change: 12.5,
        chartData: [],
        breakdown: [
          { category: 'Coffee', amount: 7500, percentage: 60.4, change: 15.2 },
          { category: 'Pastries', amount: 2800, percentage: 22.5, change: 8.7 },
          { category: 'Sandwiches', amount: 1500, percentage: 12.1, change: -2.3 },
          { category: 'Desserts', amount: 626, percentage: 5.0, change: 22.1 },
        ],
        dailyRevenue: [
          { date: '2024-01-01', amount: 450 },
          { date: '2024-01-02', amount: 520 },
          { date: '2024-01-03', amount: 380 },
          { date: '2024-01-04', amount: 610 },
          { date: '2024-01-05', amount: 490 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
          </Box>
        </Box>
        <Typography variant="h4" color={`${color}.main`} fontWeight={700} gutterBottom>
          {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading && !revenueData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Revenue Analytics
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Revenue Analytics
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <IconButton onClick={fetchRevenueData} disabled={loading}>
            <Refresh />
          </IconButton>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
        </Box>
      </Box>

      {/* Period Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Time Period</Typography>
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

      {/* Revenue Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title={`Total Revenue (${periods.find(p => p.value === period)?.label})`}
            value={revenueData?.total}
            change={revenueData?.change}
            icon={<AttachMoney fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Average Daily Revenue"
            value={revenueData?.total ? Math.round(revenueData.total / (period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365)) : 0}
            change={revenueData?.change}
            icon={<DateRange fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Growth Rate"
            value={`${revenueData?.change || 0}%`}
            change={revenueData?.change}
            icon={<TrendingUp fontSize="large" />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Revenue Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue by Category
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                      <TableCell align="right">Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {revenueData?.breakdown?.map((item) => (
                      <TableRow key={item.category} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.category}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={600}>
                            ${item.amount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {item.percentage.toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${item.change > 0 ? '+' : ''}${item.change}%`}
                            color={item.change > 0 ? 'success' : item.change < 0 ? 'error' : 'default'}
                            size="small"
                            icon={item.change > 0 ? <TrendingUp /> : item.change < 0 ? <TrendingDown /> : null}
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
                Recent Daily Revenue
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {revenueData?.dailyRevenue?.slice(-5).map((day, index) => (
                  <Box key={day.date} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(day.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={600}>
                      ${day.amount.toLocaleString()}
                    </Typography>
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

export default AdminRevenue;
