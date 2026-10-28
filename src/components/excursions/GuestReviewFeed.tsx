import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  getFlaggedReviews,
  getAllExcursionReviews,
  type ExcursionReview,
} from '../../services/excursionAnalyticsService';
import { AlertTriangle, ShieldAlert, CheckCircle2, MessageSquare, Filter, ChevronDown, Loader2 } from 'lucide-react';

export const GuestReviewFeed: React.FC = () => {
  const [filterMode, setFilterMode] = useState<'all' | 'flagged'>('flagged');
  const [reviews, setReviews] = useState<ExcursionReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states for "all" reviews mode
  const [page, setPage] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setPagesCount] = useState<number>(0);

  const activeAbortController = useRef<AbortController | null>(null);

  const fetchInitialReviews = useCallback(async (mode: 'all' | 'flagged') => {
    activeAbortController.current?.abort();
    const controller = new AbortController();
    activeAbortController.current = controller;

    setLoading(true);
    setError(null);
    setPage(0);

    try {
      if (mode === 'flagged') {
        const data = await getFlaggedReviews(controller.signal);
        if (!controller.signal.aborted) {
          setReviews(data);
          setTotalElements(data.length);
          setPagesCount(1);
        }
      } else {
        const data = await getAllExcursionReviews(0, 10, controller.signal);
        if (!controller.signal.aborted) {
          setReviews(data.content || []);
          setTotalElements(data.totalElements || 0);
          setPagesCount(data.totalPages || 0);
        }
      }
    } catch (err: unknown) {
      if (!controller.signal.aborted) {
        const msg = err instanceof Error ? err.message : 'Lỗi tải danh sách đánh giá';
        setError(msg);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || loading || page + 1 >= totalPages) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await getAllExcursionReviews(nextPage, 10);
      setReviews((prev) => [...prev, ...(data.content || [])]);
      setPage(nextPage);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải trang tiếp theo';
      setError(msg);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchInitialReviews(filterMode);
    return () => {
      activeAbortController.current?.abort();
    };
  }, [filterMode, fetchInitialReviews]);

  return (
    <div className="space-y-6">
      {/* Moderation Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#F7F4ED] p-4 rounded-xl border border-[#E5E0D7]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#102A43]" />
          <span className="text-sm font-semibold text-[#102A43]">Lọc Đánh Giá:</span>
          <div className="inline-flex rounded-lg bg-white p-1 border border-[#E5E0D7]">
            <button
              onClick={() => setFilterMode('flagged')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                filterMode === 'flagged'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'text-[#687787] hover:text-[#102A43]'
              }`}
            >
              ⚠️ Cảnh Báo An Toàn & Tiêu Cực
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#102A43] text-white'
                  : 'text-[#687787] hover:text-[#102A43]'
              }`}
            >
              Tất Cả Đánh Giá
            </button>
          </div>
        </div>
        <div className="text-xs text-[#687787]">
          Hiển thị <strong className="text-[#102A43]">{reviews.length}</strong> / <strong className="text-[#102A43]">{totalElements}</strong> phản hồi
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-[#687787] text-sm font-medium">Đang tải danh sách đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center bg-white border border-dashed border-[#E5E0D7] rounded-xl space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-[#252B32] font-semibold">Không có phản hồi nào cần xử lý khẩn</p>
          <p className="text-[#687787] text-xs">Mọi dịch vụ tour bờ đều đang vận hành đạt tiêu chuẩn</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className={`p-5 rounded-xl border transition-all ${
                  r.isFlagged
                    ? 'bg-white border-2 border-rose-300 shadow-xs'
                    : 'bg-white border border-[#E5E0D7] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm border ${
                        r.ratingOverall <= 2
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : r.ratingOverall >= 4
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {r.ratingOverall}★
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#252B32]">Khách #{r.passengerId}</span>
                      <span className="text-xs text-[#687787] block">
                        Tour ID: #{r.excursionId}
                      </span>
                    </div>
                  </div>

                  {r.isFlagged && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      CẢNH BÁO KHẨN
                    </span>
                  )}
                </div>

                {/* Sub-ratings */}
                <div className="mt-3 grid grid-cols-3 gap-2 bg-[#F7F4ED] border border-[#E5E0D7] p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-[#687787] block">HDV:</span>
                    <span className="text-[#252B32] font-semibold">{r.ratingGuide ? `${r.ratingGuide}★` : '--'}</span>
                  </div>
                  <div>
                    <span className="text-[#687787] block">Xe Bus:</span>
                    <span className="text-[#252B32] font-semibold">{r.ratingBus ? `${r.ratingBus}★` : '--'}</span>
                  </div>
                  <div>
                    <span className="text-[#687787] block">Giá Trị:</span>
                    <span className="text-[#252B32] font-semibold">{r.ratingValue ? `${r.ratingValue}★` : '--'}</span>
                  </div>
                </div>

                {/* Comments */}
                <div className="mt-3 text-sm text-[#252B32] bg-[#F7F4ED]/60 p-3 rounded-lg border border-[#E5E0D7]">
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1 text-[#687787]" />
                  {r.comments || '(Không có nhận xét chi tiết)'}
                </div>

                {/* Flag Reason */}
                {r.flagReason && (
                  <div className="mt-2 text-xs text-rose-700 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Lý do: {r.flagReason}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button in All Mode */}
          {filterMode === 'all' && page + 1 < totalPages && (
            <div className="text-center pt-2">
              <button
                onClick={() => void handleLoadMore()}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Tải thêm đánh giá ({reviews.length}/{totalElements})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
