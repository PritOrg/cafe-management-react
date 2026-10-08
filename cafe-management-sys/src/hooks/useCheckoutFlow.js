// hooks/useCheckoutFlow.js
import { useState } from 'react';

/**
 * Checkout flow state. Orders are linked to a customer by phone number, so the
 * "details" step captures name + phone (+ optional table) instead of shipping.
 */
export const useCheckoutFlow = (createOrder, initialCustomer = {}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerInfo, setCustomerInfo] = useState({
    name: initialCustomer.name || '',
    phone: initialCustomer.phone || '',
    tableNumber: initialCustomer.tableNumber || '',
  });

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    try {
      await createOrder(paymentMethod, {
        phone: customerInfo.phone,
        customerName: customerInfo.name,
        tableNumber: customerInfo.tableNumber,
      });
      setOpenDialog(true);
    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  };

  return {
    activeStep,
    setActiveStep,
    openDialog,
    setOpenDialog,
    paymentMethod,
    setPaymentMethod,
    customerInfo,
    setCustomerInfo,
    handleNext,
    handleBack,
    handleCustomerChange,
    handleCheckout,
  };
};

export default useCheckoutFlow;
