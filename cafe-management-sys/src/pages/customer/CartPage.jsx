import React, { useContext } from 'react';
import { Container } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CartContext from '../../components/CartContext';
import CheckoutStepper from '../../components/CartComponents/CheckoutStepper';
import CartItems from '../../components/CartComponents/CartItems';
import ShippingForm from '../../components/CartComponents/ShippingForm';
import PaymentForm from '../../components/CartComponents/PaymentForm';
import OrderReview from '../../components/CartComponents/OrderReview';
import OrderConfirmationDialog from '../../components/CartComponents/OrderConfirmationDialog';
import EmptyCart from '../../components/CartComponents/EmptyCart';
import PageHeader from '../../components/common/PageHeader';
import { useCheckoutFlow } from '../../hooks/useCheckoutFlow';


const CartPage = () => {
  const {
    cartItems,
    updateCartItem,
    removeCartItem,
    clearCart,
    total,
    totalPrepTime,
    createOrder,
    orderConfirmation,
    orderError,
    isLoading,
    cartCount
  } = useContext(CartContext);

  const {
    activeStep,
    shippingInfo,
    paymentMethod,
    openDialog,
    handleNext,
    handleBack,
    handleShippingChange,
    setPaymentMethod,
    handleCheckout,
    setOpenDialog
  } = useCheckoutFlow(createOrder);

  const steps = ['Cart', 'Shipping', 'Payment', 'Review'];

  const handleQuantityChange = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartItem(cartItemId, { quantity: newQuantity });
  };

  const handleUpdateCustomization = (cartItemId, customizationUpdates) => {
    updateCartItem(cartItemId, customizationUpdates);
  };

  if (cartItems.length === 0 && activeStep === 0) {
    return <EmptyCart />;
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <CartItems
            cartItems={cartItems}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={removeCartItem}
            onClearCart={clearCart}
            onUpdateCustomization={handleUpdateCustomization}
            total={total}
            cartCount={cartCount}
            totalPrepTime={totalPrepTime}
            onNext={handleNext}
            isLoading={isLoading}
          />
        );
      case 1:
        return (
          <ShippingForm
            shippingInfo={shippingInfo}
            onShippingChange={handleShippingChange}
            total={total}
            cartCount={cartCount}
            totalPrepTime={totalPrepTime}
            onBack={handleBack}
            onNext={handleNext}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <PaymentForm
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            total={total}
            cartCount={cartCount}
            totalPrepTime={totalPrepTime}
            onBack={handleBack}
            onNext={handleCheckout}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <OrderReview
            cartItems={cartItems}
            shippingInfo={shippingInfo}
            paymentMethod={paymentMethod}
            total={total}
            cartCount={cartCount}
            totalPrepTime={totalPrepTime}
            onBack={handleBack}
            onNext={handleCheckout}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Your cart"
        icon={<ShoppingCartIcon fontSize="small" />}
        subtitle="Review your items and complete your order"
      />

      <CheckoutStepper activeStep={activeStep} steps={steps} />

      {renderStepContent()}

      <OrderConfirmationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        orderConfirmation={orderConfirmation}
        orderError={orderError}
      />
    </Container>
  );
};

export default CartPage;