import React from 'react';
import { Outlet } from 'react-router-dom';

const RootLayout = () => {
  return (
    <div>
      <header>
        <h1>Root Layout</h1>
      </header>
      <Outlet />
    </div>
  );
};

export default RootLayout;
