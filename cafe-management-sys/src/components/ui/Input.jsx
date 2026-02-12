import React from 'react';
import {
  TextField,
  InputAdornment,
  FormControl,
  FormLabel,
  FormHelperText,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    transition: 'all 0.2s ease-in-out',
    
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
      },
    },
    
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: 2,
      },
    },
  },
  
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
  
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    marginTop: theme.spacing(0.5),
  },
}));

const Input = React.forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error = false,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows = 4,
  startIcon,
  endIcon,
  showPasswordToggle = false,
  sx = {},
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;
  
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  const startAdornment = startIcon ? (
    <InputAdornment position="start">
      {startIcon}
    </InputAdornment>
  ) : null;
  
  const endAdornment = (endIcon || (isPasswordField && showPasswordToggle)) ? (
    <InputAdornment position="end">
      {endIcon}
      {isPasswordField && showPasswordToggle && (
        <IconButton
          aria-label="toggle password visibility"
          onClick={handleTogglePassword}
          edge="end"
          size="small"
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      )}
    </InputAdornment>
  ) : null;

  return (
    <StyledTextField
      ref={ref}
      label={label}
      type={inputType}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      variant="outlined"
      InputProps={{
        startAdornment,
        endAdornment,
      }}
      sx={sx}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
