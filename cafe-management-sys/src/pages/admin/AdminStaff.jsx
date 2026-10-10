import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Button, TextField, InputAdornment, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Avatar, Fab, Pagination } from '@mui/material';
import Search from '@mui/icons-material/Search';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import MoreVert from '@mui/icons-material/MoreVert';
import Email from '@mui/icons-material/Email';
import Phone from '@mui/icons-material/Phone';
import { staffAPI } from '../../services/api';
import ErrorState from '../../components/common/ErrorState';
import LoadingState from '../../components/common/LoadingState';

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
  });
  const [editingStaff, setEditingStaff] = useState(null);

  const emptyStaff = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff',
    password: '',
  };

  const displayName = (member) => {
    if (!member) return '';
    const full = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
    return full || member.name || member.email || '—';
  };

  const memberStatus = (member) => (member?.isActive !== false ? 'active' : 'inactive');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await staffAPI.getAll();
      const staffData = response?.data || response || [];
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError(error.message || 'Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStaff = async () => {
    try {
      if (editingStaff) {
        const payload = {
          firstName: newStaff.firstName,
          lastName: newStaff.lastName,
          email: newStaff.email,
          phone: newStaff.phone,
          role: newStaff.role,
        };
        const updated = await staffAPI.update(editingStaff._id, payload);
        const staffObj = updated?.data ?? updated;
        setStaff(staff.map((m) => (m._id === editingStaff._id ? staffObj || { ...m, ...payload } : m)));
      } else {
        const addedStaff = await staffAPI.add(newStaff);
        const staffObj = addedStaff?.data ?? addedStaff;
        setStaff([...staff, staffObj]);
      }
      setAddDialogOpen(false);
      setEditingStaff(null);
      setNewStaff(emptyStaff);
    } catch (error) {
      console.error('Error saving staff:', error);
    }
  };

  const openAddStaff = () => {
    setEditingStaff(null);
    setNewStaff(emptyStaff);
    setAddDialogOpen(true);
  };

  const handleEditClick = () => {
    const member = staff.find((m) => m._id === selectedStaffId);
    handleMenuClose();
    if (!member) return;
    setEditingStaff(member);
    setNewStaff({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'staff',
      password: '',
    });
    setAddDialogOpen(true);
  };

  const closeStaffDialog = () => {
    setAddDialogOpen(false);
    setEditingStaff(null);
    setNewStaff(emptyStaff);
  };

  const handleDeleteStaff = async () => {
    try {
      await staffAPI.remove(selectedStaff._id);
      setStaff(staff.filter(member => member._id !== selectedStaff._id));
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      staff: 'primary',
    };
    return colors[role] || 'default';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  const filteredStaff = staff.filter(member => {
    const name = displayName(member).toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (member.isActive !== false ? 'active' : 'inactive') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const staffRoleCounts = staff.reduce(
    (acc, m) => ({ ...acc, [m.role || 'staff']: (acc[m.role || 'staff'] || 0) + 1 }),
    {}
  );

  const [staffPage, setStaffPage] = useState(1);
  const PAGE_STAFF = 15;
  const pagedStart = (staffPage - 1) * PAGE_STAFF;
  const staffPageCount = Math.max(1, Math.ceil(filteredStaff.length / PAGE_STAFF));

  // Reset to page 1 when the search changes.
  useEffect(() => {
    setStaffPage(1);
  }, [searchQuery]);

  const handleMenuClick = (event, staffId) => {
    setAnchorEl(event.currentTarget);
    setSelectedStaffId(staffId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStaffId(null);
  };

  const handleDeleteClick = () => {
    const member = staff.find(member => member._id === selectedStaffId);
    setSelectedStaff(member);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Staff Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAddStaff}
          sx={{ borderRadius: 2 }}
        >
          Add Staff Member
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search staff members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                select
                label="Role"
                size="small"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">All roles</MenuItem>
                <MenuItem value="staff">Staff ({staffRoleCounts.staff || 0})</MenuItem>
                <MenuItem value="admin">Admin ({staffRoleCounts.admin || 0})</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                fullWidth
                select
                label="Status"
                size="small"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Box sx={{ mb: 2 }}>
          <ErrorState title="Couldn't load staff" message={error} onRetry={fetchStaff} />
        </Box>
      )}

      {/* Staff Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff Member</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Join Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <LoadingState label="Loading staff…" rows={4} />
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.slice(pagedStart, pagedStart + PAGE_STAFF).map((member) => (
                  <TableRow key={member._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={member.profilePhotoUrl || member.avatar}>
                          {displayName(member).charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {displayName(member)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Email fontSize="small" color="action" />
                          <Typography variant="body2">{member.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone fontSize="small" color="action" />
                          <Typography variant="body2">{member.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={(member.role || '').charAt(0).toUpperCase() + (member.role || '').slice(1)}
                        color={getRoleColor(member.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={memberStatus(member).charAt(0).toUpperCase() + memberStatus(member).slice(1)}
                        color={getStatusColor(memberStatus(member))}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(member.registrationDate || member.joinDate || Date.now()).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, member._id)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredStaff.length > PAGE_STAFF && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, overflow: 'auto' }}>
            <Pagination
              count={staffPageCount}
              page={Math.min(staffPage, staffPageCount)}
              onChange={(_, p) => setStaffPage(p)}
              shape="rounded"
              size="medium"
            />
          </Box>
        )}
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={openAddStaff}
      >
        <Add />
      </Fab>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Remove
        </MenuItem>
      </Menu>

      {/* Add Staff Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={closeStaffDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newStaff.firstName}
                onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newStaff.lastName}
                onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Role"
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
<TextField
              fullWidth
              label="Password"
              type="password"
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              helperText={editingStaff ? 'Leave blank to keep the current password' : ''}
            />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStaffDialog}>Cancel</Button>
          <Button onClick={handleSubmitStaff} variant="contained">
            {editingStaff ? 'Save Changes' : 'Add Staff Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove Staff Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{displayName(selectedStaff)}" from the staff? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteStaff} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminStaff;
