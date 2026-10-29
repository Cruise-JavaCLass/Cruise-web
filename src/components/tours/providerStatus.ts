import type { TourProvider } from '../../services/tourService';

export type ProviderStatus = TourProvider['status'];

export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm ngưng',
  TERMINATED: 'Đã chấm dứt',
};

export const PROVIDER_STATUS_STYLES: Record<ProviderStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200',
  TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200',
};
