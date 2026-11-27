import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ACCESS_DENIED_EVENT } from '../../services/api';

function hasValidPassengerToken(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (!token || token.startsWith('guest-token-')) {
    return false;
  }
  return true;
}

export function clearPassengerSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('currentPassenger');
  localStorage.removeItem('passengerId');
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentPassenger');
  sessionStorage.removeItem('passengerId');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('currentUser');
}

export function getAuthenticatedPassenger(): { id: number; fullName?: string; cabinNumber?: string } | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  if (!hasValidPassengerToken()) {
    return null;
  }
  try {
    const stored = localStorage.getItem('currentPassenger') || sessionStorage.getItem('currentPassenger');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && (parsed.id || parsed.passengerId)) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

export const PassengerAuthGuard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passenger = getAuthenticatedPassenger();

  useEffect(() => {
    const onDenied = (event: Event) => {
      const status = (event as CustomEvent<{ status: number }>).detail?.status;
      if (status === 401) {
        clearPassengerSession();
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?tab=passenger&redirect=${returnUrl}`, { replace: true });
      }
    };
    window.addEventListener(ACCESS_DENIED_EVENT, onDenied);
    return () => window.removeEventListener(ACCESS_DENIED_EVENT, onDenied);
  }, [location.pathname, location.search, navigate]);

  if (!passenger) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?tab=passenger&redirect=${returnUrl}`} replace />;
  }

  return <Outlet />;
};

export default PassengerAuthGuard;
