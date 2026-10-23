import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProviderSettlementDashboard } from '../pages/ProviderSettlementDashboard';
import { DisputeAdjustmentModal } from '../components/settlement/DisputeAdjustmentModal';
import { PayoutApprovalButton } from '../components/settlement/PayoutApprovalButton';
import * as settlementService from '../services/providerSettlementService';
import type { SettlementDetail } from '../services/providerSettlementService';

const mockSettlements: SettlementDetail[] = [
  {
    id: 1,
    providerId: 'phuket-tours',
    providerName: 'Phuket Island Tours Co.',
    excursionId: 10,
    excursionTitle: 'Phuket Emerald Island Tour',
    voyageId: 101,
    portId: 201,
    portName: 'Phuket Deep Sea Port',
    agreedUnitRate: 100,
    minGuaranteePax: 20,
    registeredPax: 25,
    actualPax: 22,
    noShowPax: 3,
    billablePax: 22,
    baseAmount: 2200,
    adjustedAmount: -200,
    totalAmount: 2000,
    currency: 'USD',
    status: 'PENDING_VERIFICATION',
    notes: 'Good tour',
    createdAt: '2026-10-22T08:00:00Z',
    updatedAt: '2026-10-22T08:00:00Z',
    adjustments: [
      {
        id: 101,
        adjustmentType: 'PENALTY_VEHICLE_DEFECT',
        amount: -200,
        invoiceReference: 'INV-PEN-01',
        explanation: 'Xe hỏng điều hòa',
        createdAt: '2026-10-22T08:30:00Z',
      },
    ],
  },
  {
    id: 2,
    providerId: 'da-nang-travel',
    providerName: 'Da Nang Ocean Travel',
    excursionId: 11,
    excursionTitle: 'Ba Na Hills Golden Bridge',
    voyageId: 101,
    portId: 202,
    portName: 'Tien Sa Port',
    agreedUnitRate: 120,
    minGuaranteePax: 30,
    registeredPax: 18,
    actualPax: 15,
    noShowPax: 3,
    billablePax: 30, // MAX(15, 30) = 30
    baseAmount: 3600,
    adjustedAmount: 0,
    totalAmount: 3600,
    currency: 'USD',
    status: 'APPROVED',
    approvedBy: 'FINANCE_DIRECTOR',
    approvedAt: '2026-10-22T08:45:00Z',
    notes: 'Approved',
    createdAt: '2026-10-22T08:00:00Z',
    updatedAt: '2026-10-22T08:45:00Z',
    adjustments: [],
  },
];

describe('Provider Settlement Test Suite (KAN-337, KAN-338, KAN-339)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(settlementService, 'fetchSettlements').mockResolvedValue({
      content: mockSettlements,
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
    });
  });

  it('renders dashboard with KPI metrics and reconciliation table (KAN-337)', async () => {
    render(<ProviderSettlementDashboard />);

    expect(screen.getByText('Đang tải bảng đối soát tài chính...')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText('Đối Soát & Quyết Toán Chi Phí Nhà Cung Cấp Tour')
      ).toBeInTheDocument();
      expect(screen.getByText('Phuket Emerald Island Tour')).toBeInTheDocument();
      expect(screen.getByText('Ba Na Hills Golden Bridge')).toBeInTheDocument();
    });

    // Check KPI calculations: 2000 + 3600 = 5600 USD
    expect(screen.getByText('5,600.00 USD')).toBeInTheDocument();
  });

  it('renders locked ledger badge when settlement is APPROVED or PAID (KAN-338)', async () => {
    render(
      <PayoutApprovalButton settlement={mockSettlements[1]} onApprove={vi.fn()} />
    );

    const badge = screen.getByTestId('locked-ledger-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Sổ Cái Đã Khóa (APPROVED)');
  });

  it('allows adding dispute adjustments through DisputeAdjustmentModal (KAN-338)', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <DisputeAdjustmentModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        settlementTitle="Phuket Emerald Island Tour"
        currency="USD"
      />
    );

    expect(screen.getByText('Ghi Nhận Điều Chỉnh / Tranh Chấp Chi Phí')).toBeInTheDocument();
    expect(screen.getByLabelText('Loại Điều Chỉnh')).toBeInTheDocument();
    expect(screen.getByLabelText('Số Tiền (USD)')).toBeInTheDocument();
    expect(screen.getByLabelText('Mã Hóa Đơn / Chứng Từ Đối Soát')).toBeInTheDocument();
    expect(screen.getByLabelText('Lý Do Giải Trình Chi Tiết *')).toBeInTheDocument();

    const amountInput = screen.getByLabelText('Số Tiền (USD)');
    fireEvent.change(amountInput, { target: { value: '250' } });

    const explanationInput = screen.getByLabelText('Lý Do Giải Trình Chi Tiết *');
    fireEvent.change(explanationInput, {
      target: { value: 'Hướng dẫn viên tới trễ 45 phút' },
    });

    const submitBtn = screen.getByText('Lưu Điều Chỉnh');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 250,
          explanation: 'Hướng dẫn viên tới trễ 45 phút',
        })
      );
    });
  });

  it('approves payout and triggers status update when confirmed (KAN-338)', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const handleApprove = vi.fn().mockResolvedValue(undefined);

    render(
      <PayoutApprovalButton settlement={mockSettlements[0]} onApprove={handleApprove} />
    );

    const approveBtn = screen.getByText('Phê Duyệt Chi Trả');
    fireEvent.click(approveBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(handleApprove).toHaveBeenCalledWith(1);
    });
  });
});
