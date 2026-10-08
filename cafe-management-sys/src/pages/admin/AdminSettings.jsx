import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Button, Switch, FormControlLabel, Divider, Alert, Tabs, Tab, List, ListItem, ListItemText, ListItemSecondaryAction, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import Save from '@mui/icons-material/Save';
import Refresh from '@mui/icons-material/Refresh';
import Security from '@mui/icons-material/Security';
import Notifications from '@mui/icons-material/Notifications';
import Store from '@mui/icons-material/Store';
import Payment from '@mui/icons-material/Payment';
import Backup from '@mui/icons-material/Backup';
import Delete from '@mui/icons-material/Delete';
import Palette from '@mui/icons-material/Palette';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import Print from '@mui/icons-material/Print';
import Settings from '@mui/icons-material/Settings';
import { useThemeContext } from '../../contexts/ThemeContext';
import { settingsAPI, unwrap } from '../../services/api';
import { useBrand } from '../../contexts/BrandContext';

const isValidHex = (c) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c || '');
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z]\dZ\d$/;

const AdminSettings = () => {
  const { toggleMode, isDarkMode } = useThemeContext();
  const { refresh: refreshBrand } = useBrand();
  const [activeTab, setActiveTab] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', title: '', message: '' });

  const [brand, setBrand] = useState({
    title: 'Restaurant Management',
    logoUrl: '',
    primaryColor: '#ff6b35',
    accentColor: '#f7931e',
  });

  const [gst, setGst] = useState({
    gstin: '',
    legalName: '',
    legalAddress: '',
    stateCode: '',
    stateName: '',
    hsnSAC: '996311',
    invoicePrefix: 'INV',
    fyStartMonth: 4,
    bps: 500,
  });
  const [gstError, setGstError] = useState('');
  const [gstSaving, setGstSaving] = useState(false);
  const [ops, setOps] = useState({ timezone: 'Asia/Kolkata', currency: 'INR', activity_retention_days: 365 });
  const [print, setPrint] = useState({ default_paper: 'a4', printer_host: '' });
  const [opsSaving, setOpsSaving] = useState(false);
  const [printSaving, setPrintSaving] = useState(false);
  const [printTestResult, setPrintTestResult] = useState('');
  const [settingsMsg, setSettingsMsg] = useState('');

  const loadBrandSettings = useCallback(async () => {
    try {
      setLoadingBrand(true);
      const body = await settingsAPI.get();
      const data = unwrap(body) || {};
      if (data.brand) {
        setBrand({
          title: data.brand.title || '',
          logoUrl: data.brand.logoUrl || '',
          primaryColor: data.brand.primaryColor || '#ff6b35',
          accentColor: data.brand.accentColor || '#f7931e',
        });
      }
      if (data.gst) {
        setGst({
          gstin: data.gst.gstin || '',
          legalName: data.gst.legalName || '',
          legalAddress: data.gst.legalAddress || '',
          stateCode: data.gst.stateCode || '',
          stateName: data.gst.stateName || '',
          hsnSAC: data.gst.hsnSAC || '996311',
          invoicePrefix: data.gst.invoicePrefix || 'INV',
          fyStartMonth: data.gst.fyStartMonth || 4,
          bps: data.gst.bps ?? 500,
        });
      }
      if (data.ops) {
        setOps({
          timezone: data.ops.timezone || 'Asia/Kolkata',
          currency: data.ops.currency || 'INR',
          activity_retention_days: data.ops.activity_retention_days ?? 365,
        });
      }
      if (data.print) {
        setPrint({
          default_paper: data.print.default_paper || 'a4',
          printer_host: data.print.printer_host || '',
        });
      }
    } catch (err) {
      console.error('Failed to load brand settings', err);
    } finally {
      setLoadingBrand(false);
    }
  }, []);

  useEffect(() => {
    loadBrandSettings();
  }, [loadBrandSettings]);

  const brandValid = brand.title.trim().length > 0
    && isValidHex(brand.primaryColor)
    && isValidHex(brand.accentColor);

  const handleSaveOps = async () => {
    setSettingsMsg('');
    try {
      setOpsSaving(true);
      await settingsAPI.update({
        ops: {
          timezone: ops.timezone,
          currency: ops.currency,
          activity_retention_days: Number(ops.activity_retention_days) || 365,
          printer_host: print.printer_host,
        },
        print: { default_paper: print.default_paper, printer_host: print.printer_host },
      });
      setSettingsMsg('Operations saved');
      setTimeout(() => setSettingsMsg(''), 2500);
    } catch (err) {
      setSettingsMsg(err.message || 'Failed to save operations');
    } finally {
      setOpsSaving(false);
    }
  };

  const handleSavePrint = async () => {
    setSettingsMsg('');
    try {
      setPrintSaving(true);
      await settingsAPI.update({
        ops: { printer_host: print.printer_host },
        print: { default_paper: print.default_paper, printer_host: print.printer_host },
      });
      setSettingsMsg('Printing saved');
      setTimeout(() => setSettingsMsg(''), 2500);
    } catch (err) {
      setSettingsMsg(err.message || 'Failed to save printing');
    } finally {
      setPrintSaving(false);
    }
  };

  const handleTestPrint = async () => {
    setPrintTestResult('');
    try {
      const body = await settingsAPI.update({ print: { default_paper: print.default_paper, printer_host: print.printer_host } });
      void body;
      if (!print.printer_host) {
        setPrintTestResult('Add a printer host (e.g. 192.168.1.50) to send a test job');
        return;
      }
      setPrintTestResult(`Test job would be sent to ${print.printer_host}:9100`);
    } catch (err) {
      setPrintTestResult(err.message || 'Test print failed');
    }
  };

  const handleSaveBrand = async () => {
    setSaveError('');
    if (!brandValid) {
      setSaveError('Title required; colors must be hex like #ff6b35');
      return;
    }
    try {
      await settingsAPI.update({
        brand: {
          title: brand.title.trim(),
          logoUrl: brand.logoUrl,
          primaryColor: brand.primaryColor,
          accentColor: brand.accentColor,
        },
      });
      await refreshBrand();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save brand settings');
    }
  };

  const gstValid = !!gst.gstin && GSTIN_RE.test(gst.gstin) && !!gst.legalName && !!gst.legalAddress && !!gst.stateCode;

  const handleSaveGst = async () => {
    setGstError('');
    if (!gst.gstin || !GSTIN_RE.test(gst.gstin)) {
      setGstError('GSTIN must look like 27AAAAA0000A1Z5 (15 chars)');
      return;
    }
    if (!gst.legalName || !gst.legalAddress || !gst.stateCode) {
      setGstError('legalName, legalAddress and stateCode are required for invoices');
      return;
    }
    try {
      setGstSaving(true);
      await settingsAPI.update({
        gst: {
          gstin: gst.gstin.toUpperCase(),
          legalName: gst.legalName,
          legalAddress: gst.legalAddress,
          stateCode: gst.stateCode,
          stateName: gst.stateName,
          hsnSAC: gst.hsnSAC,
          invoicePrefix: gst.invoicePrefix || 'INV',
          fyStartMonth: Number(gst.fyStartMonth) || 4,
          bps: Number(gst.bps) || 500,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setGstError(err.message || 'Failed to save GST settings');
    } finally {
      setGstSaving(false);
    }
  };

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    restaurantName: 'My Restaurant',
    address: '123 Main Street, City',
    phone: '+1 (555) 123-4567',
    email: 'info@example.com',
    website: 'www.example.com',
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
        <Tab icon={<Palette />} label="Brand" />
          <Tab icon={<ReceiptLong />} label="GST / Invoice" />
          <Tab icon={<Store />} label="General" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Payment />} label="Payment" />
          <Tab icon={<Backup />} label="System" />
          <Tab icon={<Print />} label="Printing" />
          <Tab icon={<Settings />} label="Operations" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>White-label brand</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Title and colors load from this tenant&apos;s settings and apply to the whole UI (Navbar, theme).
              </Typography>
              {loadingBrand ? (
                <CircularProgress size={28} />
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Brand title"
                      value={brand.title}
                      onChange={(e) => setBrand({ ...brand, title: e.target.value })}
                      helperText="Shown in navbar and browser tab"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Logo URL"
                      value={brand.logoUrl}
                      onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Primary color"
                      value={brand.primaryColor}
                      onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                      error={brand.primaryColor && !isValidHex(brand.primaryColor)}
                      helperText={isValidHex(brand.primaryColor) ? 'e.g. #ff6b35' : 'Invalid hex'}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Accent color"
                      value={brand.accentColor}
                      onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })}
                      error={brand.accentColor && !isValidHex(brand.accentColor)}
                      helperText={isValidHex(brand.accentColor) ? 'e.g. #f7931e' : 'Invalid hex'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: brand.primaryColor, border: '1px solid divider' }} />
                      <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: brand.accentColor, border: '1px solid divider' }} />
                      <Typography variant="body2" color="text.secondary">Preview</Typography>
                    </Box>
                  </Grid>
                  {saveError && (
                    <Grid item xs={12}>
                      <Alert severity="error">{saveError}</Alert>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveBrand}
                      disabled={!brandValid}
                    >
                      Save brand
                    </Button>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>GST tax invoice settings</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Required before invoices can be issued. GSTIN validated as 15-character Indian format.
              </Typography>
              {loadingBrand ? (
                <CircularProgress size={28} />
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="GSTIN"
                      value={gst.gstin}
                      onChange={(e) => setGst({ ...gst, gstin: e.target.value.toUpperCase() })}
                      error={!!gst.gstin && !GSTIN_RE.test(gst.gstin)}
                      helperText={GSTIN_RE.test(gst.gstin) ? 'Valid format' : 'e.g. 27AAAAA0000A1Z5'}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Legal name"
                      value={gst.legalName}
                      onChange={(e) => setGst({ ...gst, legalName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="State code"
                      value={gst.stateCode}
                      onChange={(e) => setGst({ ...gst, stateCode: e.target.value })}
                      helperText="e.g. 27 Maharashtra"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Legal address"
                      value={gst.legalAddress}
                      onChange={(e) => setGst({ ...gst, legalAddress: e.target.value })}
                      multiline
                      minRows={2}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="State name"
                      value={gst.stateName}
                      onChange={(e) => setGst({ ...gst, stateName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Default HSN/SAC"
                      value={gst.hsnSAC}
                      onChange={(e) => setGst({ ...gst, hsnSAC: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Invoice prefix"
                      value={gst.invoicePrefix}
                      onChange={(e) => setGst({ ...gst, invoicePrefix: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="FY start month"
                      type="number"
                      value={gst.fyStartMonth}
                      onChange={(e) => setGst({ ...gst, fyStartMonth: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="GST bps (500 = 5%)"
                      type="number"
                      value={gst.bps}
                      onChange={(e) => setGst({ ...gst, bps: Number(e.target.value) })}
                    />
                  </Grid>
                  {gstError && (
                    <Grid item xs={12}>
                      <Alert severity="error">{gstError}</Alert>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveGst}
                      disabled={!gstValid || gstSaving}
                    >
                      {gstSaving ? 'Saving…' : 'Save GST settings'}
                    </Button>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Restaurant Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Restaurant Name"
                  value={generalSettings.restaurantName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, restaurantName: e.target.value })}
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
        <TabPanel value={activeTab} index={3}>
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
        <TabPanel value={activeTab} index={4}>
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
        <TabPanel value={activeTab} index={5}>
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
        <TabPanel value={activeTab} index={6}>
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

        <TabPanel value={activeTab} index={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Printing</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Default paper for invoice printing and optional network thermal printer (ESC/POS).
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Default paper"
                    value={print.default_paper}
                    onChange={(e) => setPrint({ ...print, default_paper: e.target.value })}
                    SelectProps={{ native: true }}
                  >
                    <option value="a4">A4</option>
                    <option value="thermal80">Thermal 80mm</option>
                    <option value="thermal58">Thermal 58mm</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Printer host (optional)"
                    placeholder="192.168.1.50"
                    value={print.printer_host}
                    onChange={(e) => setPrint({ ...print, printer_host: e.target.value })}
                    helperText="Network ESC/POS printer, port 9100"
                  />
                </Grid>
                {printTestResult && (
                  <Grid item xs={12}><Alert severity="info">{printTestResult}</Alert></Grid>
                )}
                <Grid item xs={12}>
                  <Button variant="outlined" onClick={handleTestPrint} sx={{ mr: 1 }}>Test print</Button>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSavePrint} disabled={printSaving}>
                    {printSaving ? 'Saving…' : 'Save printing'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Operations</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Timezone drives reporting day boundaries; retention prunes old activity rows.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Timezone"
                    value={ops.timezone}
                    onChange={(e) => setOps({ ...ops, timezone: e.target.value })}
                    helperText="e.g. Asia/Kolkata"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Currency"
                    value={ops.currency}
                    onChange={(e) => setOps({ ...ops, currency: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Activity retention (days)"
                    value={ops.activity_retention_days}
                    onChange={(e) => setOps({ ...ops, activity_retention_days: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<Save />} onClick={handleSaveOps} disabled={opsSaving}>
                    {opsSaving ? 'Saving…' : 'Save operations'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
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
