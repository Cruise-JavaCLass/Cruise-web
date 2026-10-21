import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosPage } from './PosPage';
import { posService } from '../services/posService';
import { reconciliationService } from '../services/reconciliationService';

vi.mock('../services/posService', () => ({
  posService: {
    getTransactions: vi.fn(),
    getFolio: vi.fn(),
    createTransaction: vi.fn(),
    getShiftSummary: vi.fn(),
    syncOfflineBatch: vi.fn(),
    getActiveShift: vi.fn(),
  },
}));

vi.mock('../services/reconciliationService', () => ({
  reconciliationService: {
    getSummaryMetrics: vi.fn(),
    getDiscrepancies: vi.fn(),
    getDisputes: vi.fn(),
  },
}));

describe('PosPage Component Tests (KAN-234, KAN-391, KAN-392)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(reconciliationService.getSummaryMetrics).mockResolvedValue({
      totalReconciledAmount: 0,
      totalDisputedAmount: 0,
      totalVarianceAmount: 0,
      totalTransactionsCount: 0,
      openDisputesCount: 0,
      resolvedDisputesCount: 0,
      pendingDiscrepanciesCount: 0,
      discrepancyRatePercent: 0,
      criticalAlertActive: false,
      alertMessage: '',
      generatedAt: new Date().toISOString(),
    });
    vi.mocked(reconciliationService.getDiscrepancies).mockResolvedValue([]);
    vi.mocked(reconciliationService.getDisputes).mockResolvedValue([]);

    vi.mocked(posService.getActiveShift).mockResolvedValue({
      id: 1,
      stationId: 'BAR-DECK-9',
      status: 'OPEN',
    } as any);
  });

  it('renders POS Header and both Navigation Tabs', () => {
    render(<PosPage />);
    expect(screen.getByText(/Hệ Thống POS & Tài Khoản Phi Tiền Mặt/i)).toBeInTheDocument();
    expect(screen.getByText('Quầy Bán Hàng (POS Register)')).toBeInTheDocument();
    expect(screen.getByText('Sổ Cái Giao Dịch & Quản Lý (Ledger)')).toBeInTheDocument();
  });

  it('switches to Ledger tab and loads transactions', async () => {
    const user = userEvent.setup();
    vi.mocked(posService.getTransactions).mockResolvedValueOnce({
      content: [
        {
          id: 1,
          transactionUuid: 'TX-TEST-777',
          stationId: 'BAR-DECK-9',
          cashierId: 'CASHIER-HUY',
          cabinNumber: 'CABIN-7012',
          guestName: 'Nguyễn Văn An',
          paymentMethod: 'CABIN_FOLIO',
          type: 'CHARGE',
          status: 'COMPLETED',
          subtotal: 50.0,
          tax: 4.0,
          gratuity: 5.0,
          discount: 0,
          totalAmount: 59.0,
          refundedAmount: 0,
          remainingRefundableAmount: 59.0,
          currency: 'USD',
          settled: false,
          createdAt: new Date().toISOString(),
          items: [],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    });

    render(<PosPage />);

    const ledgerTab = screen.getByText('Sổ Cái Giao Dịch & Quản Lý (Ledger)');
    await user.click(ledgerTab);

    await waitFor(() => {
      expect(posService.getTransactions).toHaveBeenCalled();
      expect(screen.getByText('TX-TEST-777')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });
  });

  it('opens Shift Summary modal when clicking Báo Cáo Ca', async () => {
    const user = userEvent.setup();
    render(<PosPage />);

    const reportBtn = screen.getByRole('button', { name: /Báo Cáo Ca \(X\/Z Report\)/i });
    await waitFor(() => expect(reportBtn).toBeEnabled());
    await user.click(reportBtn);

    expect(await screen.findByText(/Báo Cáo Ca POS/i)).toBeInTheDocument();
  });
});
