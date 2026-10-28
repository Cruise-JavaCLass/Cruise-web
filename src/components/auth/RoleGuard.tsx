import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../../services/authService';

interface RoleGuardProps {
  /** Các vai trò được phép vào nhóm route bên trong */
  allowedRoles: string[];
  /** Nơi chuyển hướng khi không đủ quyền */
  redirectTo?: string;
}

/**
 * Chặn truy cập trực tiếp bằng đường dẫn theo vai trò đăng nhập.
 * Lưu ý: đây chỉ là chặn ở giao diện; backend vẫn phải tự kiểm tra quyền.
 */
export function RoleGuard({ allowedRoles, redirectTo = '/' }: RoleGuardProps) {
  const role = authService.getCurrentUser()?.role;

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
