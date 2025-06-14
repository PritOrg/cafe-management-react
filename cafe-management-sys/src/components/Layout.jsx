import React from 'react'
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'
import { createTheme, ThemeProvider } from '@mui/material/styles';
const theme = createTheme({
  palette: {
    primary: {
      main: '#8B4513', // Coffee brown as primary color
      light: '#A67B5B',
      dark: '#6A3400',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#D4A574', // Warm golden brown
      light: '#E6C2A6',
      dark: '#B8956A',
      contrastText: '#333333',
    },
    accent: {
      main: '#F4A460', // Sandy brown accent
      light: '#F7B885',
      dark: '#E0944A',
    },
    background: {
      default: '#FBF8F5', // Warm off-white
      paper: '#FFFFFF',
      secondary: '#F5F2ED', // Light coffee cream
      tertiary: '#FAF7F2', // Even lighter cream
    },
    text: {
      primary: '#2C1810', // Rich dark brown
      secondary: '#5D4E37', // Medium coffee brown
      tertiary: '#8B7355', // Light coffee brown
      hint: '#A0937A', // Very light coffee brown
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#F44336',
      light: '#EF5350',
      dark: '#D32F2F',
    },
    divider: 'rgba(139, 69, 19, 0.12)',
    neutral: {
      100: '#F8F6F3',
      200: '#F0EDE8',
      300: '#E8E3DD',
      400: '#D1C7BD',
      500: '#A69B8F',
    }
  },
  typography: {
    fontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.75rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.25rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.875rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.005em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.4,
    },
    body1: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '0.875rem',
      letterSpacing: '0.01em',
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: '#8B7355',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 8px rgba(139, 69, 19, 0.06)',
    '0px 4px 12px rgba(139, 69, 19, 0.08)',
    '0px 6px 16px rgba(139, 69, 19, 0.10)',
    '0px 8px 24px rgba(139, 69, 19, 0.12)',
    '0px 12px 32px rgba(139, 69, 19, 0.15)',
    '0px 16px 40px rgba(139, 69, 19, 0.18)',
    '0px 20px 48px rgba(139, 69, 19, 0.20)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontWeight: 600,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          textTransform: 'none',
          position: 'relative',
          overflow: 'hidden',
        },
        contained: {
          boxShadow: '0px 4px 16px rgba(139, 69, 19, 0.25)',
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(139, 69, 19, 0.35)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6A3400 0%, #8B4513 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: '#8B4513',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(139, 69, 19, 0.08)',
            borderColor: '#6A3400',
            transform: 'translateY(-1px)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(139, 69, 19, 0.06)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0px 4px 20px rgba(139, 69, 19, 0.08)',
          border: '1px solid rgba(139, 69, 19, 0.06)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0px 12px 40px rgba(139, 69, 19, 0.15)',
            transform: 'translateY(-6px)',
            border: '1px solid rgba(139, 69, 19, 0.12)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          fontWeight: 500,
          fontSize: '0.75rem',
          padding: '4px 8px',
          transition: 'all 0.2s ease-in-out',
        },
        colorPrimary: {
          backgroundColor: '#8B4513',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#6A3400',
          },
        },
        outlined: {
          borderColor: '#8B4513',
          color: '#8B4513',
          '&:hover': {
            backgroundColor: 'rgba(139, 69, 19, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FAF7F2',
            transition: 'all 0.3s ease-in-out',
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(139, 69, 19, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#8B4513',
              borderWidth: '2px',
            },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 4px 12px rgba(139, 69, 19, 0.1)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#FAF7F2',
          transition: 'all 0.3s ease-in-out',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(139, 69, 19, 0.2)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8B4513',
            borderWidth: '2px',
          },
          '&.Mui-focused': {
            backgroundColor: '#FFFFFF',
            boxShadow: '0px 4px 12px rgba(139, 69, 19, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 4px 20px rgba(139, 69, 19, 0.08)',
        },
        elevation2: {
          boxShadow: '0px 8px 32px rgba(139, 69, 19, 0.12)',
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        root: {
          color: '#FF8C00',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: '0px 24px 80px rgba(139, 69, 19, 0.2)',
        },
      },
    },
  },
});
function Layout() {

  return (
    <>
      <ThemeProvider theme={theme}>

        <Navbar />
        <Outlet />
        <Footer />
      </ThemeProvider>
    </>
  )
}

export default Layout