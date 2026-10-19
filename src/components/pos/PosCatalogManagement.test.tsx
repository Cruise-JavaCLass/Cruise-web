import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosCatalogManagement } from './PosCatalogManagement';
import { posCatalogService, type ProductDto, type OutletDto, type CategoryDto } from '../../services/posCatalogService';

vi.mock('../../services/posCatalogService', () => ({
  posCatalogService: {
    getOutlets: vi.fn(),
    getCategories: vi.fn(),
    getProducts: vi.fn(),
    updateProductStatus: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    getHappyHourRules: vi.fn(),
    getOfflinePackage: vi.fn(),
    saveOfflineCatalog: vi.fn(),
    bulkImportCatalog: vi.fn(),
    getProductById: vi.fn(),
  },
}));

describe('PosCatalogManagement Component Tests (KAN-396)', () => {
  const mockOutlets: OutletDto[] = [
    { id: 1, code: 'SKY-BAR', name: 'Sky Bar & Lounge', outletType: 'BAR', isActive: true },
    { id: 2, code: 'LIDO-BUFFET', name: 'Lido Buffet & Grill', outletType: 'RESTAURANT', isActive: true },
  ];

  const mockCategories: CategoryDto[] = [
    { id: 10, outletId: 1, code: 'COCKTAIL', name: 'Cocktails', displayOrder: 1, isActive: true },
    { id: 20, outletId: 1, code: 'BEER', name: 'Bia Thủ Công', displayOrder: 2, isActive: true },
  ];

  const mockProducts: ProductDto[] = [
    {
      id: 101,
      outletId: 1,
      categoryId: 10,
      categoryName: 'Cocktails',
      sku: 'COCK-001',
      barcode: '893850123401',
      name: 'Mojito Cruise Special',
      basePrice: 14.5,
      taxCategory: 'STANDARD_VAT',
      status: 'ACTIVE',
      isAvailable: true,
      is86ed: false,
      stockQuantity: 100,
      happyHourEligible: true,
      happyHourDiscountPercent: 20,
    },
    {
      id: 102,
      outletId: 1,
      categoryId: 10,
      categoryName: 'Cocktails',
      sku: 'COCK-002',
      barcode: '893850123402',
      name: 'Blue Ocean Curacao',
      basePrice: 16.0,
      taxCategory: 'STANDARD_VAT',
      status: 'EIGHTY_SIXED',
      isAvailable: false,
      is86ed: true,
      stockQuantity: 0,
      happyHourEligible: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(posCatalogService.getOutlets).mockResolvedValue(mockOutlets);
    vi.mocked(posCatalogService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(posCatalogService.getProducts).mockResolvedValue({
      content: mockProducts,
      totalElements: mockProducts.length,
      totalPages: 1,
      pageNumber: 0,
      pageSize: 20,
    });
    vi.mocked(posCatalogService.getHappyHourRules).mockResolvedValue([]);
  });

  it('renders dashboard with catalog metrics, outlet switcher and product list', async () => {
    render(<PosCatalogManagement />);

    await waitFor(() => {
      expect(screen.getByText('Sky Bar & Lounge')).toBeInTheDocument();
      expect(screen.getByText('Mojito Cruise Special')).toBeInTheDocument();
      expect(screen.getByText('Blue Ocean Curacao')).toBeInTheDocument();
      expect(screen.getByText('COCK-001')).toBeInTheDocument();
    });

    // Check 86 status toggle switches
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(2);
    expect(switches[0]).toHaveAttribute('aria-checked', 'false');
    expect(switches[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('filters product table by keyword search', async () => {
    render(<PosCatalogManagement />);

    await waitFor(() => {
      expect(screen.getByText('Mojito Cruise Special')).toBeInTheDocument();
    });

    vi.mocked(posCatalogService.getProducts).mockResolvedValueOnce({
      content: [mockProducts[0]],
      totalElements: 1,
      totalPages: 1,
      pageNumber: 0,
      pageSize: 20,
    });

    const searchInput = screen.getByPlaceholderText('Tìm món theo tên, SKU, mã vạch...');
    fireEvent.change(searchInput, { target: { value: 'Mojito' } });

    await waitFor(() => {
      expect(screen.getByText('Mojito Cruise Special')).toBeInTheDocument();
      expect(screen.queryByText('Blue Ocean Curacao')).not.toBeInTheDocument();
    });
  });

  it('toggles product 86 status on switch click', async () => {
    vi.mocked(posCatalogService.updateProductStatus).mockResolvedValueOnce({
      ...mockProducts[0],
      is86ed: true,
      status: 'EIGHTY_SIXED',
      modifiers: [],
    });

    render(<PosCatalogManagement />);

    await waitFor(() => {
      expect(screen.getByText('Mojito Cruise Special')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    await waitFor(() => {
      expect(posCatalogService.updateProductStatus).toHaveBeenCalledWith(101, {
        is86ed: true,
        reason: 'Nhân viên đánh dấu hết hàng tại quầy',
        staffId: 'FNB_MANAGER',
      });
    });
  });

  it('opens and closes product creation modal', async () => {
    const user = userEvent.setup();
    render(<PosCatalogManagement />);

    await waitFor(() => {
      expect(screen.getByText('Mojito Cruise Special')).toBeInTheDocument();
    });

    const addProductBtn = screen.getByRole('button', { name: /Thêm Món Mới/i });
    await user.click(addProductBtn);

    expect(screen.getByText('Thêm Sản Phẩm Mới')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('VD: Pacific Sunset Mojito')).toBeInTheDocument();

    // Close modal
    const cancelBtn = screen.getByRole('button', { name: /Hủy/i });
    await user.click(cancelBtn);

    expect(screen.queryByText('Thêm Sản Phẩm Mới')).not.toBeInTheDocument();
  });

  it('opens Happy Hour and Bulk Import modals', async () => {
    const user = userEvent.setup();
    render(<PosCatalogManagement />);

    await waitFor(() => {
      expect(screen.getByText('Mojito Cruise Special')).toBeInTheDocument();
    });

    const happyHourBtn = screen.getByRole('button', { name: /Giờ Vàng \(Happy Hour\)/i });
    await user.click(happyHourBtn);
    expect(screen.getByText('Cấu Hình Khung Giờ Happy Hour')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Đóng cửa sổ' });
    await user.click(closeBtn);

    const importBtn = screen.getByRole('button', { name: /Nhập File Hàng Loạt/i });
    await user.click(importBtn);
    expect(screen.getByText(/Nhập Danh Mục Hàng Loạt/i)).toBeInTheDocument();
  });
});
