import React from 'react';
import { Store } from 'lucide-react';
import { type OutletDto } from '../../services/posCatalogService';

interface OutletSelectorProps {
  outlets: OutletDto[];
  selectedOutletId?: number;
  onSelectOutlet: (outletId?: number) => void;
}

export const OutletSelector: React.FC<OutletSelectorProps> = ({
  outlets,
  selectedOutletId,
  onSelectOutlet,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onSelectOutlet(undefined)}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          selectedOutletId === undefined
            ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
        }`}
      >
        Tất cả điểm bán ({outlets.length})
      </button>

      {outlets.map((outlet) => {
        const isSelected = selectedOutletId === outlet.id;
        return (
          <button
            key={outlet.id}
            type="button"
            onClick={() => onSelectOutlet(outlet.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSelected
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <Store className="w-3.5 h-3.5 opacity-70" />
            <span>{outlet.name}</span>
            {outlet.location && (
              <span className="text-[10px] opacity-60 hidden sm:inline">
                ({outlet.location})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
