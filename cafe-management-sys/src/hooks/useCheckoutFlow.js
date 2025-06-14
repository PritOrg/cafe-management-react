// hooks/useCheckoutFlow.js
import { useState } from 'react';

export const useCheckoutFlow = (createOrder) => {
  const [activeStep, setActiveStep] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    try {
      await createOrder(paymentMethod);
      setOpenDialog(true);
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

    return {
      activeStep,
      setActiveStep,
      openDialog,
      setOpenDialog,
      paymentMethod,
      setPaymentMethod,
      shippingInfo,
      setShippingInfo,
      handleNext,
      handleBack,
      handleShippingChange,
      handleCheckout
    };
  };