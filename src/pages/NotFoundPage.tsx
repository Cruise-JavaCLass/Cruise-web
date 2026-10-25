import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center p-6">
      <div className="max-w-md w-full border-4 border-[#171717] bg-white p-8 shadow-[8px_8px_0px_#171717] dark:bg-slate-800">
        <div className="w-16 h-16 border-2 border-[#171717] bg-[#D9FF43] text-black flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#171717]">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-black uppercase text-[#171717] mb-1 tracking-tight dark:text-white">404</h2>
        <p className="text-sm font-black uppercase tracking-wider text-[#3155E7] mb-2 dark:text-[#D9FF43]">Trang không tồn tại</p>
        <p className="text-xs font-medium text-neutral-600 mb-6 dark:text-neutral-400">
          Hải trình của bạn có vẻ đã đi chệch hướng. Vui lòng quay trở lại bảng điều khiển trung tâm.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#171717] bg-[#171717] hover:bg-[#3155E7] text-white text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#171717] transition-all active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Home className="w-4 h-4" /> Về Trang Chủ
        </Link>
      </div>
    </div>
  );
}
