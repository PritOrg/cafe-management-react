import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { menuAPI, unwrap } from '../../services/api';
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
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import AccessTime from '@mui/icons-material/AccessTime';
import LocalOffer from '@mui/icons-material/LocalOffer';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Category from '@mui/icons-material/Category';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Info from '@mui/icons-material/Info';
import Warning from '@mui/icons-material/Warning';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';

const categoryOptions = [
    "Starters", "Mains", "Sides", "Breakfast", "Lunch", "Dinner",
    "Desserts", "Beverages", "Coffee", "Tea", "Seasonal", "Specials"
];

const commonAllergens = [
    "Milk", "Eggs", "Fish", "Shellfish", "Tree Nuts", "Peanuts", "Wheat", "Soybeans", "Gluten"
];

const AddMenuItemForm = () => {
    const theme = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    
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

    // Flexible size variants (Swiggy-style): [] = no sizes (use medium/large fallback)
    const [sizes, setSizes] = useState([
        { label: 'Small', price: '', isDefault: true },
        { label: 'Large', price: '' },
    ]);
    const [useCustomSizes, setUseCustomSizes] = useState(false);

    const updateSize = (index, patch) => {
        setSizes((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    };

    const addSizeRow = () => setSizes((prev) => [...prev, { label: '', price: '', isDefault: false }]);
    const removeSizeRow = (index) => setSizes((prev) => prev.filter((_, i) => i !== index));
    
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Edit mode: load the existing item into the form (including its image preview).
    useEffect(() => {
        if (!isEdit) return () => {};
        let active = true;
        (async () => {
            try {
                const body = await menuAPI.getById(id);
                const item = unwrap(body) || {};
                if (!active) return;
                setFormData({
                    title: item.title || '',
                    subTitle: item.subTitle || '',
                    priceMedium: item.price?.medium ?? '',
                    priceLarge: item.price?.large ?? '',
                    category: item.category || '',
                    calories: item.calories ?? '',
                    preparationTime: item.preparationTime ?? '',
                    customizationOptions: item.customizationOptions || [],
                    tags: item.tags || [],
                    allergens: item.allergens || [],
                });
                if (Array.isArray(item.sizes) && item.sizes.length) {
                    setUseCustomSizes(true);
                    setSizes(item.sizes.map((s) => ({ label: s.label, price: s.price, isDefault: !!s.isDefault })));
                }
                setPreviewUrl(item.imageUrl || '');
            } catch (err) {
                console.error('Failed to load menu item:', err);
                setSnackbar({ open: true, message: 'Could not load this menu item.', severity: 'error' });
            }
        })();
        return () => { active = false; };
    }, [id, isEdit]);

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
        const requiredFields = useCustomSizes ? ['title', 'category'] : ['title', 'priceMedium', 'category'];

        requiredFields.forEach(field => {
            if (!formData[field]) {
                errors[field] = 'This field is required';
            }
        });

        if (!useCustomSizes && formData.priceMedium && isNaN(parseFloat(formData.priceMedium))) {
            errors.priceMedium = 'Price must be a valid number';
        }

        if (!useCustomSizes && formData.priceLarge && isNaN(parseFloat(formData.priceLarge))) {
            errors.priceLarge = 'Price must be a valid number';
        }

        if (useCustomSizes) {
            const valid = sizes.filter((s) => s.label.trim() && s.price !== '' && !isNaN(parseFloat(s.price)));
            if (!valid.length) errors.sizes = 'Add at least one size with label and price';
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

        if (useCustomSizes) {
            const clean = sizes
                .filter((s) => s.label.trim() && s.price !== '')
                .map((s, i) => ({
                    label: s.label.trim(),
                    price: parseFloat(s.price),
                    isDefault: !!s.isDefault,
                    sortOrder: i,
                }));
            submitData.append('sizes', JSON.stringify(clean));
        }

        if (file) submitData.append('file', file);

        setSaving(true);
        try {
            if (isEdit) {
                await menuAPI.updateForm(id, submitData);
                setSnackbar({
                    open: true,
                    message: 'Menu item updated successfully!',
                    severity: 'success'
                });
                setTimeout(() => navigate('/admin/menu'), 800);
                return;
            }

            await menuAPI.create(submitData);

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
            console.error('Error saving menu item:', err);
            setSnackbar({
                open: true,
                message: `Failed to ${isEdit ? 'update' : 'add'} menu item. Please try again.`,
                severity: 'error'
            });
        } finally {
            setSaving(false);
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
                            {isEdit ? 'Edit Menu Item' : 'Add New Menu Item'}
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
                                            label="Description (optional)"
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
                                            label="Calories (optional)"
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
                                    
                                    <Grid item xs={12}>
                                        <Button
                                            size="small"
                                            variant={useCustomSizes ? 'contained' : 'outlined'}
                                            onClick={() => setUseCustomSizes((v) => !v)}
                                            sx={{ mb: 1 }}
                                        >
                                            {useCustomSizes ? 'Using custom size variants' : 'Add size variants (250ml / 500g / …)'}
                                        </Button>
                                    </Grid>

                                    {useCustomSizes ? (
                                        <Grid item xs={12}>
                                            {formErrors.sizes && (
                                                <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                                                    {formErrors.sizes}
                                                </Typography>
                                            )}
                                            {sizes.map((size, index) => (
                                                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                                    <TextField
                                                        size="small"
                                                        label="Label"
                                                        value={size.label}
                                                        onChange={(e) => updateSize(index, { label: e.target.value })}
                                                        placeholder="250ml / Small / 500g"
                                                        sx={{ flex: 2 }}
                                                    />
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        label="Price"
                                                        value={size.price}
                                                        onChange={(e) => updateSize(index, { price: e.target.value })}
                                                        sx={{ flex: 1 }}
                                                    />
                                                    <Button
                                                        size="small"
                                                        variant={size.isDefault ? 'contained' : 'outlined'}
                                                        onClick={() => setSizes((prev) => prev.map((s, i) => ({ ...s, isDefault: i === index })))}
                                                    >
                                                        Default
                                                    </Button>
                                                    <Button size="small" color="error" onClick={() => removeSizeRow(index)}>
                                                        Remove
                                                    </Button>
                                                </Box>
                                            ))}
                                            <Button size="small" onClick={addSizeRow} sx={{ mt: 0.5 }}>
                                                + Add size
                                            </Button>
                                        </Grid>
                                    ) : (
                                        <>
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
                                                                ₹
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
                                                    label="Large Size Price (optional)"
                                                    name="priceLarge"
                                                    value={formData.priceLarge}
                                                    onChange={handleChange}
                                                    error={!!formErrors.priceLarge}
                                                    helperText={formErrors.priceLarge}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                ₹
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    variant="outlined"
                                                />
                                            </Grid>
                                        </>
                                    )}

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Preparation Time (optional)"
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
                                                        key={option}
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
                                                    label="Customization Options (optional)"
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
                                                        key={option}
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
                                                    label="Tags (optional)"
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
                                                        key={option}
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
                                                    label="Allergens (optional)"
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
                                    {isEdit && file && (
                                        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                                            The current image will be replaced and deleted.
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
                            disabled={saving}
                            sx={{ 
                                px: 5, 
                                py: 1.5,
                                borderRadius: 2,
                                boxShadow: theme.shadows[4]
                            }}
                        >
                            {saving ? 'Saving…' : isEdit ? 'Update Menu Item' : 'Add to Menu'}
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