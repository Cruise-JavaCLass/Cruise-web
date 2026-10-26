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
    <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D7]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#687787] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#397C80]" />
          <span>Danh Mục Món</span>
        </h4>
        <span className="text-[11px] text-[#687787] font-mono">{categories.length} nhóm</span>
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelectCategory(undefined)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
            selectedCategoryId === undefined
              ? 'bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20'
              : 'text-[#687787] hover:text-[#252B32] hover:bg-[#F7F4ED]'
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
                    ? 'bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20'
                    : 'text-[#687787] hover:text-[#252B32] hover:bg-[#F7F4ED]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {hasChildren ? (
                    <FolderOpen className="w-3.5 h-3.5 text-[#C5A572] shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-[#397C80] shrink-0" />
                  )}
                  <span className="truncate">{cat.name}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-[#687787] transition-transform ${
                    isSelected ? 'rotate-90 text-[#102A43]' : ''
                  }`}
                />
              </button>

              {/* Subcategories (children) */}
              {hasChildren && (
                <div className="pl-6 space-y-1 border-l border-[#E5E0D7] ml-3">
                  {cat.children!.map((child) => {
                    const isChildSelected = selectedCategoryId === child.id;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectCategory(child.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                          isChildSelected
                            ? 'bg-[#102A43]/15 text-[#102A43] font-semibold'
                            : 'text-[#687787] hover:text-[#252B32] hover:bg-[#F7F4ED]'
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
