import React from 'react';
import Header from './layout/Header'; 
import Sidebar from './layout/Sidebar'; 
import RequestView from './request/RequestView';

const MainAppLayout = () => {
  return (
    // Sets up the main vertical stack for the app
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Top Bar */}
      <Header /> 
      
      {/* 2. Main Content Area: Sidebar + Request/Response */}
      <div className="d-flex flex-grow-1" style={{ overflow: 'hidden' }}>
        
        {/* Left Panel: History & Collections (280px wide) */}
        <Sidebar style={{ 
            width: '280px', 
            flexShrink: 0, 
            overflowY: 'auto', 
            backgroundColor: '#2D2D2D', 
            borderRight: '1px solid #444' 
        }} />
        
        {/* Right Panel: Main Work Area */}
        <div className="flex-grow-1" style={{ overflowY: 'auto', backgroundColor: '#333333' }}>
          <RequestView />
        </div>
      </div>
    </div>
  );
};

export default MainAppLayout;