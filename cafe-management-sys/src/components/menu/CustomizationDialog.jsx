// CustomizationDialog.jsx - With CartContext integration
import React, { useState, useContext } from 'react';
import { Dialog, DialogContent, DialogActions, Typography, Button, Checkbox, FormControlLabel, Radio, RadioGroup, Box, Divider, IconButton, Paper, Chip, Slide, Snackbar, Alert, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CartContext from '../CartContext';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const   CustomizationDialog = ({ open, onClose, menuItem }) => {
    // Use CartContext instead of passing addToCart as prop
    const { addToCart } = useContext(CartContext);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const sizeOptions = (menuItem?.sizes?.length
        ? menuItem.sizes.map((s) => ({ value: s.label, label: s.label, price: s.price }))
        : [
            { value: 'medium', label: 'Medium', price: menuItem?.price?.medium || 0 },
            { value: 'large', label: 'Large', price: menuItem?.price?.large || 0 },
        ]);

    const modifierGroups = menuItem?.modifierGroups || [];
    const legacyOptions = menuItem?.customizationOptions || [];

    const defaultSize = sizeOptions.find((s) => s.isDefault)?.value || sizeOptions[0]?.value || 'medium';

    const [selectedSize, setSelectedSize] = useState(defaultSize);
    // selectedCustomizations: { optionName: priceDelta }
    const [selectedCustomizations, setSelectedCustomizations] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [totalPrice, setTotalPrice] = useState(sizeOptions[0]?.price || 0);
    const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });

    const basePriceFor = (size) => {
        const found = sizeOptions.find((s) => s.value === size);
        return Number(found?.price || 0);
    };

    const modifierDelta = (customizations) =>
        Object.values(customizations).reduce((sum, v) => sum + (Number(v) || 0), 0);

    const calculateTotalPrice = (size, customizations, qty) => {
        const basePrice = basePriceFor(size);
        setTotalPrice((basePrice + modifierDelta(customizations)) * qty);
    };

    const handleSizeChange = (event) => {
        const newSize = event.target.value;
        setSelectedSize(newSize);
        calculateTotalPrice(newSize, selectedCustomizations, quantity);
    };

    const handleCustomizationChange = (event, optionName, priceDelta = 10) => {
        const isChecked = event.target.checked;
        const updated = { ...selectedCustomizations };
        if (isChecked) {
            updated[optionName] = Number(priceDelta) || 0;
        } else {
            delete updated[optionName];
        }
        setSelectedCustomizations(updated);
        calculateTotalPrice(selectedSize, updated, quantity);
    };

    const handleQuantityChange = (change) => {
        const newQuantity = Math.max(1, quantity + change);
        setQuantity(newQuantity);
        calculateTotalPrice(selectedSize, selectedCustomizations, newQuantity);
    };

    const handleAddToCart = async () => {
        try {
            await addToCart(
                menuItem._id,
                selectedCustomizations,
                selectedSize
            );

            setNotification({
                open: true,
                message: 'Item added to cart successfully!',
                type: 'success'
            });

            setSelectedSize(defaultSize);
            setSelectedCustomizations({});
            setQuantity(1);
            setTotalPrice(basePriceFor(defaultSize));

            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            setNotification({
                open: true,
                message: 'Failed to add item to cart',
                type: 'error'
            });
        }
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    // Guard against undefined menuItem
    if (!menuItem) return null;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                TransitionComponent={Transition}
                fullScreen={isMobile}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: isMobile ? 0 : '16px',
                        overflow: 'hidden',
                        maxHeight: isMobile ? '100dvh' : undefined,
                    }
                }}
            >
                <Box sx={{ position: 'relative' }}>
                    <Box
                        sx={{
                            height: 120,
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${menuItem.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: 3
                        }}
                    >
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                            {menuItem.title}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.6)' }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ padding: isMobile ? '16px' : '24px' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: 2 }}>Select Size</Typography>
                    <Paper variant="outlined" sx={{ padding: 2, borderRadius: '12px', marginBottom: 3, borderColor: '#eee' }}>
                        <RadioGroup
                            value={selectedSize}
                            onChange={handleSizeChange}
                        >
                            {(menuItem?.sizes?.length
                                ? menuItem.sizes.map((s) => ({
                                    value: s.label,
                                    label: s.label,
                                    price: s.price,
                                }))
                                : [
                                    { value: 'medium', label: 'Medium', price: menuItem?.price?.medium || 0 },
                                    { value: 'large', label: 'Large', price: menuItem?.price?.large || 0 },
                                ]
                            ).map((opt, idx, arr) => (
                                <FormControlLabel
                                    key={opt.value}
                                    value={opt.value}
                                    control={<Radio sx={{ color: '#222', '&.Mui-checked': { color: '#222' } }} />}
                                    label={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                            <Typography variant="body1">{opt.label}</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{opt.price}</Typography>
                                        </Box>
                                    }
                                    sx={{ width: '100%', margin: 0, marginBottom: idx === arr.length - 1 ? 0 : 1 }}
                                />
                            ))}
                        </RadioGroup>
                    </Paper>

                    <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: 2 }}>Customization Options</Typography>
                    <Paper variant="outlined" sx={{ padding: 2, borderRadius: '12px', marginBottom: 3, borderColor: '#eee' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {modifierGroups.length > 0 && modifierGroups.map((group) => (
                                <Box key={group._id} sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{group.name}</Typography>
                                    {group.displayType === 'radio' ? (
                                        <RadioGroup
                                            value={selectedCustomizations[group.name] !== undefined ? group.name : ''}
                                            onChange={(e) => {
                                                const opt = (group.options || []).find((o) => o.name === e.target.value);
                                                const cleared = { ...selectedCustomizations };
                                                delete cleared[group.name];
                                                if (opt) cleared[group.name] = Number(opt.priceDelta) || 0;
                                                setSelectedCustomizations(cleared);
                                                calculateTotalPrice(selectedSize, cleared, quantity);
                                            }}
                                        >
                                            {(group.options || []).map((opt) => (
                                                <FormControlLabel
                                                    key={opt._id || opt.name}
                                                    value={opt.name}
                                                    control={<Radio sx={{ color: '#222', '&.Mui-checked': { color: '#222' } }} />}
                                                    label={
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                            <Typography variant="body2">{opt.name}</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {opt.priceDelta > 0 ? `+₹${opt.priceDelta}` : 'Free'}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            ))}
                                        </RadioGroup>
                                    ) : (
                                        (group.options || []).map((opt) => (
                                            <FormControlLabel
                                                key={opt._id || opt.name}
                                                control={
                                                    <Checkbox
                                                        name={opt.name}
                                                        checked={!!selectedCustomizations[opt.name]}
                                                        onChange={(e) => handleCustomizationChange(e, opt.name, opt.priceDelta)}
                                                        sx={{ color: '#222', '&.Mui-checked': { color: '#222' } }}
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <Typography variant="body2">{opt.name}</Typography>
                                                        <Chip
                                                            label={opt.priceDelta > 0 ? `+₹${opt.priceDelta}` : 'Free'}
                                                            size="small"
                                                            sx={{ backgroundColor: '#f0f0f0' }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        ))
                                    )}
                                </Box>
                            ))}
                            {modifierGroups.length === 0 && legacyOptions.map((option) => (
                                <FormControlLabel
                                    key={option}
                                    control={
                                        <Checkbox
                                            name={option}
                                            checked={!!selectedCustomizations[option]}
                                            onChange={(e) => handleCustomizationChange(e, option, 10)}
                                            sx={{ color: '#222', '&.Mui-checked': { color: '#222' } }}
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                            <Typography variant="body1">{option}</Typography>
                                            <Chip label="+₹10" size="small" sx={{ backgroundColor: '#f0f0f0' }} />
                                        </Box>
                                    }
                                    sx={{ width: '100%', margin: 0 }}
                                />
                            ))}
                            {modifierGroups.length === 0 && legacyOptions.length === 0 && (
                                <Typography variant="body2" color="text.secondary">No customizations for this item</Typography>
                            )}
                        </Box>
                    </Paper>

                    <Typography variant="subtitle1" sx={{ fontWeight: 600, marginBottom: 2 }}>Quantity</Typography>
                    <Paper variant="outlined" sx={{ padding: 2, borderRadius: '12px', marginBottom: 3, borderColor: '#eee' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <IconButton
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1}
                                    sx={{
                                        border: '1px solid #eee',
                                        '&.Mui-disabled': { backgroundColor: '#f9f9f9', color: '#ccc' }
                                    }}
                                >
                                    <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body1" sx={{ fontWeight: 600, minWidth: '30px', textAlign: 'center' }}>
                                    {quantity}
                                </Typography>
                                <IconButton
                                    onClick={() => handleQuantityChange(1)}
                                    sx={{ border: '1px solid #eee' }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                ₹{((totalPrice / quantity) || 0).toFixed(2)} each
                            </Typography>
                        </Box>
                    </Paper>

                    <Box sx={{ backgroundColor: '#f9f9f9', borderRadius: '12px', padding: 2, marginTop: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>Base price:</Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                ₹{basePriceFor(selectedSize)}
                            </Typography>
                        </Box>
                        {Object.keys(selectedCustomizations).length > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                                <Typography variant="body2" sx={{ color: '#666' }}>Customizations:</Typography>
                                <Typography variant="body2" sx={{ color: '#666' }}>
                                    ₹{modifierDelta(selectedCustomizations)}
                                </Typography>
                            </Box>
                        )}
                        {quantity > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                                <Typography variant="body2" sx={{ color: '#666' }}>Quantity:</Typography>
                                <Typography variant="body2" sx={{ color: '#666' }}>×{quantity}</Typography>
                            </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total Price:</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#222' }}>₹{totalPrice}</Typography>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
                    <Button
                        onClick={onClose}
                        sx={{
                            color: '#222',
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddToCart}
                        variant="contained"
                        startIcon={<ShoppingCartIcon />}
                        sx={{
                            color: '#fff',
                            backgroundColor: '#222',
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 600,
                            padding: '8px 24px',
                            '&:hover': { backgroundColor: '#000' }
                        }}
                    >
                        Add to Cart • ₹{totalPrice}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseNotification} 
                    severity={notification.type} 
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default CustomizationDialog;