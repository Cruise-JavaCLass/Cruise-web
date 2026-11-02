import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { ACCESS_DENIED_EVENT } from '../../services/api';

export const AdminAuthGuard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isStaff = authService.isStaff();

  useEffect(() => {
    const onDenied = (event: Event) => {
      const status = (event as CustomEvent<{ status: number }>).detail.status;
      if (status === 401) {
        authService.clearSession();
        navigate('/login', { replace: true });
      } else {
        navigate('/forbidden', { replace: true });
      }
    };
    window.addEventListener(ACCESS_DENIED_EVENT, onDenied);
    return () => window.removeEventListener(ACCESS_DENIED_EVENT, onDenied);
  }, [navigate]);

  if (!isStaff) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  return <Outlet />;
};
