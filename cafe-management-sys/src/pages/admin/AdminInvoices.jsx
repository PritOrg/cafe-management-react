import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TableCell,
  TableRow,
  Chip,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  TextField,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import ResponsiveTable from '../../components/common/ResponsiveTable';
import Refresh from '@mui/icons-material/Refresh';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import Print from '@mui/icons-material/Print';
import Download from '@mui/icons-material/Download';
import { invoicesAPI, activityAPI, API_BASE_URL, getAuthToken, unwrap } from '../../services/api';
import ErrorState from '../../components/common/ErrorState';
import useOpsEvents from '../../hooks/useOpsEvents';
import { formatMoney } from '../../utils/formatMoney';

const statusColor = (s) => (s === 'issued' ? 'success' : 'default');

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Per-device default paper (falls back to A4). Remembered in this browser.
  const [paper, setPaper] = useState(() => {
    try { return localStorage.getItem('printPaper') || 'a4'; } catch { return 'a4'; }
  });
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const visibleInvoices = (invoices || []).filter((inv) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || String(inv.invoiceNumber || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const body = await invoicesAPI.list({ page, limit });
      const data = unwrap(body) || {};
      setInvoices(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Realtime: new bills appear immediately (auto-issued on checkout).
  useOpsEvents({ 'invoice:issued': fetchInvoices, 'order:created': fetchInvoices });

  const openInvoice = async (inv) => {
    setSelected(inv);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const body = await activityAPI.byEntity('invoice', inv._id || inv.id);
      setHistory(unwrap(body) || []);
    } catch (err) {
      console.error('Error loading invoice history:', err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const printInvoice = (inv, mode = paper) => {
    const id = inv._id || inv.id;
    const qp = new URLSearchParams({ mode });
    const token = getAuthToken();
    if (token) qp.set('token', token);
    window.open(`${API_BASE_URL}/invoices/${id}/print?${qp.toString()}`, '_blank');
  };

  const downloadPdf = (inv, format = 'a4') => {
    const id = inv._id || inv.id;
    const qp = new URLSearchParams({ format, download: '1' });
    const token = getAuthToken();
    if (token) qp.set('token', token);
    window.open(`${API_BASE_URL}/invoices/${id}/pdf?${qp.toString()}`, '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptLong /> Invoices
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Paper"
            value={paper}
            onChange={(e) => {
              const next = e.target.value;
              setPaper(next);
              try { localStorage.setItem('printPaper', next); } catch { /* ignore */ }
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="a4">A4</MenuItem>
            <MenuItem value="thermal">Thermal 80mm</MenuItem>
          </TextField>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchInvoices}>Refresh</Button>
        </Box>
      </Box>

      {error && (
        <ErrorState
          title="Couldn't load invoices"
          message={error}
          onRetry={fetchInvoices}
        />
      )}

      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Search invoices"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="issued">Issued</MenuItem>
            <MenuItem value="void">Void</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Card>
        <ResponsiveTable
          rows={visibleInvoices}
          loading={loading}
          emptyMessage="No invoices"
          columns={[
            { label: 'Invoice #', sortKey: 'invoiceNumber' },
            { label: 'Date', sortKey: 'issuedAt' },
            { label: 'Status' },
            { label: 'Taxable', align: 'right' },
            { label: 'CGST+SGST', align: 'right' },
            { label: 'Total', align: 'right', sortKey: 'grandTotal' },
            { label: '', align: 'center' },
          ]}
          renderRow={(inv) => {
            const tax = Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.igstAmount || 0);
            return (
              <TableRow key={inv._id || inv.id} hover>
                <TableCell>
                  <Button size="medium" onClick={() => openInvoice(inv)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                    {inv.invoiceNumber}
                  </Button>
                </TableCell>
                <TableCell>{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell>
                  <Chip size="small" color={statusColor(inv.status)} label={inv.status} />
                </TableCell>
                <TableCell align="right">{formatMoney(inv.taxableAmount)}</TableCell>
                <TableCell align="right">{formatMoney(tax)}</TableCell>
                <TableCell align="right">{formatMoney(inv.grandTotal)}</TableCell>
                <TableCell align="center">
                  <Button size="medium" startIcon={<Print />} onClick={() => printInvoice(inv)}>Print</Button>
                  <Button size="medium" startIcon={<Download />} onClick={() => downloadPdf(inv, 'a4')}>PDF</Button>
                </TableCell>
              </TableRow>
            );
          }}
          renderCard={(inv) => {
            const tax = Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.igstAmount || 0);
            return (
              <Card key={inv._id || inv.id} sx={{ mx: 2, mb: 1.5 }}>
                <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {inv.invoiceNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleString() : '—'}
                      </Typography>
                    </Box>
                    <Chip size="small" color={statusColor(inv.status)} label={inv.status} />
                  </Box>
                  <Typography variant="body2">
                    Taxable: <strong>{formatMoney(inv.taxableAmount)}</strong> ·
                    CGST+SGST: <strong>{formatMoney(tax)}</strong>
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Total: {formatMoney(inv.grandTotal)}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Button size="medium" startIcon={<Print />} onClick={() => printInvoice(inv)}>Print</Button>
                    <Button size="medium" startIcon={<Download />} onClick={() => downloadPdf(inv, 'a4')}>PDF</Button>
                  </Box>
                </CardContent>
              </Card>
            );
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            count={Math.max(1, Math.ceil(total / limit))}
            page={page}
            onChange={(_, p) => setPage(p)}
          />
        </Box>
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Invoice — {selected?.invoiceNumber}</DialogTitle>
        <DialogContent>
          {selected && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}><Typography><strong>Status:</strong> {selected.status}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>FY:</strong> {selected.fiscalYear}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>Taxable:</strong> {formatMoney(selected.taxableAmount)}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>CGST:</strong> {formatMoney(selected.cgstAmount)}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>SGST:</strong> {formatMoney(selected.sgstAmount)}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>IGST:</strong> {formatMoney(selected.igstAmount)}</Typography></Grid>
                <Grid item xs={12}><Typography variant="h6">Total: {formatMoney(selected.grandTotal)}</Typography></Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">{selected.amountInWords}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Button size="small" variant="outlined" startIcon={<Print />} onClick={() => printInvoice(selected, 'a4')}>Print A4</Button>
                <Button size="small" variant="outlined" startIcon={<Print />} onClick={() => printInvoice(selected, 'thermal')}>Print thermal</Button>
                <Button size="small" variant="outlined" startIcon={<Download />} onClick={() => downloadPdf(selected, 'thermal80')}>PDF 80mm</Button>
                <Button size="small" variant="outlined" startIcon={<Download />} onClick={() => downloadPdf(selected, 'thermal58')}>PDF 58mm</Button>
              </Box>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>History</Typography>
              {historyLoading && <LinearProgress />}
              {!historyLoading && history.length === 0 && (
                <Typography variant="body2" color="text.secondary">No activity yet</Typography>
              )}
              {!historyLoading && history.map((h) => (
                <Box key={h._id} sx={{ mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">{h.action}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {h.actorType}{h.requestId ? ` · ${String(h.requestId).slice(0, 8)}` : ''}
                  </Typography>
                </Box>
              ))}
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

export default AdminInvoices;
