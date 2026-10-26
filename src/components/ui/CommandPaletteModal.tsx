import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Compass,
  Ship,
  MapPin,
  Navigation,
  Users,
  Activity,
  CreditCard,
  Receipt,
  ArrowRight,
  X,
  Command,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  subtitle: string;
  category: 'OPERATIONS' | 'FINANCE' | 'FLEET';
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const ADMIN_COMMAND_ITEMS: CommandItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Tổng quan',
    subtitle: 'Trung tâm điều hành hải trình & 3D Fleet Telemetry',
    category: 'OPERATIONS',
    to: '/',
    icon: Compass,
    badge: '3D Live',
  },
  {
    id: 'ships',
    label: 'Quản lý Đội tàu (Fleet)',
    subtitle: 'Thông số kỹ thuật tàu, sức chứa & trạng thái vận hành',
    category: 'FLEET',
    to: '/ships',
    icon: Ship,
  },
  {
    id: 'policies',
    label: 'Khu vực & Chính sách',
    subtitle: 'Quản lý phân vùng boong tàu & chính sách hoàn hủy',
    category: 'FLEET',
    to: '/admin/cruise-area-policies',
    icon: Ship,
  },
  {
    id: 'itinerary',
    label: 'Hải trình & Cảng dừng',
    subtitle: 'Quản lý lộ trình cập cảng và lịch trình hàng ngày',
    category: 'FLEET',
    to: '/itinerary',
    icon: MapPin,
  },
  {
    id: 'excursions',
    label: 'Tour Trên Bờ (Shore Excursions)',
    subtitle: 'Điều phối đoàn xe, hướng dẫn viên & danh sách khách',
    category: 'OPERATIONS',
    to: '/excursions',
    icon: Navigation,
  },
  {
    id: 'excursion-attendance',
    label: 'Điểm Danh Tour Bờ',
    subtitle: 'Quét QR điểm danh khách rời tàu và trở về tàu',
    category: 'OPERATIONS',
    to: '/excursion-attendance',
    icon: Users,
  },
  {
    id: 'activities',
    label: 'Hoạt động & Excursion',
    subtitle: 'Quản lý sự kiện giải trí, nhà hàng, spa & gala',
    category: 'OPERATIONS',
    to: '/activities',
    icon: Activity,
  },
  {
    id: 'pos',
    label: 'POS & Chi tiêu Onboard',
    subtitle: 'Bán hàng đa điểm, đồng bộ ngoại tuyến & đối soát ca',
    category: 'FINANCE',
    to: '/pos',
    icon: CreditCard,
    badge: 'Offline Sync',
  },
  {
    id: 'passengers',
    label: 'Hành khách & Check-in',
    subtitle: 'Danh sách hành khách theo tour & định vị BLE',
    category: 'OPERATIONS',
    to: '/passengers',
    icon: Users,
  },
  {
    id: 'embarkation',
    label: 'Cảng Đón Khách (Terminal)',
    subtitle: 'Check-in hộ chiếu, cấp phát thẻ RFID & kích hoạt Folio',
    category: 'OPERATIONS',
    to: '/embarkation',
    icon: Ship,
  },
  {
    id: 'settlement',
    label: 'Tất toán & Hoá đơn',
    subtitle: 'Thanh toán cuối hành trình, chia hoá đơn & xuất PDF',
    category: 'FINANCE',
    to: '/billing/settlement',
    icon: Receipt,
  },
  {
    id: 'reports',
    label: 'Báo Cáo Doanh Thu (Audit)',
    subtitle: 'Phân tích doanh thu hải trình & xuất báo cáo bất đồng bộ',
    category: 'FINANCE',
    to: '/reports/operational',
    icon: Receipt,
  },
];

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ADMIN_COMMAND_ITEMS;
    return ADMIN_COMMAND_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) =>
          filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          filteredItems.length > 0
            ? (prev - 1 + filteredItems.length) % filteredItems.length
            : 0
        );
      } else if (e.key === 'Enter' && filteredItems[activeIndex]) {
        e.preventDefault();
        navigate(filteredItems[activeIndex].to);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, activeIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="command-palette-modal"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#20242C]/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[18px] bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E5E7EB] bg-[#F6F7F9]">
          <Search className="w-4 h-4 text-[#5277D9] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhanh phân hệ điều hành, cảng dừng, POS... (↑↓ Enter)"
            className="w-full bg-transparent text-sm text-[#20242C] placeholder-[#687080] focus:outline-none font-sans"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng tìm kiếm nhanh"
            className="p-1.5 rounded-lg text-[#687080] hover:text-[#20242C] hover:bg-[#E5E7EB]/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2.5 space-y-1 bg-white">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#687080] font-mono">
              Không tìm thấy phân hệ phù hợp với "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    navigate(item.to);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-[12px] text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEF2FF] border border-[#5277D9]/30 text-[#20242C] shadow-xs'
                      : 'border border-transparent text-[#20242C] hover:bg-[#F6F7F9]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-[#5277D9] border-[#5277D9] text-white'
                          : 'bg-[#F1F3F7] border-[#E5E7EB] text-[#5277D9]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#20242C] truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#687080] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#687080] px-2 py-0.5 rounded bg-[#F1F3F7] border border-[#E5E7EB]">
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-[#5277D9] translate-x-0.5' : 'text-[#687080]'
                      }`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-5 py-2.5 border-t border-[#E5E7EB] bg-[#F6F7F9] flex items-center justify-between text-[10px] font-mono text-[#687080]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[#20242C] font-semibold">
              <Command className="w-3 h-3 text-[#5277D9]" />
              <span>Ctrl + K</span>
            </span>
            <span>• ↑↓ Di chuyển</span>
            <span>• Enter Mở phân hệ</span>
          </div>
          <span className="text-[#5277D9] font-semibold">ADMIN OPERATIONS CONSOLE</span>
        </div>
      </div>
    </div>
  );
};
