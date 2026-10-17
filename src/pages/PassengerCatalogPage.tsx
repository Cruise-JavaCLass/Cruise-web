import React, { useState, useEffect } from 'react';
import {
  passengerCatalogService,
  type PassengerCatalogItem,
  type CatalogFilterParams
} from '../services/passengerCatalogService';
import { CatalogItemCard } from '../components/passenger/CatalogItemCard';
import { CatalogDetailModal } from '../components/passenger/CatalogDetailModal';
import { CatalogFilterBar } from '../components/passenger/CatalogFilterBar';
import { useSearchParams } from 'react-router-dom';
import { Compass, Sparkles, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

export const PassengerCatalogPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<PassengerCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<PassengerCatalogItem | null>(null);
  const [isFallbackData, setIsFallbackData] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filters, setFilters] = useState<CatalogFilterParams>({
    page: 0,
    size: 12
  });

  const tourId = Number(searchParams.get('tourId')) || 1;

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const response = await passengerCatalogService.getCatalogItems(tourId, filters);
        if (isMounted) {
          setItems(response.content);
          setTotalPages(response.totalPages);
          setIsFallbackData(Boolean(response.isFallback));
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục hoạt động:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, [tourId, filters]);

  const handleSelectItem = async (item: PassengerCatalogItem) => {
    try {
      const freshDetail = await passengerCatalogService.getCatalogItemDetail(item.itemType, item.id);
      setSelectedItem(freshDetail || item);
    } catch {
      setSelectedItem(item);
    }
  };

  const handleFilterChange = (newFilters: Partial<CatalogFilterParams>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 0
    }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setFilters(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 dark:bg-slate-900/50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Hero */}
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Khám phá kỳ nghỉ dưỡng đẳng cấp</span>
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                Duyệt Hoạt Động & Tour Bờ
              </h1>
              <p className="mt-2 text-sm text-indigo-100 sm:text-base max-w-2xl">
                Khám phá trọn vẹn lịch trình các show diễn nghệ thuật, lớp học trải nghiệm trên tàu và các tour khám phá thắng cảnh độc đáo tại mỗi cảng dừng.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur-md">
                <span className="block text-2xl font-extrabold">{items.length}</span>
                <span className="text-xs text-indigo-200">Hoạt động khả dụng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fallback Demo Mode Notification */}
        {isFallbackData && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Chế độ xem trước (Demo Mode):</strong> Dữ liệu đang được hiển thị từ danh mục mô phỏng mẫu do chưa kết nối được máy chủ gateway trực tiếp.
            </span>
          </div>
        )}

        {/* Filter Controls Component */}
        <CatalogFilterBar filters={filters} onFilterChange={handleFilterChange} />

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-800">
            <Compass className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-white">
              Không tìm thấy hoạt động nào phù hợp
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Vui lòng thử điều chỉnh lại bộ lọc tìm kiếm hoặc từ khóa tra cứu của bạn.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(item => (
                <CatalogItemCard
                  key={`${item.itemType}-${item.id}`}
                  item={item}
                  onSelect={handleSelectItem}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange((filters.page || 0) - 1)}
                  disabled={(filters.page || 0) === 0}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" /> Trang trước
                </button>
                <span className="px-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                  Trang {(filters.page || 0) + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange((filters.page || 0) + 1)}
                  disabled={(filters.page || 0) >= totalPages - 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Trang sau <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Detail Modal Component */}
        {selectedItem && (
          <CatalogDetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    </div>
  );
};
