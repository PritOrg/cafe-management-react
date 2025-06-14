import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledListItemButton = styled(ListItemButton)(({ theme, active }) => ({
  borderRadius: theme.spacing(2),
  margin: theme.spacing(0.5, 0),
  transition: 'all 0.2s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  
  ...(active && {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
    color: theme.palette.primary.main,
    fontWeight: 600,
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
    
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: '60%',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '0 2px 2px 0',
    },
    
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  }),
  
  ...(!active && {
    '&:hover': {
      backgroundColor: alpha(theme.palette.action.hover, 0.8),
      transform: 'translateX(4px)',
      
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
      },
    },
  }),
}));

const StyledChip = styled(Chip)(({ theme, variant }) => ({
  height: 20,
  fontSize: '0.75rem',
  fontWeight: 600,
  minWidth: 20,
  
  ...(variant === 'error' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    animation: 'pulse 2s infinite',
  }),
  
  ...(variant === 'warning' && {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  }),
  
  ...(variant === 'default' && {
    backgroundColor: alpha(theme.palette.text.secondary, 0.1),
    color: theme.palette.text.secondary,
  }),
  
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.4)}`,
    },
    '70%': {
      boxShadow: `0 0 0 6px ${alpha(theme.palette.error.main, 0)}`,
    },
    '100%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}`,
    },
  },
}));

export default function AdminSidebarItem({ item, currentPath }) {
  const theme = useTheme();
  const isActive = currentPath === item.href;
  const Icon = item.icon;

  // Determine badge variant based on content
  const getBadgeVariant = (badge) => {
    if (!badge) return null;
    const numValue = parseInt(badge);
    if (numValue > 10) return 'error';
    if (numValue > 5) return 'warning';
    return 'default';
  };

  const handleClick = () => {
    // In a real app, you'd use your router here
    // For example: navigate(item.href) or history.push(item.href)
    console.log(`Navigating to: ${item.href}`);
  };

  return (
    <ListItem disablePadding>
      <StyledListItemButton
        active={isActive}
        onClick={handleClick}
        sx={{
          pl: 3,
          pr: 2,
          py: 1.5,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 40,
            color: isActive ? 'primary.main' : 'text.secondary',
            transition: 'color 0.2s ease-in-out',
          }}
        >
          <Icon fontSize="small" />
        </ListItemIcon>
        
        <ListItemText
          primary={item.title}
          primaryTypographyProps={{
            fontSize: '0.875rem',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'primary.main' : 'text.primary',
          }}
        />
        
        {item.badge && (
          <StyledChip
            label={item.badge}
            size="small"
            variant={getBadgeVariant(item.badge)}
          />
        )}
      </StyledListItemButton>
    </ListItem>
  );
}