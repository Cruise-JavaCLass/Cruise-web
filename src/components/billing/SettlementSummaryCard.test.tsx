import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettlementSummaryCard } from './SettlementSummaryCard';
import { makePreview } from '../../test/fixtures/settlement';

describe('SettlementSummaryCard', () => {
  it('renders the net amount and the folio breakdown', () => {
    render(<SettlementSummaryCard preview={makePreview()} loading={false} error={null} />);

    expect(screen.getByText('Cabin CABIN-7012')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('$309.00')).toBeInTheDocument();
    expect(screen.getByText('Tạm tính')).toBeInTheDocument();
    expect(screen.getByText('$300.00')).toBeInTheDocument();
    expect(screen.getByText('-$20.00')).toBeInTheDocument();
    expect(screen.getByText('-$40.00')).toBeInTheDocument();
  });

  it('shows a warning badge when a dispute amount is held', () => {
    render(
      <SettlementSummaryCard
        preview={makePreview({ heldDisputeAmount: 50, openDisputeCount: 2 })}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText(/Đang giữ \$50\.00 cho 2 khiếu nại chưa xử lý/i)).toBeInTheDocument();
  });

  it('renders a skeleton while loading', () => {
    render(<SettlementSummaryCard preview={null} loading={true} error={null} />);

    expect(
      screen.getByRole('status', { name: /Đang tải bản tóm tắt tất toán/i }),
    ).toBeInTheDocument();
  });

  it('renders the error empty state', () => {
    render(
      <SettlementSummaryCard
        preview={null}
        loading={false}
        error="Không tìm thấy folio cho cabin này"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Không tìm thấy folio cho cabin này');
  });
});
