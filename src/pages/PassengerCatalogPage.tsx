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
    <div
      data-theme="passenger-retro"
      className="min-h-screen bg-[#070B16] py-8 px-4 text-[#F4F4F0] font-sans sm:px-6 lg:px-8 bg-[linear-gradient(to_right,rgba(66,232,245,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(66,232,245,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header Hero - Retro-Futuristic Terminal Expedition Header */}
        <div className="mb-8 rounded-2xl border border-[#42E8F5]/30 bg-[#151F33] p-6 sm:p-8 text-white shadow-[0_4px_24px_rgba(7,11,22,0.8)] relative overflow-hidden">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[#42E8F5]/40 bg-[#4169FF]/20 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-[#42E8F5]">
                <Sparkles className="h-3.5 w-3.5 text-[#42E8F5]" />
                <span>EXPEDITIONS & EXPERIENCES</span>
              </div>
              <h1 className="mt-3 text-3xl font-display font-black tracking-wide uppercase sm:text-4xl md:text-5xl text-[#F4F4F0]">
                Duyệt Hoạt Động & Tour Bờ
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#A7B4C9] max-w-2xl font-mono leading-relaxed">
                Khám phá trọn vẹn lịch trình các show diễn nghệ thuật, lớp học trải nghiệm trên tàu và các tour khám phá thắng cảnh độc đáo tại mỗi cảng dừng.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[#42E8F5]/30 bg-[#10182A] p-4 text-center shadow-lg min-w-[130px]">
                <span className="block text-3xl font-mono font-bold text-[#FFBD59] tabular-nums">{items.length}</span>
                <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#A7B4C9]">
                  Hoạt động khả dụng
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fallback Demo Mode Notification */}
        {isFallbackData && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-xs font-mono text-[#FFBD59]">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[#FFBD59]" />
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
                className="h-72 animate-pulse rounded-2xl border border-[#42E8F5]/20 bg-[#151F33] p-5 shadow-lg"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-[#42E8F5]/30 bg-[#151F33] p-12 text-center shadow-xl">
            <Compass className="mx-auto h-12 w-12 text-[#42E8F5]" />
            <h3 className="mt-4 text-xl font-display font-black uppercase text-[#F4F4F0]">
              Không tìm thấy hoạt động nào phù hợp
            </h3>
            <p className="mt-1 text-xs font-mono text-[#A7B4C9]">
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
                  className="inline-flex items-center gap-1 rounded-lg border border-[#42E8F5]/30 bg-[#151F33] px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#42E8F5] transition-all hover:bg-[#10182A] disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Trang trước
                </button>
                <span className="rounded-lg border border-[#42E8F5]/40 bg-[#10182A] px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#FFBD59]">
                  Trang {(filters.page || 0) + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange((filters.page || 0) + 1)}
                  disabled={(filters.page || 0) >= totalPages - 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#42E8F5]/30 bg-[#151F33] px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#42E8F5] transition-all hover:bg-[#10182A] disabled:opacity-30 cursor-pointer"
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

export default PassengerCatalogPage;
