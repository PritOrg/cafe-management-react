import { createTheme, alpha, lighten, darken } from '@mui/material/styles';

const HEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

const normalizeHex = (hex, fallback) => {
  const value = String(hex || '').trim();
  if (!HEX.test(value)) return fallback;
  return value.startsWith('#') ? value : `#${value}`;
};

const relativeLuminance = (hex) => {
  const channels = normalizeHex(hex, '#ff6b35')
    .slice(1)
    .match(/.{2}/g)
    .map((h) => parseInt(h, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

/** Pick a Material 3 accessible "on" color for a seed color. */
export const onColor = (hex) => (relativeLuminance(hex) > 0.5 ? '#1D1B20' : '#FFFFFF');

/**
 * Build a Material 3-flavoured MUI theme from a brand seed color.
 * Approximation of Material You: tonal surfaces, Roboto, 12–28px shapes,
 * filled buttons, and an active-indicator navigation bar.
 */
export const buildTheme = (mode, primarySeed, accentSeed) => {
  const primary = normalizeHex(primarySeed, '#ff6b35');
  const accent = normalizeHex(accentSeed, '#f7931e');
  const dark = mode === 'dark';

  const onPrimary = onColor(primary);
  const onAccent = onColor(accent);

  // Tonal surfaces derived from the seed (subtle brand tint, like Material You).
  const surface = dark ? '#1D1B20' : '#FFFFFF';
  const surfaceVariant = dark ? '#2B2930' : alpha(primary, 0.05);
  const background = dark ? '#141218' : '#FEF7FF';

  const textPrimary = dark ? '#E6E0E9' : '#1D1B20';
  const textSecondary = dark ? '#CAC4D0' : '#49454F';
  const divider = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary,
        light: lighten(primary, 0.28),
        dark: darken(primary, 0.22),
        contrastText: onPrimary,
      },
      secondary: {
        main: accent,
        light: lighten(accent, 0.28),
        dark: darken(accent, 0.22),
        contrastText: onAccent,
      },
      error: { main: '#B3261E', contrastText: '#FFFFFF' },
      warning: { main: '#F2B300', contrastText: '#1D1B20' },
      info: { main: '#00639C', contrastText: '#FFFFFF' },
      success: { main: '#146C2E', contrastText: '#FFFFFF' },
      background: { default: background, paper: surface },
      text: { primary: textPrimary, secondary: textSecondary, disabled: dark ? '#79747E' : '#A5A0A8' },
      divider,
      action: {
        hover: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        selected: dark ? alpha(primary, 0.24) : alpha(primary, 0.12),
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Outfit Variable", "Outfit", system-ui, -apple-system, "Segoe UI", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.5px' },
      h2: { fontWeight: 700, letterSpacing: '-0.25px' },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700, letterSpacing: '-0.25px' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0.1 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { colorScheme: mode, scrollBehavior: 'smooth' },
          body: { WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility' },
          '::selection': { backgroundColor: alpha(primary, 0.24) },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'default' },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: surface,
            color: textPrimary,
            borderBottom: `1px solid ${divider}`,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 999, padding: '8px 20px' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: 16 },
          elevation1: {
            boxShadow: dark
              ? '0 1px 3px rgba(0,0,0,0.4)'
              : '0 1px 2px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${divider}`,
            backgroundColor: dark ? surfaceVariant : surface,
            backgroundImage: 'none',
            overflow: 'hidden',
            transition: 'box-shadow .2s ease, transform .2s ease',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: { borderRadius: 999 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 28 },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            '& .MuiSvgIcon-root': { transition: 'background-color .2s ease' },
            '&.Mui-selected .MuiSvgIcon-root': {
              backgroundColor: alpha(primary, dark ? 0.32 : 0.16),
              borderRadius: 999,
              padding: '3px 14px',
              boxSizing: 'content-box',
            },
          },
          label: { fontSize: '0.72rem' },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: '0.75rem' },
        },
      },
    },
  });
};

export default buildTheme;
