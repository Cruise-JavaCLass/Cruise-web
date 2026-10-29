import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ProviderStatusBadge } from './ProviderStatusBadge';

afterEach(() => {
  cleanup();
});

describe('ProviderStatusBadge', () => {
  it.each([
    ['ACTIVE', 'Đang hoạt động', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200'],
    ['SUSPENDED', 'Tạm ngưng', 'bg-amber-50', 'text-amber-700', 'border-amber-200'],
    ['TERMINATED', 'Đã chấm dứt', 'bg-rose-50', 'text-rose-700', 'border-rose-200'],
  ] as const)(
    'renders the correct label and colors for %s',
    (status, label, backgroundColor, textColor, borderColor) => {
      render(<ProviderStatusBadge status={status} />);

      const badge = screen.getByText(label);
      expect(badge).toHaveClass(backgroundColor, textColor, borderColor);
    }
  );
});
