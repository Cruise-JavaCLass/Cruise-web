import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FolioTransactionList } from './FolioTransactionList';
import { FolioTransaction } from '../../services/passengerFolioService';

describe('FolioTransactionList Component', () => {
  const mockTransactions: FolioTransaction[] = [
    {
      id: 1,
      transactionUuid: 'TX-001',
      time: '2026-10-21T11:00:00Z',
      locationCounter: 'Deck 9 Ocean Bar',
      posCode: 'POS-01',
      swipedBy: 'Nguyễn Văn An',
      amount: 45.0,
      currency: 'USD',
      category: 'FOOD_AND_BEVERAGE',
      complimentary: false,
      status: 'COMPLETED',
      items: [
        {
          itemCode: 'COCKTAIL-1',
          itemName: 'Mojito Cruise',
          category: 'FOOD_AND_BEVERAGE',
          quantity: 3,
          unitPrice: 15.0,
          totalPrice: 45.0,
          complimentary: false,
        },
      ],
    },
    {
      id: 2,
      transactionUuid: 'TX-002',
      time: '2026-10-21T12:00:00Z',
      locationCounter: 'Shore Tour Desk',
      posCode: 'POS-02',
      swipedBy: 'Nguyễn Văn An',
      amount: 0.0,
      currency: 'USD',
      category: 'SHORE_EXCURSIONS',
      complimentary: true,
      status: 'COMPLETED',
      items: [
        {
          itemCode: 'TOUR-COMP-01',
          itemName: 'Welcome Island Tour',
          category: 'SHORE_EXCURSIONS',
          quantity: 1,
          unitPrice: 0.0,
          totalPrice: 0.0,
          complimentary: true,
        },
      ],
    },
  ];

  it('renders transactions and properly marks complimentary packages as $0.00', () => {
    render(
      <FolioTransactionList
        transactions={mockTransactions}
        isLoading={false}
        onOpenDispute={vi.fn()}
        selectedCategory="ALL"
        onSelectCategory={vi.fn()}
        page={0}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('Deck 9 Ocean Bar')).toBeDefined();
    expect(screen.getByText('Shore Tour Desk')).toBeDefined();
    expect(screen.getByText('$45.00')).toBeDefined();
    expect(screen.getByText('$0.00')).toBeDefined();
    expect(screen.getByText('Gói tặng kèm')).toBeDefined();
  });

  it('toggles item details when clicking Chi tiết', () => {
    render(
      <FolioTransactionList
        transactions={mockTransactions}
        isLoading={false}
        onOpenDispute={vi.fn()}
        selectedCategory="ALL"
        onSelectCategory={vi.fn()}
        page={0}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    const expandBtn = screen.getAllByText(/Chi tiết/i)[0];
    fireEvent.click(expandBtn);

    expect(screen.getByText('Mojito Cruise')).toBeDefined();
    expect(screen.getByText('Danh sách món / dịch vụ chi tiết')).toBeDefined();
  });

  it('triggers onOpenDispute when clicking Khiếu nại', () => {
    const onOpenDispute = vi.fn();
    render(
      <FolioTransactionList
        transactions={mockTransactions}
        isLoading={false}
        onOpenDispute={onOpenDispute}
        selectedCategory="ALL"
        onSelectCategory={vi.fn()}
        page={0}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    const disputeBtn = screen.getByText('Khiếu nại');
    fireEvent.click(disputeBtn);

    expect(onOpenDispute).toHaveBeenCalledWith(mockTransactions[0]);
  });
});
