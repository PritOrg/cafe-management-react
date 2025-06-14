import React, { useState } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Box,
    Divider,
    Card,
    CardMedia,
    InputAdornment,
    Chip,
    Autocomplete,
    Snackbar,
    Alert,
    useTheme,
    alpha,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    RestaurantMenu,
    AccessTime,
    LocalOffer,
    AttachMoney,
    Category,
    CloudUpload,
    Info,
    Warning,
    AddCircleOutline
} from '@mui/icons-material';

const categoryOptions = [
    "Coffee", "Tea", "Pastries", "Breakfast", "Lunch", "Desserts", "Seasonal", "Specials"
];

const commonAllergens = [
    "Milk", "Eggs", "Fish", "Shellfish", "Tree Nuts", "Peanuts", "Wheat", "Soybeans", "Gluten"
];

const AddMenuItemForm = () => {
    const theme = useTheme();
    
    const [formData, setFormData] = useState({
        title: '',
        subTitle: '',
        priceMedium: '',
        priceLarge: '',
        category: '',
        calories: '',
        preparationTime: '',
        customizationOptions: [],
        tags: [],
        allergens: []
    });
    
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [formErrors, setFormErrors] = useState({});
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear error for this field if it exists
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: null
            });
        }
    };
    
    const handleArrayChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            
            // Create preview URL
            const fileReader = new FileReader();
            fileReader.onload = () => {
                setPreviewUrl(fileReader.result);
            };
            fileReader.readAsDataURL(selectedFile);
        }
    };
    
    const validateForm = () => {
        const errors = {};
        const requiredFields = ['title', 'priceMedium', 'category'];
        
        requiredFields.forEach(field => {
            if (!formData[field]) {
                errors[field] = 'This field is required';
            }
        });
        
        if (formData.priceMedium && isNaN(parseFloat(formData.priceMedium))) {
            errors.priceMedium = 'Price must be a valid number';
        }
        
        if (formData.priceLarge && isNaN(parseFloat(formData.priceLarge))) {
            errors.priceLarge = 'Price must be a valid number';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: 'Please check the form for errors',
                severity: 'error'
            });
            return;
        }
        
        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                submitData.append(key, value.join(','));
            } else {
                submitData.append(key, value);
            }
        });
        
        if (file) submitData.append('file', file);
        
        try {
            await axios.post('http://localhost:4969/menu', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Reset form
            setFormData({
                title: '',
                subTitle: '',
                priceMedium: '',
                priceLarge: '',
                category: '',
                calories: '',
                preparationTime: '',
                customizationOptions: [],
                tags: [],
                allergens: []
            });
            setFile(null);
            setPreviewUrl('');
            
            setSnackbar({
                open: true,
                message: 'Menu item added successfully!',
                severity: 'success'
            });
        } catch (err) {
            console.error('Error adding menu item:', err);
            setSnackbar({
                open: true,
                message: 'Failed to add menu item. Please try again.',
                severity: 'error'
            });
        }
    };
    
    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };
    
    return (
        <Box 
        sx={{
            py: 4,
            px: 2,
            background: `linear-gradient(135deg, 
                         ${alpha(theme.palette.primary.light, 0.3)} 0%, 
                         ${alpha(theme.palette.primary.main, 0.1)} 40%,
                         ${theme.palette.background.default} 100%)`,
            minHeight: '100vh'
        }}
      >
            <Container maxWidth="lg">
                <Paper 
                    elevation={6} 
                    sx={{ 
                        p: { xs: 2, sm: 4 }, 
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                        backgroundColor: alpha(theme.palette.background.paper, 0.9)
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <RestaurantMenu sx={{ fontSize: 32, mr: 2, color: theme.palette.primary.main }} />
                        <Typography variant="h4" component="h1" fontWeight="bold">
                            Add New Menu Item
                        </Typography>
                    </Box>
                    
                    <Divider sx={{ mb: 4 }} />
                    
                    <Grid container spacing={4}>
                        {/* Left column - Form fields */}
                        <Grid item xs={12} md={8}>
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <Typography variant="h6" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Info sx={{ mr: 1 }} /> Basic Information
                                        </Typography>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Item Name"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            error={!!formErrors.title}
                                            helperText={formErrors.title}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <RestaurantMenu color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            variant="outlined"
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Description"
                                            name="subTitle"
                                            value={formData.subTitle}
                                            onChange={handleChange}
                                            placeholder="Brief description of the item"
                                            variant="outlined"
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required error={!!formErrors.category}>
                                            <InputLabel>Category</InputLabel>
                                            <Select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                startAdornment={
                                                    <InputAdornment position="start">
                                                        <Category color="action" />
                                                    </InputAdornment>
                                                }
                                            >
                                                {categoryOptions.map(option => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                                <MenuItem value="other">Other</MenuItem>
                                            </Select>
                                            {formErrors.category && (
                                                <Typography variant="caption" color="error">
                                                    {formErrors.category}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Calories"
                                            name="calories"
                                            value={formData.calories}
                                            onChange={handleChange}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">cal</InputAdornment>,
                                            }}
                                            variant="outlined"
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="h6" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <AttachMoney sx={{ mr: 1 }} /> Pricing Information
                                        </Typography>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            type="number"
                                            label="Medium Size Price"
                                            name="priceMedium"
                                            value={formData.priceMedium}
                                            onChange={handleChange}
                                            error={!!formErrors.priceMedium}
                                            helperText={formErrors.priceMedium}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        $
                                                    </InputAdornment>
                                                ),
                                            }}
                                            variant="outlined"
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Large Size Price"
                                            name="priceLarge"
                                            value={formData.priceLarge}
                                            onChange={handleChange}
                                            error={!!formErrors.priceLarge}
                                            helperText={formErrors.priceLarge}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        $
                                                    </InputAdornment>
                                                ),
                                            }}
                                            variant="outlined"
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Preparation Time"
                                            name="preparationTime"
                                            value={formData.preparationTime}
                                            onChange={handleChange}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <AccessTime color="action" />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: <InputAdornment position="end">min</InputAdornment>,
                                            }}
                                            variant="outlined"
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="h6" color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <LocalOffer sx={{ mr: 1 }} /> Additional Details
                                        </Typography>
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <Autocomplete
                                            multiple
                                            freeSolo
                                            options={[]}
                                            value={formData.customizationOptions}
                                            onChange={(_, newValue) => handleArrayChange('customizationOptions', newValue)}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => (
                                                    <Chip 
                                                        variant="outlined" 
                                                        label={option} 
                                                        {...getTagProps({ index })} 
                                                        color="primary"
                                                    />
                                                ))
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant="outlined"
                                                    label="Customization Options"
                                                    placeholder="Add and press Enter"
                                                    helperText="E.g. Extra shot, Skim milk, Sugar-free"
                                                />
                                            )}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <Autocomplete
                                            multiple
                                            freeSolo
                                            options={[]}
                                            value={formData.tags}
                                            onChange={(_, newValue) => handleArrayChange('tags', newValue)}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => (
                                                    <Chip 
                                                        variant="outlined" 
                                                        label={option} 
                                                        {...getTagProps({ index })} 
                                                        color="secondary"
                                                    />
                                                ))
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant="outlined"
                                                    label="Tags"
                                                    placeholder="Add and press Enter"
                                                    helperText="E.g. Vegan, Popular, New"
                                                />
                                            )}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <Autocomplete
                                            multiple
                                            options={commonAllergens}
                                            value={formData.allergens}
                                            onChange={(_, newValue) => handleArrayChange('allergens', newValue)}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => (
                                                    <Chip 
                                                        variant="outlined" 
                                                        label={option} 
                                                        {...getTagProps({ index })} 
                                                        color="error"
                                                        icon={<Warning fontSize="small" />}
                                                    />
                                                ))
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant="outlined"
                                                    label="Allergens"
                                                    placeholder="Select allergens"
                                                    helperText="Select all that apply"
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                        
                        {/* Right column - Image upload and preview */}
                        <Grid item xs={12} md={4}>
                            <Card 
                                elevation={3} 
                                sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    border: previewUrl ? 'none' : `2px dashed ${theme.palette.divider}`,
                                    borderRadius: 2
                                }}
                            >
                                {previewUrl ? (
                                    <CardMedia
                                        component="img"
                                        image={previewUrl}
                                        alt="Menu item preview"
                                        sx={{ 
                                            height: 240, 
                                            objectFit: 'cover',
                                            borderTopLeftRadius: 8,
                                            borderTopRightRadius: 8
                                        }}
                                    />
                                ) : (
                                    <Box 
                                        sx={{ 
                                            height: 240, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                            borderTopLeftRadius: 8,
                                            borderTopRightRadius: 8
                                        }}
                                    >
                                        <CloudUpload sx={{ fontSize: 80, color: alpha(theme.palette.text.secondary, 0.3) }} />
                                    </Box>
                                )}
                                
                                <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" gutterBottom>
                                        Item Image
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Upload a high-quality image of this menu item. Recommended size: 800x600px.
                                    </Typography>
                                    
                                    <Button
                                        variant="contained"
                                        component="label"
                                        startIcon={<CloudUpload />}
                                        sx={{ mt: 'auto' }}
                                        color={previewUrl ? "secondary" : "primary"}
                                    >
                                        {previewUrl ? 'Change Image' : 'Upload Image'}
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </Button>
                                    
                                    {file && (
                                        <Typography variant="caption" sx={{ mt: 1 }}>
                                            {file.name} ({Math.round(file.size / 1024)} KB)
                                        </Typography>
                                    )}
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<AddCircleOutline />}
                            onClick={handleSubmit}
                            sx={{ 
                                px: 5, 
                                py: 1.5,
                                borderRadius: 2,
                                boxShadow: theme.shadows[4]
                            }}
                        >
                            Add to Menu
                        </Button>
                    </Box>
                </Paper>
            </Container>
            
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity} 
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AddMenuItemForm;