
import React from 'react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
};
