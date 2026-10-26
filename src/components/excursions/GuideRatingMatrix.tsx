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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Xuất Sắc
          </span>
        );
      case 'GOOD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20">
            <CheckCircle className="w-3.5 h-3.5" /> Tiêu Chuẩn
          </span>
        );
      case 'NEEDS_IMPROVEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Cần Cải Thiện
          </span>
        );
      case 'HIGH_RISK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> Rủi Ro Cao (&lt;3★)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F7F4ED] text-[#687787] border border-[#E5E0D7]">
            Chưa Đánh Giá
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Provider Performance Scorecard */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-5 shadow-xs">
        <h3 className="text-base font-serif font-bold text-[#102A43] mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#C5A572]" />
          Bảng Điểm Hiệu Suất Đối Tác Vận Hành Tour Bờ (Provider Scorecards)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#252B32]">
            <thead className="bg-[#F7F4ED] text-[10px] font-semibold uppercase tracking-wider text-[#687787] border-b border-[#E5E0D7]">
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
            <tbody className="divide-y divide-[#E5E0D7]">
              {kpi?.providerScorecards && kpi.providerScorecards.length > 0 ? (
                kpi.providerScorecards.map((p) => {
                  return (
                    <tr key={p.providerId} className="hover:bg-[#F7F4ED]/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-[#102A43]">{p.providerName}</td>
                      <td className="py-3.5 px-4">{p.totalExcursions}</td>
                      <td className="py-3.5 px-4">{p.totalReviews}</td>
                      <td className="py-3.5 px-4 font-bold text-[#102A43]">{p.averageRating}★</td>
                      <td className="py-3.5 px-4 text-xs text-[#687787]">
                        {p.averageGuideRating}★ / {p.averageBusRating}★ / {p.averageValueRating}★
                      </td>
                      <td className="py-3.5 px-4">
                        {p.flaggedCount > 0 ? (
                          <span className="text-rose-600 font-semibold">{p.flaggedCount} phản ánh</span>
                        ) : (
                          <span className="text-emerald-700">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getTierBadge(p.performanceTier)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#687787]">
                    Chưa có số liệu đối tác
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guide Rating Matrix */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-5 shadow-xs">
        <h3 className="text-base font-serif font-bold text-[#102A43] mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#102A43]" />
          Ma Trận Đánh Giá Hướng Dẫn Viên (Guide Rating Matrix)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpi?.guideRatings && kpi.guideRatings.length > 0 ? (
            kpi.guideRatings.map((guide) => (
              <div
                key={guide.guideId}
                className="bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl p-4 flex items-start justify-between"
              >
                <div>
                  <h4 className="text-sm font-semibold text-[#252B32]">{guide.guideName}</h4>
                  <span className="text-xs text-[#687787] block mt-0.5">
                    Mã: {guide.guideCode} • Vai trò: {guide.role}
                  </span>
                  <span className="text-xs text-[#102A43] font-medium block mt-2">
                    {guide.totalAssignedExcursions} tour đã dẫn
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E5E0D7] text-[#102A43] font-bold text-sm shadow-xs">
                  <Star className="w-4 h-4 fill-[#C5A572] text-[#C5A572]" />
                  {guide.averageRating}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-[#687787]">
              Chưa có dữ liệu hướng dẫn viên
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
