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
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  MenuItem,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Refresh from '@mui/icons-material/Refresh';
import Block from '@mui/icons-material/Block';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { tenantsAPI, unwrap } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AdminTenants = () => {
  const { isPlatformAdmin } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const body = await tenantsAPI.getAll();
      const data = unwrap(body);
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreate = async () => {
    setError('');
    try {
      await tenantsAPI.create({ slug, name });
      setOpen(false);
      setSlug('');
      setName('');
      fetchTenants();
    } catch (err) {
      setError(err.message || 'Failed to create tenant');
    }
  };

  const handleToggleStatus = async (tenant) => {
    const next = tenant.status === 'active' ? 'suspended' : 'active';
    try {
      await tenantsAPI.update(tenant._id, { status: next });
      fetchTenants();
    } catch (err) {
      console.error('Error updating tenant:', err);
    }
  };

  if (!isPlatformAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Platform administrator access required.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Tenants
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchTenants}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            New Tenant
          </Button>
        </Box>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Slug</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Loading tenants...</TableCell>
                </TableRow>
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No tenants yet</TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {tenant.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.status}
                        color={tenant.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleToggleStatus(tenant)}
                        title={tenant.status === 'active' ? 'Suspend' : 'Activate'}
                      >
                        {tenant.status === 'active' ? <Block color="error" /> : <CheckCircle color="success" />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Tenant</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slug (subdomain)"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                helperText="e.g. cafe1 → cafe1.yourdomain.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>
            {error && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">{error}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!slug || !name}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTenants;
