import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Slide,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    margin: theme.spacing(2),
    width: '100%',
    maxHeight: 'calc(100vh - 32px)',
  },
  
  '& .MuiDialogTitle-root': {
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
    '&:first-of-type': {
      paddingTop: theme.spacing(3),
    },
  },
  
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    gap: theme.spacing(1),
  },
}));

const Modal = ({
  open = false,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
  showCloseButton = true,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleClose = (event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
      return;
    }
    onClose?.(event, reason);
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen || isMobile}
      TransitionComponent={Transition}
      sx={sx}
      {...props}
    >
      {title && (
        <DialogTitle>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {showCloseButton && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                color: 'grey.500',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      
      <DialogContent dividers={Boolean(title && actions)}>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </StyledDialog>
  );
};

export default Modal;
