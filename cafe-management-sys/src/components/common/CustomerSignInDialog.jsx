import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  IconButton,
  Stack,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import { useCustomer } from '../../contexts/CustomerContext';

/**
 * Password-less customer sign-in: just a phone number (name optional).
 * Used to link orders to a guest and to surface their order history.
 */
const CustomerSignInDialog = ({ open, onClose }) => {
  const { phone, name, setCustomer } = useCustomer();
  const [form, setForm] = useState({ phone: phone || '', name: name || '' });

  const valid = String(form.phone).replace(/\D/g, '').length >= 10;

  const change = (event) => {
    const { name: field, value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!valid) return;
    setCustomer({ phone: form.phone, name: form.name });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
      <form onSubmit={submit}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          Sign in
          <IconButton onClick={onClose} aria-label="Close"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your phone number to see your orders — no password needed.
          </Typography>
          <Stack spacing={2}>
            <TextField
              autoFocus
              fullWidth
              label="Phone number"
              name="phone"
              value={form.phone}
              onChange={change}
              inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment> }}
            />
            <TextField
              fullWidth
              label="Name (optional)"
              name="name"
              value={form.name}
              onChange={change}
              autoComplete="name"
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={!valid}>Continue</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CustomerSignInDialog;
