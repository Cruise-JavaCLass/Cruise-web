import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { canAccessPath, homeForRole } from '../../services/accessControl';

export function RouteAccessGuard() {
  const { pathname } = useLocation();
  const role = authService.getCurrentUser()?.role;
  if (canAccessPath(role, pathname)) return <Outlet />;
  return <Navigate to={pathname === '/' ? homeForRole(role) : '/forbidden'} replace />;
}
