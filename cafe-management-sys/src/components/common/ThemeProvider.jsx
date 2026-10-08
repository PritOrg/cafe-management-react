import React, { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useBrand } from '../../contexts/BrandContext';
import { buildTheme } from '../../utils/m3Theme';

/**
 * ThemeProvider — Material 3-flavoured palette driven by tenant brand settings.
 * The whole theme (palette + component shapes) is memoised so brand/theme
 * changes are the only thing that rebuilds it.
 */
const ThemeProvider = ({ children }) => {
  const { mode } = useThemeContext();
  const { brand } = useBrand();

  const theme = useMemo(
    () => buildTheme(mode, brand?.primaryColor || '#ff6b35', brand?.accentColor || '#f7931e'),
    [mode, brand?.primaryColor, brand?.accentColor]
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
