import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center p-6">
      <div className="max-w-md w-full border border-[#E5E7EB] bg-white p-8 rounded-[18px] shadow-sm">
        <div className="w-14 h-14 rounded-[14px] bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <h2 className="text-4xl font-bold uppercase text-[#20242C] mb-1 tracking-tight font-display">404</h2>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#5277D9] mb-2">Trang không tồn tại</p>
        <p className="text-xs text-[#687080] mb-6 leading-relaxed">
          Hải trình của bạn có vẻ đã đi chệch hướng. Vui lòng quay trở lại bảng điều khiển trung tâm.
        </p>
        <Link
          to="/"
          className="editorial-btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-xs uppercase tracking-wider shadow-xs"
        >
          <Home className="w-4 h-4" /> Về Trang Chủ
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
