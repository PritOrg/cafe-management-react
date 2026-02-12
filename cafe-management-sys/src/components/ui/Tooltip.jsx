import React from 'react';
import { Tooltip as MuiTooltip, Zoom } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTooltip = styled(({ className, ...props }) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1, 1.5),
    maxWidth: 300,
    boxShadow: theme.shadows[8],
    
    '&.MuiTooltip-tooltipArrow': {
      '&:before': {
        backgroundColor: theme.palette.grey[900],
      },
    },
  },
  
  '& .MuiTooltip-arrow': {
    color: theme.palette.grey[900],
  },
}));

const Tooltip = ({
  children,
  title,
  placement = 'top',
  arrow = true,
  enterDelay = 500,
  leaveDelay = 0,
  enterTouchDelay = 700,
  leaveTouchDelay = 1500,
  TransitionComponent = Zoom,
  followCursor = false,
  disableHoverListener = false,
  disableFocusListener = false,
  disableTouchListener = false,
  sx = {},
  ...props
}) => {
  // Don't render tooltip if title is empty
  if (!title) {
    return children;
  }

  return (
    <StyledTooltip
      title={title}
      placement={placement}
      arrow={arrow}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      enterTouchDelay={enterTouchDelay}
      leaveTouchDelay={leaveTouchDelay}
      TransitionComponent={TransitionComponent}
      followCursor={followCursor}
      disableHoverListener={disableHoverListener}
      disableFocusListener={disableFocusListener}
      disableTouchListener={disableTouchListener}
      sx={sx}
      {...props}
    >
      {children}
    </StyledTooltip>
  );
};

export default Tooltip;
