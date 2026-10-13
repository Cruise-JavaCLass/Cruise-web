import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcursionManifestModal } from './ExcursionManifestModal';
import { INITIAL_EXCURSIONS, INITIAL_EXCURSION_PASSENGERS } from '../../services/excursionService';

describe('ExcursionManifestModal Component Tests (KAN-174)', () => {
  const mockOnClose = vi.fn();
  const mockExcursion = {
    ...INITIAL_EXCURSIONS[0],
    passengers: [...INITIAL_EXCURSION_PASSENGERS],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props?: Partial<React.ComponentProps<typeof ExcursionManifestModal>>) =>
    render(
      <ExcursionManifestModal
        isOpen={true}
        onClose={mockOnClose}
        excursion={mockExcursion}
        {...props}
      />
    );

  it('renders modal header, operational KPI cards, and passenger table', () => {
    renderModal();

    expect(
      screen.getByRole('heading', { name: /Danh Sách Đoàn & Xe Đưa Đón/i })
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(mockExcursion.title, 'i'))).toBeInTheDocument();
    expect(screen.getByText(/Tổng số khách đăng ký/i)).toBeInTheDocument();
    expect(screen.getByText(/Hướng dẫn viên/i)).toBeInTheDocument();
    expect(screen.getByText(/Phương tiện chính/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã về tàu an toàn/i)).toBeInTheDocument();

    // Verify initial passenger list items
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Thu Mai')).toBeInTheDocument();
    expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
    expect(screen.getByText('Phạm Hồng Hạnh')).toBeInTheDocument();
  });

  it('filters passengers by search input matching name, cabin, or ticket code', async () => {
    const user = userEvent.setup();
    renderModal();

    const searchInput = screen.getByPlaceholderText(/Tìm theo tên, cabin, mã vé.../i);

    // Filter by name
    await user.type(searchInput, 'Thu Mai');
    await waitFor(() => {
      expect(screen.getByText('Trần Thị Thu Mai')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
    });

    // Clear and filter by cabin number
    await user.clear(searchInput);
    await user.type(searchInput, 'Suite-801');
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.queryByText('Trần Thị Thu Mai')).not.toBeInTheDocument();
    });

    // Clear and filter by ticket code
    await user.clear(searchInput);
    await user.type(searchInput, 'EXC-TKT-103');
    await waitFor(() => {
      expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
    });
  });

  it('displays empty state message when search returns no matching passengers', async () => {
    const user = userEvent.setup();
    renderModal();

    const searchInput = screen.getByPlaceholderText(/Tìm theo tên, cabin, mã vé.../i);
    await user.type(searchInput, 'NonExistentPassengerName999');

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy hành khách nào phù hợp.')).toBeInTheDocument();
    });
  });

  it('filters passenger list by bus selection dropdown', async () => {
    const user = userEvent.setup();
    renderModal();

    const busSelect = screen.getByLabelText(/Lọc theo xe:/i);
    await user.selectOptions(busSelect, 'XE-02 (29 Chỗ)');

    await waitFor(() => {
      expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
      expect(screen.getByText('Phạm Hồng Hạnh')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
      expect(screen.queryByText('Trần Thị Thu Mai')).not.toBeInTheDocument();
    });

    // Reset to all buses
    await user.selectOptions(busSelect, 'ALL');
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
    });
  });

  it('cycles through passenger operational status when clicking "Đổi trạng thái"', async () => {
    const user = userEvent.setup();
    renderModal();

    // Initial state of Lê Hoàng Long (id: 3) is CHECKED_IN
    const searchInput = screen.getByPlaceholderText(/Tìm theo tên, cabin, mã vé.../i);
    await user.type(searchInput, 'Lê Hoàng Long');

    expect(screen.getByText('Đã Lên Xe')).toBeInTheDocument();

    const changeStatusBtn = screen.getByRole('button', { name: /Đổi trạng thái/i });
    // First click: CHECKED_IN -> ON_TOUR
    await user.click(changeStatusBtn);
    expect(screen.getByText('Đang Tham Quan')).toBeInTheDocument();

    // Second click: ON_TOUR -> RETURNED_SAFE
    await user.click(changeStatusBtn);
    expect(screen.getByText('Về Tàu An Toàn')).toBeInTheDocument();

    // Third click: RETURNED_SAFE -> REGISTERED
    await user.click(changeStatusBtn);
    expect(screen.getByText('Đã Đăng Ký')).toBeInTheDocument();

    // Fourth click: REGISTERED -> CHECKED_IN
    await user.click(changeStatusBtn);
    expect(screen.getByText('Đã Lên Xe')).toBeInTheDocument();
  });

  it('calls onClose when clicking close or X button', async () => {
    const user = userEvent.setup();
    renderModal();

    const closeButtons = screen.getAllByRole('button', { name: /Đóng/i });
    await user.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render modal when isOpen is false', () => {
    const { container } = renderModal({ isOpen: false });

    expect(container).toBeEmptyDOMElement();
  });
});
