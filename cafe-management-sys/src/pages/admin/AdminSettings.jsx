import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Button, Alert, Tabs, Tab, CircularProgress } from '@mui/material';
import Save from '@mui/icons-material/Save';
import Palette from '@mui/icons-material/Palette';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import Print from '@mui/icons-material/Print';
import Settings from '@mui/icons-material/Settings';
import Email from '@mui/icons-material/Email';
import CloudUpload from '@mui/icons-material/CloudUpload';
import { settingsAPI, unwrap } from '../../services/api';
import { onColor } from '../../utils/m3Theme';
import { useBrand } from '../../contexts/BrandContext';

const isValidHex = (c) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c || '');
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z]\dZ\d$/;

const AdminSettings = () => {
  const { refresh: refreshBrand } = useBrand();
  const [activeTab, setActiveTab] = useState(0);
  const [saveError, setSaveError] = useState('');
  const [loadingBrand, setLoadingBrand] = useState(true);

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

  const [integrations, setIntegrations] = useState(null);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailState, setTestEmailState] = useState({ open: false, message: '', severity: 'success' });

  const loadIntegrations = useCallback(async () => {
    try {
      const body = await settingsAPI.getIntegrations();
      setIntegrations(unwrap(body));
    } catch (err) {
      console.error('Failed to load integrations:', err);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const handleSendTestEmail = async () => {
    try {
      await settingsAPI.sendTestEmail(testEmailTo);
      setTestEmailState({ open: true, message: `Test email sent to ${testEmailTo}`, severity: 'success' });
    } catch (err) {
      setTestEmailState({ open: true, message: err.message || 'Failed to send test email', severity: 'error' });
    }
  };

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
      setSettingsMsg('Brand settings saved');
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
      setSettingsMsg('GST settings saved');
    } catch (err) {
      setGstError(err.message || 'Failed to save GST settings');
    } finally {
      setGstSaving(false);
    }
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


      {settingsMsg && (
        <Alert
          severity={/saved/i.test(settingsMsg) ? 'success' : 'error'}
          onClose={() => setSettingsMsg('')}
          sx={{ mb: 3 }}
        >
          {settingsMsg}
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
        <Tab icon={<Print />} label="Printing" />
        <Tab icon={<Settings />} label="Operations" />
        <Tab icon={<Email />} label="SMTP" />
        <Tab icon={<CloudUpload />} label="Storage" />
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
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Live preview
                    </Typography>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                      {/* Mock app header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        {brand.logoUrl ? (
                          <Box component="img" src={brand.logoUrl} alt="" sx={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: brand.primaryColor }} />
                        )}
                        <Typography sx={{ fontWeight: 800, color: brand.primaryColor }}>
                          {brand.title || 'Restaurant'}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Box
                          sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: 999,
                            bgcolor: brand.primaryColor,
                            color: onColor(brand.primaryColor),
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          Add to cart
                        </Box>
                      </Box>
                      {/* Mock invoice header */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          px: 2,
                          py: 1.5,
                          background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})`,
                          color: onColor(brand.primaryColor),
                        }}
                      >
                        <Typography sx={{ fontWeight: 700 }}>{brand.title || 'Restaurant'}</Typography>
                        <Typography variant="caption">TAX INVOICE</Typography>
                      </Box>
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

        <TabPanel value={activeTab} index={3}>
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

        <TabPanel value={activeTab} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>SMTP (email)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configured from the server environment: SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS.
              </Typography>
              {integrations?.mail ? (
                <Alert severity={integrations.mail.configured ? 'success' : 'warning'} sx={{ mb: 2 }}>
                  {integrations.mail.configured
                    ? `Configured — host ${integrations.mail.host}${integrations.mail.from ? `, from ${integrations.mail.from}` : ''}`
                    : 'Not configured. Set SMTP_HOST on the server to enable email.'}
                </Alert>
              ) : (
                <CircularProgress size={22} />
              )}
              {testEmailState.open && (
                <Alert
                  severity={testEmailState.severity}
                  onClose={() => setTestEmailState((s) => ({ ...s, open: false }))}
                  sx={{ mb: 2 }}
                >
                  {testEmailState.message}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <TextField
                  label="Send test email to"
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  size="small"
                  sx={{ flex: 1, minWidth: 240 }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendTestEmail}
                  disabled={!testEmailTo || !integrations?.mail?.configured}
                >
                  Send test email
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Storage (image uploads)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set on the server via STORAGE_DRIVER (local | cloudinary). Cloudinary is used automatically when
                configured.
              </Typography>
              {integrations?.storage ? (
                <>
                  <Alert severity={integrations.storage.driver === 'cloudinary' ? 'success' : 'info'} sx={{ mb: 2 }}>
                    Active driver: <strong>{integrations.storage.driver}</strong>
                    {integrations.storage.cloudinary ? ' (Cloudinary configured)' : ''}
                  </Alert>
                  {integrations.storage.publicUploadUrl && (
                    <Typography variant="body2" color="text.secondary">
                      Local uploads served from: {integrations.storage.publicUploadUrl}
                    </Typography>
                  )}
                </>
              ) : (
                <CircularProgress size={22} />
              )}
            </CardContent>
          </Card>
        </TabPanel>

      </Card>

    </Box>
  );
};

export default AdminSettings;
