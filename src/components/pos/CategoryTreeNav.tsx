import React from 'react';
import { Folder, FolderOpen, ChevronRight, Layers, Tag } from 'lucide-react';
import { type CategoryDto } from '../../services/posCatalogService';

interface CategoryTreeNavProps {
  categories: CategoryDto[];
  selectedCategoryId?: number;
  onSelectCategory: (categoryId?: number) => void;
}

export const CategoryTreeNav: React.FC<CategoryTreeNavProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Danh Mục Món</span>
        </h4>
        <span className="text-[11px] text-slate-500 font-mono">{categories.length} nhóm</span>
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelectCategory(undefined)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
            selectedCategoryId === undefined
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Tất cả danh mục</span>
          </div>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const hasChildren = cat.children && cat.children.length > 0;

          return (
            <div key={cat.id} className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {hasChildren ? (
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                  <span className="truncate">{cat.name}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                    isSelected ? 'rotate-90 text-blue-400' : ''
                  }`}
                />
              </button>

              {/* Subcategories (children) */}
              {hasChildren && (
                <div className="pl-6 space-y-1 border-l border-slate-800 ml-3">
                  {cat.children!.map((child) => {
                    const isChildSelected = selectedCategoryId === child.id;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectCategory(child.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                          isChildSelected
                            ? 'bg-blue-600/30 text-blue-300 font-semibold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="truncate">{child.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
