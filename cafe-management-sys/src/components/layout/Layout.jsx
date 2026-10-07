// Moving from components/Layout.jsx to components/layout/Layout.jsx
// This is a placeholder - the actual content will be moved
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';

const Layout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Layout;