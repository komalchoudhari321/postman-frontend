import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import MainAppLayout from './components/MainAppLayout';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; 
  }
  return children;
};

const AppRoutes = () => {
    const { isAuthenticated } = useAppContext();
    
    return (
        <Router>
            <Routes>
                {/* Landing Page (always accessible) */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Auth Routes (Mandatory Login/Logout) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Main Application Interface */}
                <Route path="/workspace/*" element={
                    <ProtectedRoute>
                        <MainAppLayout />
                    </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

const App = () => (
    <AppProvider>
        <ErrorBoundary>
            <AppRoutes />
        </ErrorBoundary>
    </AppProvider>
);

export default App;