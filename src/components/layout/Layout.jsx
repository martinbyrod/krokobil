import React from 'react';
import DriversPanel from '../panels/DriversPanel';
import KidsPanel from '../panels/KidsPanel';
import ActivitiesPanel from '../panels/ActivitiesPanel';

export default function Layout({ children }) {
  return (
    <div className="layout">
      <div className="layout__sidebar">
        <DriversPanel />
        <KidsPanel />
        <ActivitiesPanel />
      </div>
      <main className="layout__main">
        {children}
      </main>
    </div>
  );
} 