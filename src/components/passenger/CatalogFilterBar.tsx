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
    <div className="mb-8 rounded-2xl border border-[#42E8F5]/30 bg-[#151F33] p-5 shadow-[0_4px_24px_rgba(7,11,22,0.8)] text-[#F4F4F0]">
      {/* Search Input & Reset */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#42E8F5]/70" />
          <input
            type="text"
            value={filters.keyword || ''}
            onChange={handleKeywordChange}
            placeholder="Tìm kiếm theo tên hoạt động, tour trên bờ, địa điểm, cảng..."
            className="w-full rounded-xl border border-[#42E8F5]/30 bg-[#10182A] py-2.5 pl-10 pr-4 text-xs font-mono text-[#F4F4F0] placeholder-[#A7B4C9]/60 transition-colors focus:border-[#42E8F5] focus:outline-none"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-950/60 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-300 transition-all hover:bg-rose-900 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#42E8F5]/15 pt-4">
        {/* Type Filter */}
        <div className="flex items-center gap-1 rounded-xl border border-[#42E8F5]/25 bg-[#10182A] p-1">
          <button
            type="button"
            onClick={() => handleTypeSelect(undefined)}
            className={`px-3 py-1 text-xs font-mono font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.itemType === undefined
                ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/40 shadow-[0_0_8px_rgba(66,232,245,0.2)]'
                : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
            }`}
          >
            Tất cả loại hình
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('ONBOARD_ACTIVITY')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.itemType === 'ONBOARD_ACTIVITY'
                ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/40 shadow-[0_0_8px_rgba(66,232,245,0.2)]'
                : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
            }`}
          >
            <Ship className="h-3 w-3" /> Trên tàu
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('SHORE_EXCURSION')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.itemType === 'SHORE_EXCURSION'
                ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/40 shadow-[0_0_8px_rgba(66,232,245,0.2)]'
                : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
            }`}
          >
            <Compass className="h-3 w-3" /> Tour trên bờ
          </button>
        </div>

        {/* Pricing Filter */}
        <div className="flex items-center gap-1 rounded-xl border border-[#42E8F5]/25 bg-[#10182A] p-1">
          <button
            type="button"
            onClick={() => handleIncludedSelect(undefined)}
            className={`px-3 py-1 text-xs font-mono font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.isIncluded === undefined
                ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/40 shadow-[0_0_8px_rgba(66,232,245,0.2)]'
                : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
            }`}
          >
            Tất cả giá
          </button>
          <button
            type="button"
            onClick={() => handleIncludedSelect(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.isIncluded === true
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" /> Đã bao gồm
          </button>
          <button
            type="button"
            onClick={() => handleIncludedSelect(false)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.isIncluded === false
                ? 'bg-[#4169FF]/20 text-[#42E8F5] border border-[#42E8F5]/40'
                : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
            }`}
          >
            <DollarSign className="h-3 w-3" /> Trả phí thêm
          </button>
        </div>

        {/* Day Number Filter */}
        <div className="flex items-center gap-1 rounded-xl border border-[#42E8F5]/25 bg-[#10182A] p-1">
          <button
            type="button"
            onClick={() => handleDaySelect(undefined)}
            className={`px-3 py-1 text-xs font-mono font-semibold uppercase rounded-lg transition-all cursor-pointer ${
              filters.dayNumber === undefined
                ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/40 shadow-[0_0_8px_rgba(66,232,245,0.2)]'
                : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
            }`}
          >
            Mọi ngày
          </button>
          {[1, 2, 3, 4].map((day) => (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => handleDaySelect(day)}
              className={`px-2.5 py-1 text-xs font-mono font-semibold uppercase rounded-lg transition-all cursor-pointer ${
                filters.dayNumber === day
                  ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/40 shadow-[0_0_8px_rgba(66,232,245,0.2)]'
                : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
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
              value={filters.portId || ''}
              onChange={handlePortSelect}
              className="rounded-xl border border-[#42E8F5]/30 bg-[#10182A] px-3 py-1.5 text-xs font-mono text-[#F4F4F0] focus:outline-none focus:border-[#42E8F5] cursor-pointer"
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
