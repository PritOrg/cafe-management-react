import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useThemeContext } from '../../contexts/ThemeContext';

/**
 * Custom ThemeProvider that uses the theme from ThemeContext
 * and provides it to the Material-UI components
 */
const ThemeProvider = ({ children }) => {
  const { mode } = useThemeContext();

  // Create theme based on mode (light/dark)
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#ff6b35',
            light: '#ff8c5f',
            dark: '#e54e00',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#f7931e',
            light: '#ffb04c',
            dark: '#c66a00',
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
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 700,
          },
          h3: {
            fontWeight: 600,
          },
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
          button: {
            fontWeight: 600,
            textTransform: 'none',
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '8px 16px',
                boxShadow: mode === 'light' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              },
              containedPrimary: {
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(255,107,53,0.4)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
              elevation1: {
                boxShadow: mode === 'light' 
                  ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)' 
                  : '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)',
              },
              elevation4: {
                boxShadow: mode === 'light' 
                  ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' 
                  : '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.12)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                overflow: 'hidden',
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 16,
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;