import React from 'react';
import type { CatalogFilterParams, CatalogItemType } from '../../services/passengerCatalogService';
import { Search, Ship, Compass, CheckCircle2, DollarSign, X } from 'lucide-react';

interface CatalogFilterBarProps {
  filters: CatalogFilterParams;
  onFilterChange: (filters: Partial<CatalogFilterParams>) => void;
  ports?: Array<{ id: number; name: string }>;
}

export const CatalogFilterBar: React.FC<CatalogFilterBarProps> = ({
  filters,
  onFilterChange,
  ports = [
    { id: 101, name: 'Hạ Long (Quảng Ninh)' },
    { id: 102, name: 'Tiên Sa (Đà Nẵng)' },
    { id: 103, name: 'An Thới (Phú Quốc)' }
  ]
}) => {
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ keyword: e.target.value });
  };

  const handleTypeSelect = (type?: CatalogItemType) => {
    onFilterChange({ itemType: type });
  };

  const handleIncludedSelect = (isIncluded?: boolean) => {
    onFilterChange({ isIncluded });
  };

  const handleDaySelect = (day?: number) => {
    onFilterChange({ dayNumber: day });
  };

  const handlePortSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({ portId: val ? Number(val) : undefined });
  };

  const hasActiveFilters =
    Boolean(filters.keyword) ||
    filters.itemType !== undefined ||
    filters.isIncluded !== undefined ||
    filters.dayNumber !== undefined ||
    filters.portId !== undefined;

  const handleResetFilters = () => {
    onFilterChange({
      keyword: '',
      itemType: undefined,
      isIncluded: undefined,
      dayNumber: undefined,
      portId: undefined
    });
  };

  return (
    <div className="mb-8 rounded-2xl border border-[#E5E0D7] bg-white p-5 shadow-sm text-[#252B32]">
      {/* Search Input & Reset */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#397C80]" />
          <input
            type="text"
            value={filters.keyword || ''}
            onChange={handleKeywordChange}
            placeholder="Tìm kiếm theo tên hoạt động, tour trên bờ, địa điểm, cảng..."
            className="w-full rounded-xl border border-[#E5E0D7] bg-[#F7F4ED]/50 py-2.5 pl-10 pr-4 text-xs text-[#252B32] placeholder-[#5A6B7C]/70 transition-colors focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] focus:outline-none"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#E5E0D7] pt-4">
        {/* Type Filter */}
        <div className="flex items-center gap-1 rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] p-1">
          <button
            type="button"
            onClick={() => handleTypeSelect(undefined)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.itemType === undefined
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'text-[#5A6B7C] hover:text-[#102A43]'
            }`}
          >
            Tất cả loại hình
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('ONBOARD_ACTIVITY')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.itemType === 'ONBOARD_ACTIVITY'
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'text-[#5A6B7C] hover:text-[#102A43]'
            }`}
          >
            <Ship className="h-3 w-3" /> Trên tàu
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('SHORE_EXCURSION')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.itemType === 'SHORE_EXCURSION'
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'text-[#5A6B7C] hover:text-[#102A43]'
            }`}
          >
            <Compass className="h-3 w-3" /> Tour trên bờ
          </button>
        </div>

        {/* Pricing Filter */}
        <div className="flex items-center gap-1 rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] p-1">
          <button
            type="button"
            onClick={() => handleIncludedSelect(undefined)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.isIncluded === undefined
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'text-[#5A6B7C] hover:text-[#102A43]'
            }`}
          >
            Tất cả giá
          </button>
          <button
            type="button"
            onClick={() => handleIncludedSelect(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.isIncluded === true
                ? 'bg-[#397C80] text-white shadow-xs'
                : 'text-[#5A6B7C] hover:text-[#102A43]'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" /> Đã bao gồm
          </button>
          <button
            type="button"
            onClick={() => handleIncludedSelect(false)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.isIncluded === false
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'text-[#5A6B7C] hover:text-[#102A43]'
            }`}
          >
            <DollarSign className="h-3 w-3" /> Trả phí thêm
          </button>
        </div>

        {/* Day Number Filter */}
        <div className="flex items-center gap-1 rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] p-1">
          <button
            type="button"
            onClick={() => handleDaySelect(undefined)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.dayNumber === undefined
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'text-[#5A6B7C] hover:text-[#102A43]'
            }`}
          >
            Mọi ngày
          </button>
          {[1, 2, 3, 4].map((day) => (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => handleDaySelect(day)}
              className={`px-2.5 py-1.5 text-xs font-semibold uppercase rounded-lg transition-all cursor-pointer ${
                filters.dayNumber === day
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'text-[#5A6B7C] hover:text-[#102A43]'
              }`}
            >
              N{day}
            </button>
          ))}
        </div>

        {/* Port Filter */}
        {ports && ports.length > 0 && (
          <div className="flex items-center">
            <select
              aria-label="Lọc theo cảng dừng"
              value={filters.portId || ''}
              onChange={handlePortSelect}
              className="rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] px-3 py-2 text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] cursor-pointer"
            >
              <option value="">Tất cả cảng dừng</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogFilterBar;
