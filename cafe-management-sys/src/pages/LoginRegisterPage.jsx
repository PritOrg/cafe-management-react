import React, { useState } from 'react';
import { Container, Typography, Button, TextField, Box, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, } from '@mui/material';
import Swal from 'sweetalert2';
import { landingPageStyle } from './LandingPage';

const LoginRegisterPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('customer');
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
    const customerApiUrl = 'http://localhost:4969/customer';
    const staffApiUrl = 'http://localhost:4969/staff-admin';

    const handleTabChange = (event, newValue) => {
        setIsLogin(newValue === 'login');
    };

    const handleRoleChange = (event) => {
        setRole(event.target.value);
    };

    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleLoginSubmit = async () => {
        const loginUrl = role === 'customer' ? `${customerApiUrl}/login` : `${staffApiUrl}/login`;

        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            Swal.fire({
                icon: 'success',
                title: 'Login successful!',
                showConfirmButton: false,
                timer: 1500
            });
            sessionStorage.setItem('token', data.token);
            setLoginData({ email: '', password: '' });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: error.message
            });
        }
    };

    const handleRegisterSubmit = async () => {
        const registerUrl = role === 'customer' ? `${customerApiUrl}/register` : `${staffApiUrl}/register`;

        const payload = role === 'customer' ? registerData : { ...registerData, role };

        try {
            const response = await fetch(registerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            Swal.fire({
                icon: 'success',
                title: 'Registration successful! Please login.',
                showConfirmButton: false,
                timer: 1500 // Close after 1.5 seconds
            });
            setRegisterData({ firstName: '', lastName: '', phone: '', email: '', password: '' });
            setIsLogin(true); // Switch to login form after successful registration
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: error.message
            });
        }
    };

    const formStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // semi-transparent background
        backdropFilter: 'blur(18px)', // blur effect
        borderRadius: 8,
        padding: '2rem',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        maxWidth: '90%',
        maxHeight: '90%', // Ensures the box doesn't take up too much width on smaller screens
        margin: 'auto', // Center the box
        textAlign: 'center',
    };

    return (
        <Box>
            <Box sx={landingPageStyle}>
                <Container maxWidth="sm" sx={{ margin: 2 }}>
                    <Box sx={formStyle} >
                        <Tabs value={isLogin ? 'login' : 'register'} onChange={handleTabChange} centered>
                            <Tab label="Login" value="login" />
                            <Tab label="Register" value="register" />
                        </Tabs>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ margin: 2 }}>
                            {isLogin ? 'Login' : 'Register'}
                        </Typography>
                        <FormControl fullWidth sx={{ my: 2 }}>
                            <InputLabel id="role-select-label">Role</InputLabel>
                            <Select
                                labelId="role-select-label"
                                value={role}
                                label="Role"
                                onChange={handleRoleChange}
                            >
                                <MenuItem value="customer">Customer</MenuItem>
                                <MenuItem value="staff">Staff</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                        </FormControl>
                        {isLogin ? (
                            <>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    margin="normal"
                                    variant="outlined"
                                    value={loginData.email}
                                    onChange={handleLoginChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type="password"
                                    margin="normal"
                                    variant="outlined"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    onClick={handleLoginSubmit}
                                >
                                    Login
                                </Button>
                            </>
                        ) : (
                            <>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    name="firstName"
                                    margin="normal"
                                    variant="outlined"
                                    value={registerData.firstName}
                                    onChange={handleRegisterChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    name="lastName"
                                    margin="normal"
                                    variant="outlined"
                                    value={registerData.lastName}
                                    onChange={handleRegisterChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    name="phone"
                                    margin="normal"
                                    variant="outlined"
                                    value={registerData.phone}
                                    onChange={handleRegisterChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    margin="normal"
                                    variant="outlined"
                                    value={registerData.email}
                                    onChange={handleRegisterChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Password"
                                    name="password"
                                    type="password"
                                    margin="normal"
                                    variant="outlined"
                                    value={registerData.password}
                                    onChange={handleRegisterChange}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    onClick={handleRegisterSubmit}
                                >
                                    Register
                                </Button>
                            </>
                        )}
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default LoginRegisterPage;
