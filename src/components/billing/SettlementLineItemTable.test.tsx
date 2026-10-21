import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SettlementLineItemTable } from './SettlementLineItemTable';
import type { SettlementLineItem } from '../../services/settlementService';

const makeItem = (overrides: Partial<SettlementLineItem>): SettlementLineItem => ({
  description: 'Sky Bar Cocktail',
  serviceArea: 'BEVERAGE',
  postedAt: '2026-10-20T09:00:00Z',
  amount: 40,
  isReversal: false,
  ...overrides,
});

describe('SettlementLineItemTable', () => {
  it('shows an empty state when the folio has no line items', () => {
    render(<SettlementLineItemTable lineItems={[]} currency="USD" />);

    expect(screen.getByText(/Chưa có khoản mục nào/i)).toBeInTheDocument();
    expect(screen.getByText('0 mục')).toBeInTheDocument();
  });

  it('sorts line items by posted time ascending', () => {
    render(
      <SettlementLineItemTable
        lineItems={[
          makeItem({ description: 'Spa Massage', postedAt: '2026-10-20T11:00:00Z' }),
          makeItem({ description: 'Sky Bar Cocktail', postedAt: '2026-10-20T09:00:00Z' }),
        ]}
        currency="USD"
      />,
    );

    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Sky Bar Cocktail')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Spa Massage')).toBeInTheDocument();
  });

  it('renders reversals as negative amounts with a badge', () => {
    render(
      <SettlementLineItemTable
        lineItems={[
          makeItem({ description: 'Hoàn tiền giao dịch TX-1', amount: 25, isReversal: true }),
        ]}
        currency="USD"
      />,
    );

    expect(screen.getByText('Hoàn tiền giao dịch TX-1')).toBeInTheDocument();
    expect(screen.getByText('Reversal')).toBeInTheDocument();
    expect(screen.getByText('-$25.00')).toBeInTheDocument();
  });
});
