import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Button,
  Grid,
  Pagination,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Refresh from '@mui/icons-material/Refresh';
import Search from '@mui/icons-material/Search';
import History from '@mui/icons-material/History';
import Download from '@mui/icons-material/Download';
import { activityAPI, unwrap } from '../../services/api';
import useOpsEvents from '../../hooks/useOpsEvents';
import { activityToCsv, downloadCsv } from '../../utils/orderCsv';

const AdminActivity = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit };
      if (action) params.action = action;
      if (entityType) params.entityType = entityType;
      const body = await activityAPI.list(params);
      const data = unwrap(body) || {};
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError(err.message || 'Failed to load activity');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, action, entityType]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Realtime: prepend new activity rows as they happen.
  useOpsEvents({ 'activity:new': fetchActivities });

  const handleExport = async () => {
    try {
      const params = { limit: 200 };
      if (action) params.action = action;
      if (entityType) params.entityType = entityType;
      const body = await activityAPI.list(params);
      const data = unwrap(body) || {};
      const rows = data.items || items;
      downloadCsv(`activity-${new Date().toISOString().slice(0, 10)}`, activityToCsv(rows));
    } catch (err) {
      setError(err.message || 'Export failed');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <History /> Activity Log
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>Export CSV</Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchActivities}>Refresh</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button color="inherit" size="small" onClick={fetchActivities}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Action (e.g. order.place)"
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Entity type (order, invoice, staff…)"
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Request</TableCell>
                <TableCell align="right">Meta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><LinearProgress /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No activity</TableCell></TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row._id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelected(row)}>
                    <TableCell>
                      <Typography variant="caption">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={row.action} color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{row.entity}{row.entityId ? ` · ${String(row.entityId).slice(0, 8)}` : ''}</TableCell>
                    <TableCell>{row.actorType || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {row.requestId ? String(row.requestId).slice(0, 12) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={(e) => { e.stopPropagation(); setSelected(row); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={Math.max(1, Math.ceil(total / limit))}
            page={page}
            onChange={(_, p) => setPage(p)}
          />
        </Box>
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Activity detail</DialogTitle>
        <DialogContent>
          {selected && (
            <Box sx={{ mt: 1 }}>
              <Typography><strong>Action:</strong> {selected.action}</Typography>
              <Typography><strong>Entity:</strong> {selected.entity}</Typography>
              <Typography><strong>Entity ID:</strong> {selected.entityId || '—'}</Typography>
              <Typography><strong>Actor:</strong> {selected.actorType} {selected.actorId || ''}</Typography>
              <Typography><strong>Request ID:</strong> {selected.requestId || '—'}</Typography>
              <Typography><strong>Time:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</Typography>
              <Typography variant="body2" sx={{ mt: 2, mb: 1 }}><strong>Meta</strong></Typography>
              {selected.meta && (selected.meta.before !== undefined || selected.meta.after !== undefined) && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip size="small" label={`before: ${JSON.stringify(selected.meta.before)}`} variant="outlined" />
                  <Chip size="small" label={`after: ${JSON.stringify(selected.meta.after)}`} color="primary" />
                </Box>
              )}
              <Box component="pre" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(selected.meta || {}, null, 2)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminActivity;
