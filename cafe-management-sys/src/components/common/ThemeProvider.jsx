import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useBrand } from '../../contexts/BrandContext';

/**
 * ThemeProvider — palette driven by tenant brand settings (white-label).
 */
const ThemeProvider = ({ children }) => {
  const { mode } = useThemeContext();
  const { brand } = useBrand();
  const primaryColor = brand?.primaryColor || '#ff6b35';
  const accentColor = brand?.accentColor || '#f7931e';

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: primaryColor,
            light: primaryColor,
            dark: primaryColor,
            contrastText: '#ffffff',
          },
          secondary: {
            main: accentColor,
            light: accentColor,
            dark: accentColor,
            contrastText: '#ffffff',
          },
          error: {
            main: '#f44336',
          },
          warning: {
            main: '#ff9800',
          },
          info: {
            main: '#2196f3',
          },
          success: {
            main: '#4caf50',
          },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
          text: {
            primary: mode === 'light' ? '#333333' : '#ffffff',
            secondary: mode === 'light' ? '#666666' : '#b0b0b0',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 600 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
          button: { fontWeight: 600, textTransform: 'none' },
        },
        shape: { borderRadius: 8 },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '8px 16px',
                boxShadow: mode === 'light' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: { backgroundImage: 'none' },
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)'
                  : '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: { borderRadius: 12, overflow: 'hidden' },
            },
          },
        },
      }),
    [mode, primaryColor, accentColor]
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;