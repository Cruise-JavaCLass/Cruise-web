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
    <div className="mb-8 border-2 border-[#171717] bg-white p-5 shadow-[4px_4px_0px_#171717] dark:bg-slate-800">
      {/* Search Input & Reset */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={filters.keyword || ''}
            onChange={handleKeywordChange}
            placeholder="Tìm kiếm theo tên hoạt động, tour trên bờ, địa điểm, cảng..."
            className="w-full border-2 border-[#171717] bg-[#F7F5F0] py-2.5 pl-10 pr-4 text-xs font-bold text-[#171717] placeholder-neutral-500 shadow-[2px_2px_0px_#171717] transition-colors focus:bg-white focus:outline-none dark:border-white dark:bg-slate-900 dark:text-white"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 border-2 border-[#171717] bg-[#DC2626] px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_#171717] transition-all hover:bg-rose-700 active:translate-x-[1px] active:translate-y-[1px]"
          >
            <X className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-[#171717] pt-4 dark:border-slate-700">
        {/* Type Filter */}
        <div className="flex items-center gap-1 border-2 border-[#171717] bg-[#E7E4DC] p-1 shadow-[2px_2px_0px_#171717] dark:bg-slate-900">
          <button
            type="button"
            onClick={() => handleTypeSelect(undefined)}
            className={`px-3 py-1 text-xs font-black uppercase transition-all ${
              filters.itemType === undefined
                ? 'border border-[#171717] bg-white text-black shadow-[1px_1px_0px_#171717] dark:bg-slate-800 dark:text-white'
                : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
            }`}
          >
            Tất cả loại hình
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('ONBOARD_ACTIVITY')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase transition-all ${
              filters.itemType === 'ONBOARD_ACTIVITY'
                ? 'border border-[#171717] bg-white text-black shadow-[1px_1px_0px_#171717] dark:bg-slate-800 dark:text-white'
                : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
            }`}
          >
            <Ship className="h-3 w-3" /> Trên tàu
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('SHORE_EXCURSION')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase transition-all ${
              filters.itemType === 'SHORE_EXCURSION'
                ? 'border border-[#171717] bg-white text-black shadow-[1px_1px_0px_#171717] dark:bg-slate-800 dark:text-white'
                : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
            }`}
          >
            <Compass className="h-3 w-3" /> Tour trên bờ
          </button>
        </div>

        {/* Pricing Filter */}
        <div className="flex items-center gap-1 border-2 border-[#171717] bg-[#E7E4DC] p-1 shadow-[2px_2px_0px_#171717] dark:bg-slate-900">
          <button
            type="button"
            onClick={() => handleIncludedSelect(undefined)}
            className={`px-3 py-1 text-xs font-black uppercase transition-all ${
              filters.isIncluded === undefined
                ? 'border border-[#171717] bg-white text-black shadow-[1px_1px_0px_#171717] dark:bg-slate-800 dark:text-white'
                : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
            }`}
          >
            Tất cả giá
          </button>
          <button
            type="button"
            onClick={() => handleIncludedSelect(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase transition-all ${
              filters.isIncluded === true
                ? 'border border-[#171717] bg-[#D9FF43] text-black shadow-[1px_1px_0px_#171717]'
                : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" /> Đã bao gồm
          </button>
          <button
            type="button"
            onClick={() => handleIncludedSelect(false)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase transition-all ${
              filters.isIncluded === false
                ? 'border border-[#171717] bg-[#3155E7] text-white shadow-[1px_1px_0px_#171717]'
                : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
            }`}
          >
            <DollarSign className="h-3 w-3" /> Trả phí thêm
          </button>
        </div>

        {/* Port Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="port-filter-select" className="text-xs font-black uppercase tracking-wider text-[#171717] dark:text-neutral-300">
            Cảng ghé:
          </label>
          <select
            id="port-filter-select"
            value={filters.portId || ''}
            onChange={handlePortSelect}
            className="border-2 border-[#171717] bg-[#F7F5F0] py-1.5 px-2.5 text-xs font-bold text-black shadow-[2px_2px_0px_#171717] focus:outline-none dark:border-white dark:bg-slate-900 dark:text-white"
          >
            <option value="">Tất cả cảng</option>
            {ports.map(port => (
              <option key={port.id} value={port.id}>
                {port.name}
              </option>
            ))}
          </select>
        </div>

        {/* Day Number Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-xs font-black uppercase tracking-wider text-[#171717] dark:text-neutral-300">Lịch trình:</span>
          {[1, 2, 3, 4, 5].map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleDaySelect(filters.dayNumber === day ? undefined : day)}
              className={`border-2 border-[#171717] px-2.5 py-1 text-xs font-black uppercase tracking-wider transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                filters.dayNumber === day
                  ? 'bg-[#3155E7] text-white shadow-[2px_2px_0px_#171717]'
                  : 'bg-white text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] dark:bg-slate-700 dark:text-white'
              }`}
            >
              Ngày {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
