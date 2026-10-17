import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcursionManifestModal } from './ExcursionManifestModal';
import {
  INITIAL_EXCURSIONS,
  INITIAL_EXCURSION_PASSENGERS,
  DEFAULT_EXCURSION_GROUPS,
} from '../../services/excursionService';

describe('ExcursionGroupAssignment Tests (KAN-181)', () => {
  const handleClose = vi.fn();
  const handleUpdatePassengers = vi.fn();

  const testExcursion = {
    ...INITIAL_EXCURSIONS[0],
    maxCapacity: 10,
    passengers: [...INITIAL_EXCURSION_PASSENGERS],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupModal = (props?: Partial<React.ComponentProps<typeof ExcursionManifestModal>>) =>
    render(
      <ExcursionManifestModal
        isOpen={true}
        onClose={handleClose}
        excursion={testExcursion}
        onUpdatePassengers={handleUpdatePassengers}
        {...props}
      />
    );

  it('renders group capacity breakdown chips and distribution info', () => {
    setupModal();

    expect(screen.getByText(/Phân Bổ Sức Chứa Theo Nhóm & Xe:/i)).toBeInTheDocument();
    expect(screen.getByText(/Đoàn A - Khám phá:/i)).toBeInTheDocument();
    expect(screen.getByText(/Đoàn B - Ẩm thực:/i)).toBeInTheDocument();
    expect(screen.getByText(/Đoàn C - Thưởng ngoạn:/i)).toBeInTheDocument();
    expect(screen.getByText(/Đoàn VIP - Cao cấp:/i)).toBeInTheDocument();
  });

  it('allows inline individual group re-assignment via row dropdown', async () => {
    const user = userEvent.setup();
    setupModal();

    const groupDropdown = screen.getByLabelText(/Đổi đoàn cho Nguyễn Văn An/i);
    expect(groupDropdown).toBeInTheDocument();

    // Change Nguyen Van An to GRP-VIP
    await user.selectOptions(groupDropdown, 'GRP-VIP');

    await waitFor(() => {
      expect(handleUpdatePassengers).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            passengerName: 'Nguyễn Văn An',
            groupName: 'Đoàn VIP - Cao cấp',
            busNumber: 'BUS-VIP-01 (16 Chỗ)',
          }),
        ])
      );
    });

    expect(
      screen.getByText(/Đã chuyển hành khách sang Đoàn VIP - Cao cấp/i)
    ).toBeInTheDocument();
  });

  it('supports selecting multiple passengers and bulk-assigning them to a group', async () => {
    const user = userEvent.setup();
    setupModal();

    // Select first two passengers
    const checkboxAn = screen.getByLabelText(/Chọn Nguyễn Văn An/i);
    const checkboxMai = screen.getByLabelText(/Chọn Trần Thị Thu Mai/i);

    await user.click(checkboxAn);
    await user.click(checkboxMai);

    // Verify bulk toolbar appears
    expect(screen.getByText(/Đã chọn 2 hành khách/i)).toBeInTheDocument();

    // Choose target group in bulk dropdown
    const bulkSelect = screen.getByLabelText(/Chọn đoàn gán hàng loạt/i);
    await user.selectOptions(bulkSelect, 'GRP-C');

    // Click Bulk Assign button
    const bulkAssignBtn = screen.getByRole('button', { name: /Gán nhóm hàng loạt/i });
    await user.click(bulkAssignBtn);

    await waitFor(() => {
      expect(handleUpdatePassengers).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            passengerName: 'Nguyễn Văn An',
            groupName: 'Đoàn C - Thưởng ngoạn',
            busNumber: 'XE-03 (45 Chỗ)',
          }),
          expect.objectContaining({
            passengerName: 'Trần Thị Thu Mai',
            groupName: 'Đoàn C - Thưởng ngoạn',
            busNumber: 'XE-03 (45 Chỗ)',
          }),
        ])
      );
    });

    expect(
      screen.getByText(/Đã gán thành công 2 hành khách vào Đoàn C - Thưởng ngoạn!/i)
    ).toBeInTheDocument();

    // Verify selection is cleared
    expect(screen.queryByText(/Đã chọn 2 hành khách/i)).not.toBeInTheDocument();
  });

  it('auto-distributes passengers evenly across available groups when clicking "Chia nhóm tự động"', async () => {
    const user = userEvent.setup();
    setupModal();

    const autoAssignBtn = screen.getByRole('button', { name: /Chia nhóm tự động/i });
    await user.click(autoAssignBtn);

    await waitFor(() => {
      expect(handleUpdatePassengers).toHaveBeenCalledTimes(1);
      const updatedList = handleUpdatePassengers.mock.calls[0][0];
      expect(updatedList.length).toBe(testExcursion.passengers.length);

      // Verify round-robin assignment
      expect(updatedList[0].groupName).toBe(DEFAULT_EXCURSION_GROUPS[0].groupName);
      expect(updatedList[1].groupName).toBe(DEFAULT_EXCURSION_GROUPS[1].groupName);
      expect(updatedList[2].groupName).toBe(DEFAULT_EXCURSION_GROUPS[2].groupName);
      expect(updatedList[3].groupName).toBe(DEFAULT_EXCURSION_GROUPS[3].groupName);
    });

    expect(
      screen.getByText(/Đã tự động chia đều 4 hành khách vào 5 nhóm & xe!/i)
    ).toBeInTheDocument();
  });

  it('opens add passenger panel, fills form and adds passenger successfully', async () => {
    const user = userEvent.setup();
    setupModal();

    const addBtn = screen.getByRole('button', { name: /\+ Thêm hành khách/i });
    await user.click(addBtn);

    expect(screen.getByText(/Thêm Hành Khách Vào Tour/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Họ và tên hành khách/i);
    const cabinInput = screen.getByLabelText(/Số phòng \/ Cabin/i);
    const phoneInput = screen.getByLabelText(/SĐT khẩn cấp/i);
    const submitBtn = screen.getByRole('button', { name: /Xác nhận thêm khách/i });

    await user.type(nameInput, 'Đặng Hoàng Nam');
    await user.type(cabinInput, 'Suite-902');
    await user.type(phoneInput, '+84 933 445 566');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Đặng Hoàng Nam')).toBeInTheDocument();
      expect(screen.getByText('Suite-902')).toBeInTheDocument();
      expect(handleUpdatePassengers).toHaveBeenCalled();
    });

    expect(
      screen.getByText(/Đã thêm hành khách Đặng Hoàng Nam vào/i)
    ).toBeInTheDocument();
  });

  it('populates fields when selecting an onboard ship passenger', async () => {
    const user = userEvent.setup();
    setupModal();

    const addBtn = screen.getByRole('button', { name: /\+ Thêm hành khách/i });
    await user.click(addBtn);

    const selectShip = screen.getByLabelText(/Chọn nhanh từ danh sách khách trên tàu/i);
    // Select passenger with ID '1' (Nguyễn Văn Minh)
    await user.selectOptions(selectShip, '1');

    const nameInput = screen.getByLabelText(/Họ và tên hành khách/i) as HTMLInputElement;
    const cabinInput = screen.getByLabelText(/Số phòng \/ Cabin/i) as HTMLInputElement;

    expect(nameInput.value).toBe('Nguyễn Văn Minh');
    expect(cabinInput.value).toContain('402');
  });

  it('prevents adding passenger when tour capacity is already at max limit', () => {
    const fullExcursion = {
      ...testExcursion,
      maxCapacity: 4,
      passengers: [...INITIAL_EXCURSION_PASSENGERS], // length is 4
    };

    setupModal({ excursion: fullExcursion });

    const addBtn = screen.getByRole('button', { name: /\+ Thêm hành khách/i });
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveAttribute('title', 'Tour đã đạt sức chứa tối đa');
  });

  it('removes a passenger when clicking the delete button', async () => {
    const user = userEvent.setup();
    setupModal();

    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();

    const removeBtn = screen.getByTitle(/Xóa Nguyễn Văn An khỏi tour/i);
    await user.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
      expect(handleUpdatePassengers).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({ passengerName: 'Nguyễn Văn An' }),
        ])
      );
    });

    expect(
      screen.getByText(/Đã xóa hành khách Nguyễn Văn An khỏi danh sách tour/i)
    ).toBeInTheDocument();
  });

  describe('Component Tests for Group Assignment and Filtering (KAN-183)', () => {
    it('filters passenger list to only display members of the selected group when clicking group tab', async () => {
      const user = userEvent.setup();
      setupModal();

      // Initially all passengers are visible
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Thu Mai')).toBeInTheDocument();
      expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
      expect(screen.getByText('Phạm Hồng Hạnh')).toBeInTheDocument();

      // Click group tab for Đoàn A - Khám phá
      const groupAButton = screen.getByRole('tab', { name: /Đoàn A - Khám phá:/i });
      await user.click(groupAButton);

      // Only Group A passengers should remain visible
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Thu Mai')).toBeInTheDocument();
      expect(screen.queryByText('Lê Hoàng Long')).not.toBeInTheDocument();
      expect(screen.queryByText('Phạm Hồng Hạnh')).not.toBeInTheDocument();

      // Reset filter by clicking "Tất cả các đoàn" tab
      const allTab = screen.getByRole('tab', { name: /Tất cả các đoàn/i });
      await user.click(allTab);

      expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
      expect(screen.getByText('Phạm Hồng Hạnh')).toBeInTheDocument();
    });

    it('filters passengers using the vehicle dropdown selector', async () => {
      const user = userEvent.setup();
      setupModal();

      const busSelect = screen.getByLabelText(/Lọc theo xe:/i);
      await user.selectOptions(busSelect, 'XE-02 (29 Chỗ)');

      // XE-02 passengers: Lê Hoàng Long, Phạm Hồng Hạnh
      expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
      expect(screen.getByText('Phạm Hồng Hạnh')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
      expect(screen.queryByText('Trần Thị Thu Mai')).not.toBeInTheDocument();
    });

    it('displays empty state message when a group has no assigned passengers', async () => {
      const user = userEvent.setup();
      setupModal();

      // Click group with 0 passengers: Đoàn VIP
      const vipTab = screen.getByRole('tab', { name: /Đoàn VIP - Cao cấp:/i });
      await user.click(vipTab);

      expect(screen.getByText(/Không tìm thấy hành khách nào phù hợp/i)).toBeInTheDocument();
    });
  });

  describe('Test Group Capacity and Assignment Errors (KAN-184)', () => {
    it('rejects inline group assignment and displays error notification when target group is at max capacity', async () => {
      const user = userEvent.setup();
      // Configure group VIP with maxSeats = 1 and already having 1 passenger
      const tinyGroupExcursion = {
        ...testExcursion,
        passengers: [
          {
            ...INITIAL_EXCURSION_PASSENGERS[0], // Nguyễn Văn An
            groupName: 'Đoàn VIP - Cao cấp',
            busNumber: 'BUS-VIP-01 (16 Chỗ)',
          },
          {
            ...INITIAL_EXCURSION_PASSENGERS[1], // Trần Thị Thu Mai in Group A
          },
        ],
      };

      // Mock DEFAULT_EXCURSION_GROUPS VIP capacity to 1 seat
      const originalVipSeats = DEFAULT_EXCURSION_GROUPS[3].maxSeats;
      DEFAULT_EXCURSION_GROUPS[3].maxSeats = 1;

      try {
        setupModal({ excursion: tinyGroupExcursion });

        // Try to assign Tran Thi Thu Mai to GRP-VIP which already has 1/1 seat filled
        const groupDropdownMai = screen.getByLabelText(/Đổi đoàn cho Trần Thị Thu Mai/i);
        await user.selectOptions(groupDropdownMai, 'GRP-VIP');

        await waitFor(() => {
          expect(
            screen.getByText(/Không thể chuyển: Đoàn VIP - Cao cấp đã đầy \(1\/1 chỗ\)/i)
          ).toBeInTheDocument();
        });

        // Ensure update handler was not called
        expect(handleUpdatePassengers).not.toHaveBeenCalled();
      } finally {
        DEFAULT_EXCURSION_GROUPS[3].maxSeats = originalVipSeats;
      }
    });

    it('rejects bulk assignment when selected passengers exceed available seats in target group', async () => {
      const user = userEvent.setup();
      const originalVipSeats = DEFAULT_EXCURSION_GROUPS[3].maxSeats;
      DEFAULT_EXCURSION_GROUPS[3].maxSeats = 1;

      try {
        setupModal();

        // Select 2 passengers
        const checkboxAn = screen.getByLabelText(/Chọn Nguyễn Văn An/i);
        const checkboxMai = screen.getByLabelText(/Chọn Trần Thị Thu Mai/i);
        await user.click(checkboxAn);
        await user.click(checkboxMai);

        // Select GRP-VIP which has max 1 seat
        const bulkSelect = screen.getByLabelText(/Chọn đoàn gán hàng loạt/i);
        await user.selectOptions(bulkSelect, 'GRP-VIP');

        const bulkAssignBtn = screen.getByRole('button', { name: /Gán nhóm hàng loạt/i });
        await user.click(bulkAssignBtn);

        await waitFor(() => {
          expect(
            screen.getByText(/Không thể gán hàng loạt: Đoàn VIP - Cao cấp chỉ còn 1 chỗ trống, nhưng bạn đã chọn 2 khách!/i)
          ).toBeInTheDocument();
        });

        expect(handleUpdatePassengers).not.toHaveBeenCalled();
      } finally {
        DEFAULT_EXCURSION_GROUPS[3].maxSeats = originalVipSeats;
      }
    });
  });
});
