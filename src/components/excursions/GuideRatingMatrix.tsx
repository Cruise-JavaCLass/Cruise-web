import React from 'react';
import type { ExcursionOpsKpi } from '../../services/excursionAnalyticsService';
import { Award, ShieldAlert, CheckCircle, AlertTriangle, UserCheck, Star } from 'lucide-react';

interface Props {
  kpi: ExcursionOpsKpi | null;
}

export const GuideRatingMatrix: React.FC<Props> = ({ kpi }) => {
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" /> Xuất Sắc
          </span>
        );
      case 'GOOD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <CheckCircle className="w-3.5 h-3.5" /> Tiêu Chuẩn
          </span>
        );
      case 'NEEDS_IMPROVEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Cần Cải Thiện
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> Rủi Ro Cao (&lt;3★)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-700 text-slate-300">
            Chưa Đánh Giá
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Provider Performance Scorecard */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 shadow-lg">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Bảng Điểm Hiệu Suất Đối Tác Vận Hành Tour Bờ (Provider Scorecards)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Đối Tác Tour</th>
                <th className="py-3 px-4">Số Chuyến</th>
                <th className="py-3 px-4">Số Đánh Giá</th>
                <th className="py-3 px-4">Điểm TB</th>
                <th className="py-3 px-4">HDV / Xe / Giá Trị</th>
                <th className="py-3 px-4">Cảnh Báo Khẩn</th>
                <th className="py-3 px-4">Phân Hạng Hợp Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {kpi?.providerScorecards && kpi.providerScorecards.length > 0 ? (
                kpi.providerScorecards.map((p) => {
                  const uniqueKey = p.providerId || p.providerName.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <tr key={uniqueKey} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4 font-medium text-white">{p.providerName}</td>
                      <td className="py-3.5 px-4">{p.totalExcursions}</td>
                      <td className="py-3.5 px-4">{p.totalReviews}</td>
                      <td className="py-3.5 px-4 font-bold text-amber-400">{p.averageRating}★</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {p.averageGuideRating}★ / {p.averageBusRating}★ / {p.averageValueRating}★
                      </td>
                      <td className="py-3.5 px-4">
                        {p.flaggedCount > 0 ? (
                          <span className="text-rose-400 font-semibold">{p.flaggedCount} phản ánh</span>
                        ) : (
                          <span className="text-emerald-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getTierBadge(p.performanceTier)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Chưa có số liệu đối tác
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guide Rating Matrix */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 shadow-lg">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          Ma Trận Đánh Giá Hướng Dẫn Viên (Guide Rating Matrix)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpi?.guideRatings && kpi.guideRatings.length > 0 ? (
            kpi.guideRatings.map((guide) => (
              <div
                key={guide.guideId}
                className="bg-slate-900/50 border border-slate-700/60 rounded-xl p-4 flex items-start justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{guide.guideName}</h4>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Mã: {guide.guideCode} • Vai trò: {guide.role}
                  </span>
                  <span className="text-xs text-cyan-400 block mt-2">
                    {guide.totalAssignedExcursions} tour đã dẫn
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 text-amber-400 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {guide.averageRating}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-slate-500">
              Chưa có dữ liệu hướng dẫn viên
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
