import React, { useState } from 'react';
import axios from 'axios';
import bgImg from '../../assets/cappuccino.webp'
import {
    Container,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Box
} from '@mui/material';

const AddMenuItemForm = () => {
    const [title, setTitle] = useState('');
    const [subTitle, setSubTitle] = useState('');
    const [priceMedium, setPriceMedium] = useState('');
    const [priceLarge, setPriceLarge] = useState('');
    const [category, setCategory] = useState('');
    const [calories, setCalories] = useState('');
    const [preparationTime, setPreparationTime] = useState('');
    const [customizationOptions, setCustomizationOptions] = useState('');
    const [tags, setTags] = useState('');
    const [allergens, setAllergens] = useState('');
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('subTitle', subTitle);
        formData.append('priceMedium', priceMedium);
        formData.append('priceLarge', priceLarge);
        formData.append('category', category);
        formData.append('calories', calories);
        formData.append('preparationTime', preparationTime);
        formData.append('customizationOptions', customizationOptions);
        formData.append('tags', tags);
        formData.append('allergens', allergens);
        if (file) formData.append('file', file);

        try {
            await axios.post('http://localhost:4969/menu', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Menu item added successfully!');
            // Clear form fields
            setTitle('');
            setSubTitle('');
            setPriceMedium('');
            setPriceLarge('');
            setCategory('');
            setCalories('');
            setPreparationTime('');
            setCustomizationOptions('');
            setTags('');
            setAllergens('');
            setFile(null);
        } catch (err) {
            console.error('Error adding menu item:', err);
            alert('Failed to add menu item. Please ensure all required fields are filled.');
        }
    };

    return (
        <Box sx={{margin:8,backgroundImage:bgImg}}>
            <Container maxWidth="md" sx={{}}>
                <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                    <Typography variant="h4" component="h2" gutterBottom align="center">
                        Add New Menu Item
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Subtitle"
                                    value={subTitle}
                                    onChange={(e) => setSubTitle(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    label="Price (Medium)"
                                    value={priceMedium}
                                    onChange={(e) => setPriceMedium(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    label="Price (Large)"
                                    value={priceLarge}
                                    onChange={(e) => setPriceLarge(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Calories"
                                    value={calories}
                                    onChange={(e) => setCalories(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Preparation Time (mins)"
                                    value={preparationTime}
                                    onChange={(e) => setPreparationTime(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Customization Options"
                                    value={customizationOptions}
                                    onChange={(e) => setCustomizationOptions(e.target.value)}
                                    placeholder="Comma separated"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Tags"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="Comma separated"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Allergens"
                                    value={allergens}
                                    onChange={(e) => setAllergens(e.target.value)}
                                    placeholder="Comma separated"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    component="label"
                                >
                                    Upload Image
                                    <input
                                        type="file"
                                        hidden
                                        onChange={handleFileChange}
                                    />
                                </Button>
                                {file && <Typography variant="body2" sx={{ mt: 1 }}>{file.name}</Typography>}
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                            >
                                Add Item
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default AddMenuItemForm;