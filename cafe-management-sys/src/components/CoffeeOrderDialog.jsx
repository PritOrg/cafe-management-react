import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Checkbox, Radio, RadioGroup, FormControl, FormLabel } from '@mui/material';

const CoffeeOrderDialog = ({ open, onClose, onSizeChange, onOptionChange, onSubmit, price, customizationOptions, selectedSize, selectedOptions }) => {


    return (
                <Dialog open={open} onClose={onClose}>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogContent>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Size</FormLabel>
                            <RadioGroup aria-label="size" name="size" value={selectedSize} onChange={onSizeChange}>
                                <FormControlLabel value="Medium" control={<Radio />} label={`Medium (₹${price.medium})`} />
                                <FormControlLabel value="Large" control={<Radio />} label={`Large (₹${price.large})`} />
                            </RadioGroup>
                        </FormControl>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Customization Options</FormLabel>
                            {customizationOptions.map((option) => (
                                <FormControlLabel
                                    key={option}
                                    control={<Checkbox checked={selectedOptions.includes(option)} onChange={onOptionChange} value={option} />}
                                    label={option}
                                />
                            ))}
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button onClick={onSubmit}>Submit</Button>
                    </DialogActions>
                </Dialog>
            );
};

export default CoffeeOrderDialog;
