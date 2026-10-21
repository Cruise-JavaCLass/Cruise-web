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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-300">Lọc Đánh Giá:</span>
          <div className="inline-flex rounded-lg bg-slate-900/60 p-1 border border-slate-700">
            <button
              onClick={() => setFilterMode('flagged')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                filterMode === 'flagged'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚠️ Cảnh Báo An Toàn & Tiêu Cực
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                filterMode === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất Cả Đánh Giá
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Hiển thị <strong>{reviews.length}</strong> / <strong>{totalElements}</strong> phản hồi
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Đang tải danh sách đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center bg-slate-800/20 border border-dashed border-slate-700 rounded-xl space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-slate-300 font-medium">Không có phản hồi nào cần xử lý khẩn</p>
          <p className="text-slate-500 text-xs">Mọi dịch vụ tour bờ đều đang vận hành đạt tiêu chuẩn</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className={`p-5 rounded-xl border transition-all ${
                  r.isFlagged
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-rose-950/30'
                    : 'bg-slate-800/60 border-slate-700/70'
                } shadow-lg`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                        r.ratingOverall <= 2
                          ? 'bg-rose-500/20 text-rose-400'
                          : r.ratingOverall >= 4
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {r.ratingOverall}★
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">Khách #{r.passengerId}</span>
                      <span className="text-xs text-slate-400 block">
                        Tour ID: #{r.excursionId}
                      </span>
                    </div>
                  </div>

                  {r.isFlagged && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      CẢNH BÁO KHẨN
                    </span>
                  )}
                </div>

                {/* Sub-ratings */}
                <div className="mt-3 grid grid-cols-3 gap-2 bg-slate-900/50 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-400 block">HDV:</span>
                    <span className="text-slate-200 font-semibold">{r.ratingGuide ? `${r.ratingGuide}★` : '--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Xe Bus:</span>
                    <span className="text-slate-200 font-semibold">{r.ratingBus ? `${r.ratingBus}★` : '--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Giá Trị:</span>
                    <span className="text-slate-200 font-semibold">{r.ratingValue ? `${r.ratingValue}★` : '--'}</span>
                  </div>
                </div>

                {/* Comments */}
                <div className="mt-3 text-sm text-slate-200 bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  {r.comments || '(Không có nhận xét chi tiết)'}
                </div>

                {/* Flag Reason */}
                {r.flagReason && (
                  <div className="mt-2 text-xs text-rose-300 flex items-center gap-1.5 font-medium">
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-sm font-semibold transition disabled:opacity-50"
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
