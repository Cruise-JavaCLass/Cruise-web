import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { homeForRole } from '../services/accessControl';

export function ForbiddenPage() {
  return (
    <section className="mx-auto max-w-xl p-6" aria-labelledby="forbidden-title">
      <p className="text-sm font-mono">403</p>
      <h1 id="forbidden-title" className="text-2xl font-semibold mt-2">Bạn không có quyền truy cập</h1>
      <p className="mt-3">Vai trò của bạn không được phép mở chức năng này. Liên hệ quản trị viên nếu cần thay đổi quyền.</p>
      <Link className="inline-block mt-6 underline" to={homeForRole(authService.getCurrentUser()?.role)}>
        Về trang làm việc
      </Link>
    </section>
  );
}
