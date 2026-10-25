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
    <div className="min-h-screen bg-[#F7F5F0] py-8 px-4 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Hero - Neo Brutalist Editorial */}
        <div className="mb-8 border-2 border-[#171717] bg-[#171717] p-6 sm:p-8 text-white shadow-[6px_6px_0px_#3155E7]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 border border-[#D9FF43] bg-[#D9FF43] px-3 py-0.5 text-xs font-black uppercase tracking-wider text-black">
                <Sparkles className="h-3.5 w-3.5 text-black" />
                <span>EXPEDITIONS & EXPERIENCES</span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight uppercase sm:text-4xl md:text-5xl">
                Duyệt Hoạt Động & Tour Bờ
              </h1>
              <p className="mt-2 text-sm text-neutral-300 sm:text-base max-w-2xl font-medium">
                Khám phá trọn vẹn lịch trình các show diễn nghệ thuật, lớp học trải nghiệm trên tàu và các tour khám phá thắng cảnh độc đáo tại mỗi cảng dừng.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="border-2 border-white bg-white/10 p-4 text-center shadow-[4px_4px_0px_#D9FF43]">
                <span className="block text-3xl font-black text-[#D9FF43]">{items.length}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">Hoạt động khả dụng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fallback Demo Mode Notification */}
        {isFallbackData && (
          <div className="mb-6 flex items-center gap-3 border-2 border-[#171717] bg-amber-300 p-4 text-xs font-bold text-black shadow-[3px_3px_0px_#171717]">
            <AlertTriangle className="h-5 w-5 shrink-0 text-black" />
            <span>
              <strong>CHẾ ĐỘ XEM TRƯỚC (DEMO MODE):</strong> Dữ liệu đang được hiển thị từ danh mục mô phỏng mẫu do chưa kết nối được máy chủ gateway trực tiếp.
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
                className="h-72 animate-pulse border-2 border-[#171717] bg-white p-5 shadow-[4px_4px_0px_#171717] dark:bg-slate-800"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="border-2 border-[#171717] bg-white p-12 text-center shadow-[6px_6px_0px_#171717] dark:bg-slate-800">
            <Compass className="mx-auto h-12 w-12 text-[#171717] dark:text-neutral-400" />
            <h3 className="mt-4 text-xl font-black uppercase text-[#171717] dark:text-white">
              Không tìm thấy hoạt động nào phù hợp
            </h3>
            <p className="mt-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
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
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePageChange((filters.page || 0) - 1)}
                  disabled={(filters.page || 0) === 0}
                  className="inline-flex items-center gap-1 border-2 border-[#171717] bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-[#171717] shadow-[2px_2px_0px_#171717] transition-all hover:bg-[#E7E4DC] disabled:opacity-40 active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
                >
                  <ChevronLeft className="h-4 w-4" /> Trang trước
                </button>
                <span className="border-2 border-[#171717] bg-[#D9FF43] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#171717] shadow-[2px_2px_0px_#171717]">
                  Trang {(filters.page || 0) + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange((filters.page || 0) + 1)}
                  disabled={(filters.page || 0) >= totalPages - 1}
                  className="inline-flex items-center gap-1 border-2 border-[#171717] bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-[#171717] shadow-[2px_2px_0px_#171717] transition-all hover:bg-[#E7E4DC] disabled:opacity-40 active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
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
