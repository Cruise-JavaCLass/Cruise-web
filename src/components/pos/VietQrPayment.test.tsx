import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettlementCheckoutModal } from './SettlementCheckoutModal';
import { BankSimulatorControlPanel } from './BankSimulatorControlPanel';
import { paymentGatewayService } from '../../services/paymentGatewayService';
import type { VietQrPaymentResponse } from '../../services/paymentGatewayTypes';

describe('SettlementCheckoutModal (KAN-310 & KAN-432)', () => {
  const mockQrResponse: VietQrPaymentResponse = {
    paymentReference: 'PAY-TEST-123',
    cabinNumber: 'CABIN-701',
    amount: 1200000,
    currency: 'VND',
    bankCode: '970436',
    accountNumber: '1028391829',
    accountName: 'CRUISE LINE CORP',
    description: 'FOLIO SETTLEMENT CABIN-701',
    qrCodeText: '00020101...',
    qrImageUrl: 'https://img.vietqr.io/image/970436.png',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 900000).toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates VietQR on open and displays amount, account details, and polling indicator', async () => {
    vi.spyOn(paymentGatewayService, 'generateVietQr').mockResolvedValue(mockQrResponse);
    vi.spyOn(paymentGatewayService, 'getPaymentStatus').mockResolvedValue('PENDING');

    render(
      <SettlementCheckoutModal
        isOpen={true}
        onClose={vi.fn()}
        cabinNumber="CABIN-701"
        amount={1200000}
      />
    );

    expect(screen.getByText('Thanh Toán Tất Toán VietQR')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/1\.200\.000/)).toBeInTheDocument();
      expect(screen.getByText('FOLIO SETTLEMENT CABIN-701')).toBeInTheDocument();
      expect(screen.getByText(/Đang chờ hệ thống ngân hàng xác nhận tiền về/)).toBeInTheDocument();
    });
  });

  it('triggers onPaymentSuccess when payment status turns to PAID', async () => {
    vi.spyOn(paymentGatewayService, 'generateVietQr').mockResolvedValue(mockQrResponse);
    vi.spyOn(paymentGatewayService, 'getPaymentStatus').mockResolvedValue('PAID');
    const onPaymentSuccess = vi.fn();

    render(
      <SettlementCheckoutModal
        isOpen={true}
        onClose={vi.fn()}
        cabinNumber="CABIN-701"
        amount={1200000}
        onPaymentSuccess={onPaymentSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Đã nhận thanh toán thành công/)).toBeInTheDocument();
      // QR image should be hidden when status is PAID
      expect(screen.queryByAltText('Mã VietQR Thanh Toán')).not.toBeInTheDocument();
      expect(onPaymentSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('does not re-trigger generateVietQr when onPaymentSuccess callback changes', async () => {
    const generateSpy = vi.spyOn(paymentGatewayService, 'generateVietQr').mockResolvedValue(mockQrResponse);
    vi.spyOn(paymentGatewayService, 'getPaymentStatus').mockResolvedValue('PENDING');

    const fn1 = vi.fn();
    const { rerender } = render(
      <SettlementCheckoutModal
        isOpen={true}
        onClose={vi.fn()}
        cabinNumber="CABIN-701"
        amount={1200000}
        onPaymentSuccess={fn1}
      />
    );

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledTimes(1);
    });

    const fn2 = vi.fn();
    rerender(
      <SettlementCheckoutModal
        isOpen={true}
        onClose={vi.fn()}
        cabinNumber="CABIN-701"
        amount={1200000}
        onPaymentSuccess={fn2}
      />
    );

    // generateVietQr should NOT be called again simply because the callback changed
    expect(generateSpy).toHaveBeenCalledTimes(1);
  });

  it('clears QR data and stops loading when cabinNumber becomes empty or amount <= 0', async () => {
    vi.spyOn(paymentGatewayService, 'generateVietQr').mockResolvedValue(mockQrResponse);
    vi.spyOn(paymentGatewayService, 'getPaymentStatus').mockResolvedValue('PENDING');

    const { rerender } = render(
      <SettlementCheckoutModal
        isOpen={true}
        onClose={vi.fn()}
        cabinNumber="CABIN-701"
        amount={1200000}
      />
    );

    await waitFor(() => {
      expect(screen.getByAltText('Mã VietQR Thanh Toán')).toBeInTheDocument();
    });

    // Invalidate input
    rerender(
      <SettlementCheckoutModal
        isOpen={true}
        onClose={vi.fn()}
        cabinNumber=""
        amount={1200000}
      />
    );

    await waitFor(() => {
      expect(screen.queryByAltText('Mã VietQR Thanh Toán')).not.toBeInTheDocument();
    });
  });
});

describe('BankSimulatorControlPanel (KAN-431 & KAN-432)', () => {
  it('triggers simulateBankWebhook successfully on button click', async () => {
    const onComplete = vi.fn();
    vi.spyOn(paymentGatewayService, 'simulateBankWebhook').mockResolvedValue({
      paymentReference: 'PAY-SIM-999',
      paymentStatus: 'PAID',
      folioSettled: true,
      message: 'Settlement confirmed',
      processedAt: new Date().toISOString(),
    });

    render(
      <BankSimulatorControlPanel
        currentPaymentRef="PAY-SIM-999"
        defaultAmount={2000000}
        onSimulationComplete={onComplete}
      />
    );

    expect(screen.getByText('Mock Bank Webhook Sandbox Simulator (VietQR)')).toBeInTheDocument();

    const triggerBtn = screen.getByRole('button', { name: '⚡ Bắn Webhook Thành Công Tức Thì' });
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByText(/✓ Phản hồi từ cổng: Settlement confirmed/)).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
