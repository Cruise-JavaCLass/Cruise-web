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
    <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
      {/* Search Input & Reset */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.keyword || ''}
            onChange={handleKeywordChange}
            placeholder="Tìm kiếm theo tên hoạt động, tour trên bờ, địa điểm, cảng..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:focus:border-indigo-400"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-400"
          >
            <X className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-700/60">
        {/* Type Filter */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => handleTypeSelect(undefined)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filters.itemType === undefined
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Tất cả loại hình
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('ONBOARD_ACTIVITY')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filters.itemType === 'ONBOARD_ACTIVITY'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Ship className="h-3 w-3" /> Trên tàu
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('SHORE_EXCURSION')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filters.itemType === 'SHORE_EXCURSION'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Compass className="h-3 w-3" /> Tour trên bờ
          </button>
        </div>

        {/* Pricing Filter */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => handleIncludedSelect(undefined)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filters.isIncluded === undefined
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Tất cả giá
          </button>
          <button
            type="button"
            onClick={() => handleIncludedSelect(true)}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filters.isIncluded === true
                ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" /> Đã bao gồm
          </button>
          <button
            type="button"
            onClick={() => handleIncludedSelect(false)}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filters.isIncluded === false
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <DollarSign className="h-3 w-3" /> Trả phí thêm
          </button>
        </div>

        {/* Port Filter */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="port-filter-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Cảng ghé:
          </label>
          <select
            id="port-filter-select"
            value={filters.portId || ''}
            onChange={handlePortSelect}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
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
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Lịch trình:</span>
          {[1, 2, 3, 4, 5].map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleDaySelect(filters.dayNumber === day ? undefined : day)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                filters.dayNumber === day
                  ? 'bg-indigo-600 text-white shadow dark:bg-indigo-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
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
