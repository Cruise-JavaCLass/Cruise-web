import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PassengerFolioViewer } from '../passenger/PassengerFolioViewer';
import { PassengerDisputeModal } from '../passenger/PassengerDisputeModal';
import { DiscrepancyInspectorModal } from './DiscrepancyInspectorModal';
import { DisputeManagementWorkspace } from './DisputeManagementWorkspace';
import { PosPage } from '../../pages/PosPage';
import { reconciliationService, type GuestFolioItem, type DiscrepancyRecord, type DisputeCase } from '../../services/reconciliationService';

describe('PassengerFolioViewer & PassengerDisputeModal Tests (KAN-401)', () => {
  it('renders guest folio summary, cabin number and transaction items', () => {
    render(<PassengerFolioViewer cabinNumber="Cabin 402" passengerName="Nguyễn Văn Minh" />);

    expect(screen.getByText('Sao Kê Chi Tiêu Phòng (Guest Folio)')).toBeDefined();
    expect(screen.getByText(/Cabin 402/)).toBeDefined();
    expect(screen.getByText(/Nguyễn Văn Minh/)).toBeDefined();
    expect(screen.getByText('Sky Bar & Cocktail Lounge - 2x Mojito & Snacks')).toBeDefined();
  });

  it('opens dispute modal when clicking Khiếu nại on a transaction', () => {
    render(<PassengerFolioViewer cabinNumber="Cabin 402" passengerName="Nguyễn Văn Minh" />);

    const disputeButtons = screen.getAllByRole('button', { name: /Khiếu nại/i });
    expect(disputeButtons.length).toBeGreaterThan(0);
    fireEvent.click(disputeButtons[0]);

    expect(screen.getByText('Khiếu Nại Chi Phí Phòng')).toBeDefined();
    expect(screen.getByText(/Gửi Yêu Cầu Khiếu Nại/i)).toBeDefined();
  });

  it('validates passenger note before submitting dispute', async () => {
    const mockItem: GuestFolioItem = {
      id: '1',
      transactionId: 'TX-TEST-01',
      folioId: 'FOLIO-TEST',
      cabinNumber: 'Cabin 101',
      passengerName: 'Test Guest',
      description: 'Bar charge',
      serviceArea: 'Bar',
      amount: 50.0,
      isReversal: false,
      postedAt: '10:00',
    };

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <PassengerDisputeModal
        isOpen={true}
        onClose={onClose}
        item={mockItem}
        onSuccess={onSuccess}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Gửi Yêu Cầu Khiếu Nại/i });
    fireEvent.click(submitBtn);

    // Form prevents submission if passengerNote is empty and displays error
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByText('Vui lòng nhập lý do giải thích chi tiết cho khiếu nại này')).toBeInTheDocument();
  });

  it('submits dispute successfully when note is entered', async () => {
    const spyCreate = vi.spyOn(reconciliationService, 'createDispute').mockResolvedValueOnce({
      id: 99,
      disputeNumber: 'DISP-99',
      transactionId: 'TX-TEST-01',
      folioId: 'FOLIO-TEST',
      cabinNumber: 'Cabin 101',
      reason: 'DUPLICATE_BILLING',
      disputeAmount: 50.0,
      passengerNote: 'Quẹt nhầm thẻ 2 lần',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    });

    const mockItem: GuestFolioItem = {
      id: '1',
      transactionId: 'TX-TEST-01',
      folioId: 'FOLIO-TEST',
      cabinNumber: 'Cabin 101',
      passengerName: 'Test Guest',
      description: 'Bar charge',
      serviceArea: 'Bar',
      amount: 50.0,
      isReversal: false,
      postedAt: '10:00',
    };

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <PassengerDisputeModal
        isOpen={true}
        onClose={onClose}
        item={mockItem}
        onSuccess={onSuccess}
      />
    );

    const textarea = screen.getByPlaceholderText(/Ví dụ: Tôi chỉ gọi 1 phần nước ép/i);
    fireEvent.change(textarea, { target: { value: 'Quẹt nhầm thẻ 2 lần tại quầy' } });

    const submitBtn = screen.getByRole('button', { name: /Gửi Yêu Cầu Khiếu Nại/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(spyCreate).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('DiscrepancyInspectorModal & DisputeManagementWorkspace Tests (KAN-401)', () => {
  it('renders discrepancy inspector diff view with POS and Folio columns', () => {
    const mockRecord: DiscrepancyRecord = {
      id: 1,
      batchId: 101,
      transactionId: 'TX-DIFF-1',
      folioId: 'FOLIO-101',
      cabinNumber: 'Cabin 202',
      passengerName: 'Alice',
      serviceArea: 'Spa',
      discrepancyType: 'AMOUNT_MISMATCH',
      posAmount: 120.0,
      folioAmount: 100.0,
      variance: 20.0,
      status: 'DETECTED',
    };

    const onResolve = vi.fn();
    const onClose = vi.fn();

    render(
      <DiscrepancyInspectorModal
        isOpen={true}
        onClose={onClose}
        record={mockRecord}
        onResolve={onResolve}
      />
    );

    expect(screen.getByText('Soi Chi Tiết Sai Lệch Đối Soát')).toBeDefined();
    expect(screen.getByText(/1. Nhật Ký Trạm POS/i)).toBeDefined();
    expect(screen.getByText(/2. Sổ Cái Cabin Folio/i)).toBeDefined();
    expect(screen.getByText('$120.00 USD')).toBeDefined();
    expect(screen.getByText('$100.00 USD')).toBeDefined();
    expect(screen.getByText('$20.00 USD')).toBeDefined();
  });

  it('renders dispute management workspace with search, filter and approval modal', async () => {
    const mockDisputes: DisputeCase[] = [
      {
        id: 1,
        disputeNumber: 'DISP-1001',
        transactionId: 'TX-DISP-1',
        folioId: 'FOLIO-303',
        cabinNumber: 'Cabin 303',
        passengerName: 'Bob',
        reason: 'DUPLICATE_BILLING',
        disputeAmount: 45.0,
        passengerNote: 'Giao dịch trùng lặp',
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      },
    ];

    const onResolveDispute = vi.fn();

    render(
      <DisputeManagementWorkspace
        disputes={mockDisputes}
        onResolveDispute={onResolveDispute}
        isLoading={false}
      />
    );

    expect(screen.getByText('DISP-1001')).toBeDefined();
    expect(screen.getByText('Cabin 303')).toBeDefined();
    expect(screen.getByText('"Giao dịch trùng lặp"')).toBeDefined();

    // Click "Thẩm định"
    const reviewBtn = screen.getByRole('button', { name: /Thẩm định/i });
    fireEvent.click(reviewBtn);

    expect(screen.getByText(/Thẩm Định Khiếu Nại #DISP-1001/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Phê Duyệt & Bù Trừ Folio/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Từ Chối Khiếu Nại/i })).toBeDefined();
  });
});

describe('PosPage Dashboard Integration Tests (KAN-401)', () => {
  it('switches tabs between Register, Reconciliation, and Disputes', async () => {
    vi.spyOn(reconciliationService, 'getSummaryMetrics').mockResolvedValueOnce({
      totalReconciledAmount: 184350.0,
      totalDisputedAmount: 63.5,
      totalVarianceAmount: 258.5,
      totalTransactionsCount: 1420,
      openDisputesCount: 2,
      resolvedDisputesCount: 14,
      pendingDiscrepanciesCount: 3,
      discrepancyRatePercent: 0.21,
      criticalAlertActive: false,
      alertMessage: 'Hệ thống vận hành an toàn.',
      generatedAt: new Date().toISOString(),
    });
    vi.spyOn(reconciliationService, 'getDiscrepancies').mockResolvedValueOnce([]);
    vi.spyOn(reconciliationService, 'getDisputes').mockResolvedValueOnce([]);

    render(<PosPage />);

    expect(screen.getByText(/Hệ Thống POS & Tài Khoản Phi Tiền Mặt/i)).toBeDefined();
    expect(screen.getByText(/Quầy Thu Ngân & Giao Dịch/i)).toBeDefined();

    // Click Reconciliation tab
    const reconTab = screen.getByRole('button', { name: /Trung Tâm Đối Soát/i });
    fireEvent.click(reconTab);

    await waitFor(() => {
      expect(screen.getByText(/Bảng Sai Lệch Đối Soát Giao Dịch/i)).toBeDefined();
    });

    // Click Disputes tab
    const disputeTab = screen.getByRole('button', { name: /Hồ Sơ Khiếu Nại Chi Phí/i });
    fireEvent.click(disputeTab);

    await waitFor(() => {
      expect(screen.getByText(/Danh Sách Hồ Sơ Khiếu Nại Chi Phí/i)).toBeDefined();
    });
  });
});
