import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">404</h2>
        <p className="text-base font-semibold text-slate-300 mb-2">Trang không tồn tại</p>
        <p className="text-xs text-slate-400 mb-6">
          Hải trình của bạn có vẻ đã đi chệch hướng. Vui lòng quay trở lại bảng điều khiển trung tâm.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all"
        >
          <Home className="w-4 h-4" /> Về Trang Chủ
        </Link>
      </div>
    </div>
  );
}
