// components/CheckoutStepper.jsx
import React from 'react';
import { 
  Stepper, 
  Step, 
  StepLabel, 
  Box, 
  useTheme, 
  useMediaQuery,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ShoppingCart,
  LocalShipping,
  Payment,
  RateReview
} from '@mui/icons-material';

const StyledStepper = styled(Stepper)(({ theme }) => ({
  padding: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.tertiary} 100%)`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  border: `1px solid ${theme.palette.divider}`,
}));

const stepIcons = {
  0: ShoppingCart,
  1: LocalShipping,
  2: Payment,
  3: RateReview,
};

const CheckoutStepper = ({ activeStep, steps }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Paper elevation={0}>
      <StyledStepper 
        activeStep={activeStep} 
        orientation={isMobile ? 'vertical' : 'horizontal'}
        alternativeLabel={!isMobile}
      >
        {steps.map((label, index) => {
          const StepIcon = stepIcons[index];
          return (
            <Step key={label}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: activeStep >= index ? 'primary.main' : 'neutral.300',
                      color: activeStep >= index ? 'white' : 'text.secondary',
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: activeStep >= index ? theme.shadows[3] : 'none',
                    }}
                  >
                    <StepIcon fontSize="small" />
                  </Box>
                )}
              >
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </StyledStepper>
    </Paper>
  );
};

export default CheckoutStepper;