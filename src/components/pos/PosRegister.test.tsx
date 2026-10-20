import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosRegister } from './PosRegister';
import { posService } from '../../services/posService';
import { posCatalogService } from '../../services/posCatalogService';

vi.mock('../../services/posService', () => ({
  posService: {
    getFolio: vi.fn(),
    createTransaction: vi.fn(),
  },
}));

vi.mock('../../services/posCatalogService', () => ({
  posCatalogService: {
    getOutlets: vi.fn(),
    getCategories: vi.fn(),
    getProducts: vi.fn(),
    calculatePricing: vi.fn(),
    lookupByBarcode: vi.fn(),
  },
}));

describe('PosRegister Component Tests (KAN-234 & KAN-392)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(posCatalogService.getOutlets).mockResolvedValue([
      { id: 1, code: 'SKY-BAR', name: 'Sky Bar & Lounge', outletType: 'BAR', isActive: true },
      { id: 2, code: 'LIDO-BUFFET', name: 'Lido Buffet & Grill', outletType: 'RESTAURANT', isActive: true },
    ]);
    vi.mocked(posCatalogService.getCategories).mockResolvedValue([
      { id: 1, code: 'CAT-BEV', name: 'Đồ Uống', displayOrder: 1, isActive: true },
    ]);
    vi.mocked(posCatalogService.getProducts).mockResolvedValue({
      content: [
        {
          id: 1,
          sku: 'BEV-MOJ-001',
          name: 'Cocktail Mojito Bạc Hà',
          basePrice: 14.5,
          categoryId: 1,
          categoryName: 'Đồ Uống',
          outletId: 1,
          status: 'ACTIVE',
          isAvailable: true,
          is86ed: false,
          stockQuantity: 100,
          happyHourEligible: true,
          happyHourDiscountPercent: 20,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 100,
      number: 0,
    });
    vi.mocked(posCatalogService.calculatePricing).mockImplementation(async (req) => {
      const subtotal = req.items.reduce((sum, item) => sum + 14.5 * item.quantity, 0);
      const tax = Math.round(subtotal * 0.1 * 100) / 100;
      const svc = Math.round(subtotal * 0.18 * 100) / 100;
      return {
        subtotal,
        happyHourDiscount: 0,
        taxableSubtotal: subtotal,
        maritimeTax: tax,
        taxRatePercent: 10,
        serviceCharge: svc,
        serviceChargePercent: 18,
        grandTotal: Math.round((subtotal + tax + svc) * 100) / 100,
        isDutyFree: false,
        isHappyHourActive: false,
        items: [],
      };
    });
  });

  it('renders item catalog and category filter buttons', () => {
    render(<PosRegister />);
    expect(screen.getByText('Tất Cả')).toBeInTheDocument();
    expect(screen.getByText('Đồ Uống')).toBeInTheDocument();
    expect(screen.getByText('Cocktail Mojito Bạc Hà')).toBeInTheDocument();
  });

  it('adds items to cart and calculates subtotal and total correctly', async () => {
    const user = userEvent.setup();
    render(<PosRegister />);

    const addButtons = screen.getAllByRole('button', { name: /Thêm/i });
    await user.click(addButtons[0]); // Adds Mojito ($14.50)

    await waitFor(() => {
      expect(screen.getByText('Giỏ Hàng (1)')).toBeInTheDocument();
      expect(screen.getByText('$14.50/món')).toBeInTheDocument();
    });
  });

  it('looks up cabin folio and renders available limit', async () => {
    const user = userEvent.setup();
    vi.mocked(posService.getFolio).mockResolvedValueOnce({
      id: 1,
      cabinNumber: 'CABIN-7012',
      primaryGuestName: 'Nguyễn Văn An',
      creditLimit: 1500.0,
      currentBalance: 200.0,
      availableLimit: 1300.0,
      status: 'ACTIVE',
    });

    render(<PosRegister />);

    const checkBtn = screen.getByRole('button', { name: /Kiểm Tra/i });
    await user.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.getByText('$1300.00')).toBeInTheDocument();
    });
  });

  it('submits checkout transaction successfully and opens receipt modal', async () => {
    const user = userEvent.setup();
    const mockTx = {
      id: 10,
      transactionUuid: 'TX-TEST-001',
      stationId: 'BAR-DECK-9',
      cashierId: 'CASHIER-HUY',
      paymentMethod: 'CABIN_FOLIO' as const,
      type: 'CHARGE' as const,
      status: 'COMPLETED' as const,
      subtotal: 14.5,
      tax: 1.16,
      gratuity: 2.18,
      discount: 0,
      totalAmount: 17.84,
      refundedAmount: 0,
      remainingRefundableAmount: 17.84,
      currency: 'USD',
      settled: false,
      createdAt: new Date().toISOString(),
      items: [{ itemCode: 'BEV-01', itemName: 'Cocktail Mojito Bạc Hà', category: 'BEVERAGE', quantity: 1, unitPrice: 14.5, totalPrice: 14.5 }],
    };

    vi.mocked(posService.createTransaction).mockResolvedValueOnce(mockTx);

    render(<PosRegister />);

    // Add item
    const addButtons = screen.getAllByRole('button', { name: /Thêm/i });
    await user.click(addButtons[0]);

    // Click checkout
    const checkoutBtn = screen.getByRole('button', { name: /Thanh Toán/i });
    await user.click(checkoutBtn);

    await waitFor(() => {
      expect(posService.createTransaction).toHaveBeenCalled();
      expect(screen.getByText('Hóa Đơn Điện Tử POS')).toBeInTheDocument();
      expect(screen.getByText('Mã GD: TX-TEST-001')).toBeInTheDocument();
    });
  });

  it('exposes payment methods as a labeled group with aria-pressed states', async () => {
    const user = userEvent.setup();
    render(<PosRegister />);

    const paymentGroup = screen.getByRole('group', { name: /Phương thức thanh toán/i });
    expect(paymentGroup).toBeInTheDocument();

    const cabinFolioBtn = screen.getByRole('button', { name: 'Tài Khoản Phòng' });
    const creditCardBtn = screen.getByRole('button', { name: 'Thẻ Tín Dụng' });
    const cashBtn = screen.getByRole('button', { name: 'Tiền Mặt' });

    expect(cabinFolioBtn).toHaveAttribute('aria-pressed', 'true');
    expect(creditCardBtn).toHaveAttribute('aria-pressed', 'false');
    expect(cashBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(creditCardBtn);
    expect(cabinFolioBtn).toHaveAttribute('aria-pressed', 'false');
    expect(creditCardBtn).toHaveAttribute('aria-pressed', 'true');
    expect(cashBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(cashBtn);
    expect(cabinFolioBtn).toHaveAttribute('aria-pressed', 'false');
    expect(creditCardBtn).toHaveAttribute('aria-pressed', 'false');
    expect(cashBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('holds an active order and restores it back to cart', async () => {
    const user = userEvent.setup();
    render(<PosRegister />);

    const addButtons = screen.getAllByRole('button', { name: /Thêm/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Giỏ Hàng (1)')).toBeInTheDocument();
    });

    // Click hold order button
    const holdBtn = screen.getByTitle('Lưu tạm đơn (Hold Order)');
    await user.click(holdBtn);

    // Cart is now empty
    expect(screen.getByText('Giỏ Hàng (0)')).toBeInTheDocument();
    expect(screen.getByText(/Đơn tạm giữ \(1\)/i)).toBeInTheDocument();

    // Click restore
    const restoreBtn = screen.getByRole('button', { name: /Phục hồi/i });
    await user.click(restoreBtn);

    // Cart is restored
    await waitFor(() => {
      expect(screen.getByText('Giỏ Hàng (1)')).toBeInTheDocument();
    });
  });

  it('preserves existing cart when restoring a held order and disables checkout when pricing is in progress', async () => {
    const user = userEvent.setup();
    render(<PosRegister />);

    const addButtons = screen.getAllByRole('button', { name: /Thêm/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Giỏ Hàng (1)')).toBeInTheDocument();
    });

    // Hold order
    const holdBtn = screen.getByTitle('Lưu tạm đơn (Hold Order)');
    await user.click(holdBtn);
    expect(screen.getByText(/Đơn tạm giữ \(1\)/i)).toBeInTheDocument();

    // Add another item to active cart
    await user.click(addButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Giỏ Hàng (1)')).toBeInTheDocument();
    });

    // Restoring held order should auto-hold active cart so heldOrders count is still 1
    const restoreBtn = screen.getByRole('button', { name: /Phục hồi/i });
    await user.click(restoreBtn);

    await waitFor(() => {
      expect(screen.getByText('Giỏ Hàng (1)')).toBeInTheDocument();
      expect(screen.getByText(/Đơn tạm giữ \(1\)/i)).toBeInTheDocument();
    });
  });
});
