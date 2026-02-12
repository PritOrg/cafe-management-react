import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Inbox as InboxIcon,
  SearchOff as SearchOffIcon,
  ErrorOutline as ErrorIcon,
  CloudOff as CloudOffIcon,
  ShoppingCart as CartIcon,
  Restaurant as RestaurantIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledEmptyContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6, 4),
  textAlign: 'center',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `2px dashed ${theme.palette.divider}`,
  minHeight: 300,
}));

const IconContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiSvgIcon-root': {
    fontSize: 80,
    color: theme.palette.text.disabled,
    opacity: 0.5,
  },
}));

const getIcon = (type) => {
  const iconMap = {
    default: InboxIcon,
    search: SearchOffIcon,
    error: ErrorIcon,
    offline: CloudOffIcon,
    cart: CartIcon,
    menu: RestaurantIcon,
    users: PeopleIcon,
  };
  
  return iconMap[type] || iconMap.default;
};

const EmptyState = ({
  type = 'default',
  title = 'No data available',
  description = 'There is nothing to display at the moment.',
  icon: CustomIcon,
  action,
  actionText = 'Try again',
  onAction,
  showAction = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const IconComponent = CustomIcon || getIcon(type);

  const getDefaultContent = (type) => {
    switch (type) {
      case 'search':
        return {
          title: 'No results found',
          description: 'Try adjusting your search criteria or filters.',
        };
      case 'error':
        return {
          title: 'Something went wrong',
          description: 'We encountered an error while loading the data.',
        };
      case 'offline':
        return {
          title: 'No internet connection',
          description: 'Please check your connection and try again.',
        };
      case 'cart':
        return {
          title: 'Your cart is empty',
          description: 'Add some delicious items to your cart to get started.',
        };
      case 'menu':
        return {
          title: 'No menu items',
          description: 'There are no menu items available at the moment.',
        };
      case 'users':
        return {
          title: 'No users found',
          description: 'There are no users to display.',
        };
      default:
        return { title, description };
    }
  };

  const content = getDefaultContent(type);

  return (
    <StyledEmptyContainer elevation={0} sx={sx} {...props}>
      <IconContainer>
        <IconComponent />
      </IconContainer>
      
      <Typography
        variant="h6"
        color="text.primary"
        gutterBottom
        sx={{ fontWeight: 600, mb: 1 }}
      >
        {title || content.title}
      </Typography>
      
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {description || content.description}
      </Typography>
      
      {(showAction || action) && (
        action || (
          <Button
            variant="contained"
            color="primary"
            onClick={onAction}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {actionText}
          </Button>
        )
      )}
    </StyledEmptyContainer>
  );
};

export default EmptyState;
