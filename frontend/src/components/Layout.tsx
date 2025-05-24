import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-teal-50 flex items-center justify-center p-4">
      {children}
      <footer className="fixed bottom-4 left-0 right-0 text-center text-gray-500 text-sm">
        Built with Bolt
      </footer>
    </div>
  );
};

export default Layout;