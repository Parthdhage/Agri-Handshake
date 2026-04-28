import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { account, walletReady, role } = useWallet();
  const location = useLocation();

  // Still checking for wallet — show nothing briefly
  if (!walletReady) return null;

  // No wallet connected — redirect to login
  if (!account) return <Navigate to="/login" replace />;

  // Role-based access: if allowedRoles is specified, check role
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Buyer trying to access farmer-only page → redirect to marketplace
    return <Navigate to="/listings" replace />;
  }

  return children;
};

export default ProtectedRoute;
