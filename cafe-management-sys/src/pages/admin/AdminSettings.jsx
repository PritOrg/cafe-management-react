import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save,
  Refresh,
  Security,
  Notifications,
  Store,
  Payment,
  Email,
  Backup,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';

const AdminSettings = () => {
  const { toggleMode, isDarkMode } = useThemeContext();
  const [activeTab, setActiveTab] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', title: '', message: '' });

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    cafeName: 'Brew & Bite Cafe',
    address: '123 Coffee Street, Bean City, BC 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@brewandbite.com',
    website: 'www.brewandbite.com',
    timezone: 'America/New_York',
    currency: 'USD',
    taxRate: 8.5,
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderAlerts: true,
    inventoryAlerts: true,
    staffAlerts: true,
    customerAlerts: false,
    marketingEmails: true,
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    ipWhitelist: '',
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    acceptCash: true,
    acceptCard: true,
    acceptDigital: true,
    tipSuggestions: '15,18,20,25',
    minimumOrder: 5.00,
    deliveryFee: 2.50,
  });

  const handleSaveSettings = () => {
    // Simulate saving settings
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleConfirmAction = (action, title, message) => {
    setConfirmDialog({ open: true, action, title, message });
  };

  const executeAction = () => {
    const { action } = confirmDialog;
    switch (action) {
      case 'backup':
        console.log('Creating backup...');
        break;
      case 'reset':
        console.log('Resetting to defaults...');
        break;
      case 'clearCache':
        console.log('Clearing cache...');
        break;
      default:
        break;
    }
    setConfirmDialog({ open: false, action: '', title: '', message: '' });
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Settings
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Card>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Store />} label="General" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Payment />} label="Payment" />
          <Tab icon={<Backup />} label="System" />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={activeTab} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cafe Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cafe Name"
                  value={generalSettings.cafeName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, cafeName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={generalSettings.phone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={generalSettings.address}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={generalSettings.email}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={generalSettings.website}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, website: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Timezone"
                  value={generalSettings.timezone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  value={generalSettings.currency}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tax Rate (%)"
                  type="number"
                  step="0.1"
                  value={generalSettings.taxRate}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, taxRate: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={toggleMode}
                />
              }
              label="Dark Mode"
            />
          </CardContent>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={activeTab} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                    />
                  }
                  label="SMS Notifications"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                    />
                  }
                  label="Push Notifications"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.orderAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, orderAlerts: e.target.checked })}
                    />
                  }
                  label="Order Alerts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.inventoryAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, inventoryAlerts: e.target.checked })}
                    />
                  }
                  label="Inventory Alerts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.staffAlerts}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, staffAlerts: e.target.checked })}
                    />
                  }
                  label="Staff Alerts"
                />
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={activeTab} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Security Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                    />
                  }
                  label="Two-Factor Authentication"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password Expiry (days)"
                  type="number"
                  value={securitySettings.passwordExpiry}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  type="number"
                  value={securitySettings.loginAttempts}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, loginAttempts: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IP Whitelist (comma-separated)"
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Payment Settings */}
        <TabPanel value={activeTab} index={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Accepted Payment Methods
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={paymentSettings.acceptCash}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, acceptCash: e.target.checked })}
                    />
                  }
                  label="Cash"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={paymentSettings.acceptCard}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, acceptCard: e.target.checked })}
                    />
                  }
                  label="Credit/Debit Cards"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={paymentSettings.acceptDigital}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, acceptDigital: e.target.checked })}
                    />
                  }
                  label="Digital Wallets"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tip Suggestions (%)"
                  value={paymentSettings.tipSuggestions}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, tipSuggestions: e.target.value })}
                  helperText="Comma-separated values"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Order ($)"
                  type="number"
                  step="0.01"
                  value={paymentSettings.minimumOrder}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, minimumOrder: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Delivery Fee ($)"
                  type="number"
                  step="0.01"
                  value={paymentSettings.deliveryFee}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, deliveryFee: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* System Settings */}
        <TabPanel value={activeTab} index={4}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Management
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Create Backup"
                  secondary="Create a backup of all system data"
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    startIcon={<Backup />}
                    onClick={() => handleConfirmAction('backup', 'Create Backup', 'Are you sure you want to create a system backup?')}
                  >
                    Backup
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Clear Cache"
                  secondary="Clear application cache and temporary files"
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => handleConfirmAction('clearCache', 'Clear Cache', 'Are you sure you want to clear the system cache?')}
                  >
                    Clear
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Reset to Defaults"
                  secondary="Reset all settings to default values"
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleConfirmAction('reset', 'Reset Settings', 'Are you sure you want to reset all settings to defaults? This action cannot be undone.')}
                  >
                    Reset
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </TabPanel>

        <Divider />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" startIcon={<Refresh />}>
              Reset Changes
            </Button>
            <Button variant="contained" startIcon={<Save />} onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: '', title: '', message: '' })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: '', title: '', message: '' })}>
            Cancel
          </Button>
          <Button onClick={executeAction} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSettings;
