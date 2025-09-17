import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import WalletDetailsPage from './pages/WalletDetailsPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/layout/Layout';
import { AuthProvider } from './contexts/AuthContext'; // Import AuthProvider

export function App() {
  // For demo purposes, we'll assume the user is authenticated
  const isAuthenticated = false;
  return (
    <AuthProvider> {/* Wrap the entire application with AuthProvider */}
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wallet/:walletId" element={<WalletDetailsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/auth'} />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
