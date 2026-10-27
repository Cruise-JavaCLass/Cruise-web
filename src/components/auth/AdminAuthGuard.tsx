import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

export const AdminAuthGuard: React.FC = () => {
  const location = useLocation();
  const isStaff = authService.isStaff();

  if (!isStaff) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  return <Outlet />;
};
