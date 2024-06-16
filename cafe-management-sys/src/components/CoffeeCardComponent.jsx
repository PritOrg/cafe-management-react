import styled from 'styled-components';
import { Share as ShareIcon, Favorite as FavoriteIcon, PlayCircleOutline as PlayCircleOutlineIcon, Restaurant as RestaurantIcon } from '@mui/icons-material';
import CoffeeOrderDialog from './CoffeeOrderDialog';
import { useState } from 'react';
const CoffeeCard = styled.div`
  width: 100%;
  max-width: 800px;
  height: 89%;
  min-height: 200px;
  display: block;
  margin: 8vh auto;
  border-radius: 18px;
  box-shadow: 0px 8px 12px 0px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;

  /* Media query to adjust height based on screen size */
  @media screen and (max-width: 600px) {
    min-height: 300px;
  }
`;

const CoffeeCardOverlay = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(to bottom, rgba(42, 159, 255, 0.2)  0%, rgba(33, 33, 32, 1) 60%, rgba(33, 33, 32, 1) 90%);
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
`;

const CoffeeCardShare = styled.div`
  padding: 1em;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  @media screen and (max-width: 600px) {
    display: block;
    width: 100%;
  }
`;

const CoffeeCardIcon = styled.button`
  color: #ffffff;
  mix-blend-mode: lighten;
  opacity: 0.4;
  background: none;
  padding: 0;
  margin: 0.5em 0;
  border: none;
  cursor: pointer;

  &:hover {
    opacity: 1;
    mix-blend-mode: lighten;
  }

  i {
    font-size: 1.2em;
  }
`;

const CoffeeCardContent = styled.div`
  width: 100%;
  max-width: 370px;
  display: flex;
  flex-direction: column;
  position: relative;
  float: right;
  padding-right: 1.2em;
  padding-bottom: 1em;
  @media screen and (max-width: 1000px) {
    width: 50%;
  }
  @media screen and (max-width: 600px) {
    margin-top: 4.2em;
    width: 100%;
    float: inherit;
    max-width: 100%;
    padding: 0 1em 1em;
  }
`;

const CoffeeCardHeader = styled.div`
  margin-bottom: 2em;
`;

const CoffeeCardTitle = styled.h1`
  color: #ffffff;
  margin-bottom: 0.25em;
  opacity: 0.85;
`;

const CoffeeCardInfo = styled.h4`
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.8em;
  color: #2a9fff;
  line-height: 1.2;
  margin: 0;
  font-weight: 700;
  opacity: 0.5;
`;

const CoffeeCardDesc = styled.p`
  font-weight: 300;
  opacity: 0.84;
  margin-bottom: 2em;
  color: rgba(255, 255, 255, .7);

`;

const CoffeeCardButton = styled.button`
  padding: 0.5rem 2rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid transparent;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    border-color: #2a9fff;
    color: #2a9fff;
    box-shadow: 0px 1px 8px 0px rgba(40, 14, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.0);

  }
`;

const CoffeeCardComponent = ({ title, subTitle, price, imageUrl, preparationTime, description, customizationOptions }) => {
  const [isOrderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('Medium');
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleOpenOrderDialog = () => {
    setOrderDialogOpen(true);
  };

  const handleCloseOrderDialog = () => {
    setOrderDialogOpen(false);
  };

  const handleSizeChange = (event) => {
    setSelectedSize(event.target.value);
  };

  const handleOptionChange = (event) => {
    const value = event.target.value;
    if (selectedOptions.includes(value)) {
      setSelectedOptions(selectedOptions.filter((option) => option !== value));
    } else {
      setSelectedOptions([...selectedOptions, value]);
    }
  };

  const handleSubmitOrder = () => {
    // Process the order here
    console.log('Selected Size:', selectedSize);
    console.log('Selected Options:', selectedOptions);
    // Close the dialog
    handleCloseOrderDialog();
  };
  return (<>

    <CoffeeCard style={{ backgroundImage: `url(${imageUrl})` }}>
      <CoffeeCardOverlay />
      <CoffeeCardShare>
        <CoffeeCardIcon>
          <ShareIcon />
        </CoffeeCardIcon>
        <CoffeeCardIcon>
          <FavoriteIcon />
        </CoffeeCardIcon>
        <CoffeeCardIcon>
          <PlayCircleOutlineIcon />
        </CoffeeCardIcon>
      </CoffeeCardShare>
      <CoffeeCardContent>
        <CoffeeCardHeader>
          <CoffeeCardTitle>{title}</CoffeeCardTitle>
          <CoffeeCardInfo>{subTitle}</CoffeeCardInfo>
        </CoffeeCardHeader>
        <CoffeeCardDesc>{description}</CoffeeCardDesc>
        <CoffeeCardDesc>Preparation Time: {preparationTime} mins</CoffeeCardDesc>
        <CoffeeCardDesc>Price: Medium - ${price.medium}, Large - ${price.large}</CoffeeCardDesc>
        <CoffeeCardButton onClick={handleOpenOrderDialog}><RestaurantIcon sx={{ marginRight: '12px' }}  />Order Now</CoffeeCardButton>
        <CoffeeOrderDialog
          open={isOrderDialogOpen}
          onClose={handleCloseOrderDialog}
          onSizeChange={handleSizeChange}
          onOptionChange={handleOptionChange}
          onSubmit={handleSubmitOrder}
          price={price}
          customizationOptions={customizationOptions}
          selectedSize={selectedSize}
          selectedOptions={selectedOptions}
        />
      </CoffeeCardContent>
    </CoffeeCard>
  </>);
};


export default CoffeeCardComponent;