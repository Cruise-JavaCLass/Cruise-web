import React, { useState, useEffect } from 'react';
import {
  passengerCatalogService,
  type PassengerCatalogItem,
  type CatalogFilterParams
} from '../services/passengerCatalogService';
import { CatalogItemCard } from '../components/passenger/CatalogItemCard';
import { CatalogDetailModal } from '../components/passenger/CatalogDetailModal';
import { CatalogFilterBar } from '../components/passenger/CatalogFilterBar';
import { Compass, Sparkles } from 'lucide-react';

export const PassengerCatalogPage: React.FC = () => {
  const [items, setItems] = useState<PassengerCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<PassengerCatalogItem | null>(null);
  const [filters, setFilters] = useState<CatalogFilterParams>({
    page: 0,
    size: 20
  });

  const tourId = 1;

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const response = await passengerCatalogService.getCatalogItems(tourId, filters);
        if (isMounted) {
          setItems(response.content);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục hoạt động:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<CatalogFilterParams>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 0
    }));
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map(item => (
              <CatalogItemCard
                key={`${item.itemType}-${item.id}`}
                item={item}
                onSelect={setSelectedItem}
              />
            ))}
          </div>
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
