import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PosDigitalSignaturePad } from './PosDigitalSignaturePad';
import { CabinBillSplittingWizard } from './CabinBillSplittingWizard';
import { cabinBillingService } from '../../services/cabinBillingService';

vi.mock('../../services/cabinBillingService');

describe('PosDigitalSignaturePad Component Tests (KAN-305 & KAN-520)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    signerName: 'Nguyễn Văn An',
    cabinNumber: 'CABIN-7012',
    totalAmount: 125.5,
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock HTMLCanvasElement.getContext and toDataURL
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: '',
    });
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockValidSignatureStroke');
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 460,
      height: 180,
    });
  });

  it('renders signature modal with guest name, cabin number and amount', () => {
    render(<PosDigitalSignaturePad {...defaultProps} />);

    expect(screen.getByText('Xác Nhận Chữ Ký Điện Tử (E-Signature)')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Phòng: CABIN-7012')).toBeInTheDocument();
    expect(screen.getByText('$125.50')).toBeInTheDocument();
    expect(screen.getByText('Ký tên tại đây (Sign Here)')).toBeInTheDocument();
  });

  it('prevents confirmation when canvas has no stroke', async () => {
    render(<PosDigitalSignaturePad {...defaultProps} />);

    const confirmBtn = screen.getByRole('button', { name: /Xác Nhận & Xuất E-Receipt/i });
    fireEvent.click(confirmBtn);

    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    expect(
      await screen.findByText('Vui lòng ký tên vào khung trước khi xác nhận hóa đơn!')
    ).toBeInTheDocument();
  });

  it('captures drawing stroke and exports base64 upon confirmation', async () => {
    render(<PosDigitalSignaturePad {...defaultProps} />);

    const canvas = document.querySelector('canvas')!;
    expect(canvas).toBeInTheDocument();

    // Simulate drawing gesture
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 80 });
    fireEvent.mouseUp(canvas);

    const confirmBtn = screen.getByRole('button', { name: /Xác Nhận & Xuất E-Receipt/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledWith('data:image/png;base64,mockValidSignatureStroke');
    });
  });

  it('clears canvas drawing and resets stroke status', () => {
    render(<PosDigitalSignaturePad {...defaultProps} />);

    const canvas = document.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 80 });
    fireEvent.mouseUp(canvas);

    const clearBtn = screen.getByRole('button', { name: /Xóa chữ ký/i });
    fireEvent.click(clearBtn);

    // After clearing, submitting should fail with empty stroke warning
    const confirmBtn = screen.getByRole('button', { name: /Xác Nhận & Xuất E-Receipt/i });
    fireEvent.click(confirmBtn);

    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Vui lòng ký tên vào khung trước khi xác nhận hóa đơn!')).toBeInTheDocument();
  });
});

describe('CabinBillSplittingWizard Component Tests (KAN-519 & KAN-520)', () => {
  const mockMembers = [
    {
      passengerId: 101,
      guestName: 'Nguyễn Văn An',
      isMinor: false,
      isAuthorizedSigner: true,
      cabinNumber: 'CABIN-7012',
      individualCreditLimit: 1000,
      individualBalance: 100,
    },
    {
      passengerId: 102,
      guestName: 'Trần Thị Mai',
      isMinor: false,
      isAuthorizedSigner: true,
      cabinNumber: 'CABIN-7012',
      individualCreditLimit: 500,
      individualBalance: 50,
    },
    {
      passengerId: 103,
      guestName: 'Nguyễn Bé',
      isMinor: true,
      isAuthorizedSigner: false,
      cabinNumber: 'CABIN-7012',
      individualCreditLimit: 100,
      individualBalance: 0,
    },
  ];

  const wizardProps = {
    isOpen: true,
    onClose: vi.fn(),
    cabinNumber: 'CABIN-7012',
    stationId: 'BAR-DECK-9',
    cashierId: 'CASHIER-01',
    totalAmount: 100.55,
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cabinBillingService.getCabinMembers).mockResolvedValue(mockMembers);
  });

  it('renders cabin occupants and locks minor/unauthorized signer', async () => {
    render(<CabinBillSplittingWizard {...wizardProps} />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Bé')).toBeInTheDocument();
    });

    // Check lock indicator on minor
    expect(screen.getByText('Trẻ em')).toBeInTheDocument();
    // Minor checkbox should be disabled
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[2]).toBeDisabled();
  });

  it('calculates even split with cent rounding accurately across selected occupants', async () => {
    render(<CabinBillSplittingWizard {...wizardProps} />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    // Total 100.55 between 2 adults: 50.27 and 50.28
    expect(screen.getByText('$50.27')).toBeInTheDocument();
    expect(screen.getByText('$50.28')).toBeInTheDocument();
    expect(screen.getByText('Khớp 100%')).toBeInTheDocument();
  });

  it('submits split billing request successfully', async () => {
    vi.mocked(cabinBillingService.splitBilling).mockResolvedValue({
      cabinNumber: 'CABIN-7012',
      totalAmount: 100.55,
      splitCount: 2,
      splits: [],
    });

    render(<CabinBillSplittingWizard {...wizardProps} />);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Hoàn Tất Phân Bổ Hóa Đơn/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(cabinBillingService.splitBilling).toHaveBeenCalledWith(
        expect.objectContaining({
          cabinNumber: 'CABIN-7012',
          stationId: 'BAR-DECK-9',
          cashierId: 'CASHIER-01',
          splitShares: expect.arrayContaining([
            expect.objectContaining({ passengerId: 101, amount: 50.27 }),
            expect.objectContaining({ passengerId: 102, amount: 50.28 }),
          ]),
        })
      );
      expect(wizardProps.onSuccess).toHaveBeenCalled();
    });
  });
});
