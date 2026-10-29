import { PROVIDER_STATUS_LABELS, PROVIDER_STATUS_STYLES, type ProviderStatus } from './providerStatus';

interface ProviderStatusBadgeProps {
  status: ProviderStatus;
}

export function ProviderStatusBadge({ status }: ProviderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${PROVIDER_STATUS_STYLES[status]}`}
    >
      {PROVIDER_STATUS_LABELS[status]}
    </span>
  );
}
