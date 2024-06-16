import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from './pages/LandingPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginRegisterPage from './pages/LoginRegisterPage';
import MenuPage from './pages/MenuPage';
import Layout from './components/Layout';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />} >
          <Route index element={<LandingPage />} />
          <Route path="/login-register" element={<LoginRegisterPage />} />
          <Route path='/menu' element={<MenuPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </>
);
