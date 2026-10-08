import React, { memo, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Badge from '@mui/material/Badge';
import Paper from '@mui/material/Paper';
import CartContext from '../CartContext';
import { CUSTOMER_BOTTOM_NAV } from '../../constants/navigation';

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { cartCount = 0 } = useContext(CartContext) || {};

  const activeIndex = CUSTOMER_BOTTOM_NAV.findIndex((item) => item.match(pathname));

  return (
    <Paper
      square
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        display: { xs: 'block', md: 'none' },
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={activeIndex === -1 ? false : activeIndex}
        onChange={(_, index) => {
          const item = CUSTOMER_BOTTOM_NAV[index];
          if (item) navigate(item.href);
        }}
        sx={{
          height: 58,
          bgcolor: 'background.paper',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 44,
            py: 0.5,
            '&.Mui-selected': { color: 'primary.main' },
          },
        }}
      >
        {CUSTOMER_BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const count = item.badge === 'cart' ? cartCount : 0;
          return (
            <BottomNavigationAction
              key={item.key}
              label={item.label}
              icon={
                count > 0 ? (
                  <Badge badgeContent={count} color="primary" max={99} overlap="circular">
                    <Icon />
                  </Badge>
                ) : (
                  <Icon />
                )
              }
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
};

export default memo(BottomNav);
