import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center p-6 bg-[#F7F4ED]">
      <div className="max-w-md w-full border border-[#E5E0D7] bg-white p-8 rounded-2xl shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-[#F7F4ED] text-[#102A43] border border-[#C5A572]/40 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Compass className="w-7 h-7 text-[#102A43]" />
        </div>
        <h2 className="text-4xl font-bold uppercase text-[#102A43] mb-1 tracking-tight font-display">404</h2>
        <p className="text-sm font-semibold uppercase tracking-wider text-[#102A43] mb-2 font-mono">Trang không tồn tại</p>
        <p className="text-xs text-[#627D98] mb-6 leading-relaxed">
          Hải trình của bạn có vẻ đã đi chệch hướng. Vui lòng quay trở lại bảng điều khiển trung tâm.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold shadow-md transition-all cursor-pointer"
        >
          <Home className="w-4 h-4 text-[#C5A572]" /> Về Trang Chủ
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
