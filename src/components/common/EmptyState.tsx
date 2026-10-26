import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const ActionIcon = action?.icon;
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[#E5E0D7] bg-[#FAF8F5]/80 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E0D7] flex items-center justify-center text-[#102A43] mb-4 shadow-sm">
        <Icon className="w-6 h-6 text-[#102A43]" />
      </div>
      <h3 className="text-base font-serif font-bold tracking-normal text-[#102A43] mb-1.5">{title}</h3>
      <p className="text-xs text-[#687787] max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#102A43] hover:bg-[#183B5B] shadow-sm transition-all cursor-pointer"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
