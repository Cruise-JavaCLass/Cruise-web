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
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-sm border-2 border-dashed border-[#171717] bg-white shadow-[4px_4px_0px_#171717]">
      <div className="w-14 h-14 rounded-sm bg-[#D9FF43] border-2 border-[#171717] flex items-center justify-center text-[#171717] mb-4 shadow-[2px_2px_0px_#171717]">
        <Icon className="w-6 h-6 text-[#171717]" />
      </div>
      <h3 className="text-base font-black uppercase tracking-tight text-[#171717] mb-1.5 font-display">{title}</h3>
      <p className="text-xs text-[#171717]/70 font-mono max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="neo-btn neo-btn-primary"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
