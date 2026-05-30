import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // redirect to login, preserve attempted path in state for optional post-login redirect
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
