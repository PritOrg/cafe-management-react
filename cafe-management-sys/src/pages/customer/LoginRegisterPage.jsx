import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  IconButton,
  useTheme,
  alpha,
  Avatar,
  CircularProgress,
  Chip
} from '@mui/material';
import Swal from 'sweetalert2';
import {
  Email,
  Lock,
  Person,
  Phone,
  Visibility,
  VisibilityOff,
  Coffee,
  Close,
  ArrowForward,
  PhotoCamera,
} from '@mui/icons-material';

import Grid2 from '@mui/material/Unstable_Grid2';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const LoginRegisterPage = () => {
  const theme = useTheme();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    profilePhoto: null
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');

  const showSuccessPopup = (message) => {
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      confirmButtonColor: roleInfo.color,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      showClass: {
        popup: 'animate__animated animate__slideInRight'
      },
      hideClass: {
        popup: 'animate__animated animate__slideOutRight'
      }
    });
  };

  const showErrorPopup = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: message,
      confirmButtonColor: roleInfo.color,
      confirmButtonText: 'Try Again',
      showClass: {
        popup: 'animate__animated animate__shakeX'
      }
    });
  };

  const showValidationErrorPopup = (errors) => {
    const errorList = Object.values(errors).join('\n• ');
    Swal.fire({
      icon: 'warning',
      title: 'Please check your input',
      html: `<div style="text-align: left;">• ${Object.values(errors).join('<br>• ')}</div>`,
      confirmButtonColor: roleInfo.color,
      confirmButtonText: 'Got it'
    });
  };
  const handleTabChange = (event, newValue) => {
    setIsLogin(newValue === 'login');
    setFieldErrors({});
  };

  const handleRoleChange = (event) => {
    setRole(event.target.value);
    setFieldErrors({});
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevData) => ({ ...prevData, [name]: value }));

    // Clear field-specific error
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prevData) => ({ ...prevData, [name]: value }));

    // Clear field-specific error
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showErrorPopup('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorPopup('Profile photo must be less than 5MB');
        return;
      }

      setRegisterData(prev => ({ ...prev, profilePhoto: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);

    }
  };

  const removeProfilePhoto = () => {
    setRegisterData(prev => ({ ...prev, profilePhoto: null }));
    setProfilePhotoPreview('');
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validateLoginForm = () => {
    const errors = {};

    if (!loginData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!loginData.password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);

    // Show popup for validation errors
    if (Object.keys(errors).length > 0) {
      showValidationErrorPopup(errors);
    }

    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = () => {
    const errors = {};

    // First name validation (2-50 characters)
    if (!registerData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (registerData.firstName.trim().length < 2 || registerData.firstName.trim().length > 50) {
      errors.firstName = 'First name must be between 2 and 50 characters';
    }

    // Last name validation (2-50 characters)
    if (!registerData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (registerData.lastName.trim().length < 2 || registerData.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be between 2 and 50 characters';
    }

    // Email validation
    if (!registerData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (registerData.email.length > 254) {
      errors.email = 'Email address is too long';
    }

    // Enhanced password validation to match server requirements
    if (!registerData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(registerData.password)) {
        errors.password = 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
      }
    }

    // Phone validation (enhanced)
    if (registerData.phone && registerData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = registerData.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Please enter a valid phone number (e.g., +1234567890)';
      }
    }

    setFieldErrors(errors);

    // Show popup for validation errors
    if (Object.keys(errors).length > 0) {
      showValidationErrorPopup(errors);
    }

    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async () => {
    if (!validateLoginForm()) return;

    setLoading(true);

    try {
      // Use the API service for consistent error handling
      const responseData = await authAPI.login(loginData);

      // Extract data from the standardized response format
      const { data } = responseData;

      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response format from server');
      }

      // Use AuthContext login method for proper authentication management
      const loginSuccess = login(data.user, data.token, data.userType);

      if (!loginSuccess) {
        throw new Error('Failed to store authentication data');
      }

      showSuccessPopup(responseData.message || 'Login successful! Redirecting to your dashboard...');
      setLoginData({ email: '', password: '' });

      // Redirect based on user type after a short delay
      setTimeout(() => {
        if (data.userType === 'customer') {
          window.location.href = '/menu';
        } else {
          // Staff or Admin (userType is 'staffOrAdmin')
          window.location.href = '/admin';
        }
      }, 1500);

    } catch (error) {
      console.error('Login error:', error);
      showErrorPopup(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!validateRegisterForm()) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('firstName', registerData.firstName.trim());
      formData.append('lastName', registerData.lastName.trim());
      formData.append('email', registerData.email.toLowerCase().trim());
      formData.append('password', registerData.password);

      // Only append phone if it's provided and not empty
      if (registerData.phone && registerData.phone.trim()) {
        formData.append('phone', registerData.phone.trim());
      }

      if (registerData.profilePhoto) {
        formData.append('profilePhoto', registerData.profilePhoto);
      }

      // Use the appropriate API service method
      let responseData;
      if (role === 'customer') {
        responseData = await authAPI.registerCustomer(formData);
      } else {
        formData.append('role', role);
        responseData = await authAPI.registerStaff(formData);
      }

      showSuccessPopup(responseData.message || 'Registration successful! You can now login with your new account.');
      setRegisterData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        profilePhoto: null
      });
      setProfilePhotoPreview('');

      // Switch to login tab after successful registration
      setTimeout(() => {
        setIsLogin(true);
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      showErrorPopup(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  // Get role-specific colors and labels
  const getRoleInfo = () => {
    switch (role) {
      case 'admin':
        return {
          color: theme.palette.error.main,
          label: 'Administrator',
          description: 'Full system access and management'
        };
      case 'staff':
        return {
          color: theme.palette.info.main,
          label: 'Staff Member',
          description: 'Order management and customer service'
        };
      default:
        return {
          color: theme.palette.primary.main,
          label: 'Customer',
          description: 'Browse menu and place orders'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.light, 0.15)} 0%, 
                    ${alpha(theme.palette.primary.main, 0.05)} 50%,
                    ${theme.palette.background.default} 100%)`,
        padding: { xs: 2, sm: 4 }
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={4}
          sx={{
            overflow: 'hidden',
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              p: 3,
              background: `linear-gradient(to right, ${roleInfo.color}, ${alpha(roleInfo.color, 0.8)})`,
              color: 'white',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'white',
                width: 56,
                height: 56,
                margin: '0 auto 16px',
                border: '2px solid white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <Coffee fontSize="large" sx={{ color: roleInfo.color }} />
            </Avatar>
            <Typography variant="h5" component="h1" fontWeight="bold">
              Café Management System
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </Typography>

            {/* Role Chip */}
            <Chip
              label={roleInfo.label}
              size="small"
              sx={{
                mt: 2,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* Tabs */}
          <Tabs
            value={isLogin ? 'login' : 'register'}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                py: 2
              },
              '& .Mui-selected': {
                color: roleInfo.color,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: roleInfo.color,
                height: 3
              }
            }}
          >
            <Tab label="Login" value="login" />
            <Tab label="Register" value="register" />
          </Tabs>


          {/* Form Content */}
          <Box
            sx={{
              p: 4,
              background: `linear-gradient(135deg, ${alpha(roleInfo.color, 0.05)} 0%, ${alpha(roleInfo.color, 0.02)} 100%)`
            }}
          >
            {/* Role Selection */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="role-select-label">I am a</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={role}
                  label="I am a"
                  onChange={handleRoleChange}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(roleInfo.color, 0.5),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: roleInfo.color,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: roleInfo.color,
                    }
                  }}
                >
                  <MenuItem value="customer">
                    <Box>
                      <Typography variant="body1">Customer</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Browse menu and place orders
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="staff">
                    <Box>
                      <Typography variant="body1">Staff Member</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Order management and customer service
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="admin">
                    <Box>
                      <Typography variant="body1">Administrator</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Full system access and management
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {isLogin ? (
              // Login Form
              <Box>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  margin="normal"
                  variant="outlined"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  disabled={loading}
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: roleInfo.color,
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: roleInfo.color,
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  variant="outlined"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  disabled={loading}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleClickShowPassword}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: roleInfo.color,
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: roleInfo.color,
                    }
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      cursor: 'pointer',
                      color: roleInfo.color,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Forgot password?
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleLoginSubmit}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    backgroundColor: roleInfo.color,
                    '&:hover': {
                      backgroundColor: alpha(roleInfo.color, 0.9),
                    },
                    '&:disabled': {
                      backgroundColor: alpha(roleInfo.color, 0.5),
                    },
                    boxShadow: `0 4px 12px ${alpha(roleInfo.color, 0.3)}`
                  }}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </Box>
            ) : (
              // Register Form
              <Box>
                {/* Profile Photo Upload */}
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-photo-upload"
                    type="file"
                    onChange={handleProfilePhotoChange}
                    disabled={loading}
                  />
                  <label htmlFor="profile-photo-upload">
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-block',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Avatar
                        src={profilePhotoPreview}
                        sx={{
                          width: 80,
                          height: 80,
                          border: `2px dashed ${alpha(roleInfo.color, 0.5)}`,
                          backgroundColor: alpha(roleInfo.color, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(roleInfo.color, 0.2),
                          }
                        }}
                      >
                        <PhotoCamera sx={{ color: roleInfo.color }} />
                      </Avatar>
                      {profilePhotoPreview && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            removeProfilePhoto();
                          }}
                          sx={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            backgroundColor: 'error.main',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'error.dark',
                            }
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    {profilePhotoPreview ? 'Click to change photo' : 'Click to add profile photo (optional)'}
                  </Typography>
                </Box>

                <Grid2 container spacing={2}>
                  <Grid2 xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      margin="normal"
                      variant="outlined"
                      value={registerData.firstName}
                      onChange={handleRegisterChange}
                      disabled={loading}
                      error={!!fieldErrors.firstName}
                      helperText={fieldErrors.firstName}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: roleInfo.color,
                          }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: roleInfo.color,
                        }
                      }}
                    />
                  </Grid2>
                  <Grid2 xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      margin="normal"
                      variant="outlined"
                      value={registerData.lastName}
                      onChange={handleRegisterChange}
                      disabled={loading}
                      error={!!fieldErrors.lastName}
                      helperText={fieldErrors.lastName}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: roleInfo.color,
                          }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: roleInfo.color,
                        }
                      }}
                    />
                  </Grid2>
                </Grid2>

                <TextField
                  fullWidth
                  label="Phone Number (Optional)"
                  name="phone"
                  margin="normal"
                  variant="outlined"
                  value={registerData.phone}
                  onChange={handleRegisterChange}
                  disabled={loading}
                  error={!!fieldErrors.phone}
                  helperText={fieldErrors.phone || 'e.g., +1234567890 or (123) 456-7890'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: roleInfo.color,
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: roleInfo.color,
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  margin="normal"
                  variant="outlined"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  disabled={loading}
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: roleInfo.color,
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: roleInfo.color,
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  margin="normal"
                  variant="outlined"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  disabled={loading}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password || 'Minimum 8 characters with uppercase, lowercase, number, and special character'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleClickShowPassword}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: roleInfo.color,
                      }
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: roleInfo.color,
                    }
                  }}
                />

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    mt: 3,
                    py: 1.5,
                    backgroundColor: roleInfo.color,
                    '&:hover': {
                      backgroundColor: alpha(roleInfo.color, 0.9),
                    },
                    '&:disabled': {
                      backgroundColor: alpha(roleInfo.color, 0.5),
                    },
                    boxShadow: `0 4px 12px ${alpha(roleInfo.color, 0.3)}`
                  }}
                  onClick={handleRegisterSubmit}
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 3,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <Button
                sx={{
                  ml: 1,
                  color: roleInfo.color,
                  fontWeight: 'bold',
                }}
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginRegisterPage;