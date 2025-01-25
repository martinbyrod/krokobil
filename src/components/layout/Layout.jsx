import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <div className="layout__sidebar">
        {/* Sidebar panels will go here */}
      </div>
      <main className="layout__main">
        {children}
      </main>
    </div>
  );
} 