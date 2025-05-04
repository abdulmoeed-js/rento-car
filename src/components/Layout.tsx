
import React from 'react';
import RentoHeader from './layout/RentoHeader';
import { useLocation } from 'react-router-dom';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const showHeader = location.pathname !== '/auth';
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <RentoHeader />}
      <main className="flex-grow pt-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;
