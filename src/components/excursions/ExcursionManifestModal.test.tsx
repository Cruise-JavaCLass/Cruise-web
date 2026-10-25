import { describe, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcursionManifestModal } from './ExcursionManifestModal';
import { INITIAL_EXCURSIONS, INITIAL_EXCURSION_PASSENGERS } from '../../services/excursionService';

describe('ExcursionManifestModal Component Suite (KAN-174)', () => {
  const handleClose = vi.fn();
  const testManifestData = {
    ...INITIAL_EXCURSIONS[0],
    passengers: [...INITIAL_EXCURSION_PASSENGERS],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupModal = (customProps?: Partial<React.ComponentProps<typeof ExcursionManifestModal>>) =>
    render(
      <ExcursionManifestModal
        isOpen={true}
        onClose={handleClose}
        excursion={testManifestData}
        {...customProps}
      />
    );

  it('renders passenger manifest dialog with summary metrics and passenger rows', () => {
    setupModal();

    expect(screen.getByRole('heading', { name: /Danh Sách Đoàn & Xe Đưa Đón/i })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(testManifestData.title, 'i'))).toBeInTheDocument();

    const expectedLabels = [
      /Tổng số khách đăng ký/i,
      /Hướng dẫn viên/i,
      /Phương tiện chính/i,
      /Đã về tàu an toàn/i,
    ];
    expectedLabels.forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());

    ['Nguyễn Văn An', 'Trần Thị Thu Mai', 'Lê Hoàng Long', 'Phạm Hồng Hạnh'].forEach((passenger) =>
      expect(screen.getByText(passenger)).toBeInTheDocument()
    );
  });

  it.each([
    { query: 'Thu Mai', shouldFind: 'Trần Thị Thu Mai', shouldNotFind: 'Nguyễn Văn An' },
    { query: 'Suite-801', shouldFind: 'Nguyễn Văn An', shouldNotFind: 'Trần Thị Thu Mai' },
    { query: 'EXC-TKT-103', shouldFind: 'Lê Hoàng Long', shouldNotFind: 'Nguyễn Văn An' },
  ])('filters manifest passengers when typing "$query"', async ({ query, shouldFind, shouldNotFind }) => {
    const user = userEvent.setup();
    setupModal();

    const searchBox = screen.getByPlaceholderText(/Tìm theo tên, cabin, mã vé.../i);
    await user.type(searchBox, query);

    await waitFor(() => {
      expect(screen.getByText(shouldFind)).toBeInTheDocument();
      expect(screen.queryByText(shouldNotFind)).not.toBeInTheDocument();
    });
  });

  it('shows empty notification when search term has no match', async () => {
    const user = userEvent.setup();
    setupModal();

    await user.type(
      screen.getByPlaceholderText(/Tìm theo tên, cabin, mã vé.../i),
      'UnknownPassenger999'
    );

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy hành khách nào phù hợp.')).toBeInTheDocument();
    });
  });

  it('filters passengers according to assigned transport vehicle', async () => {
    const user = userEvent.setup();
    setupModal();

    const dropdown = screen.getByLabelText(/Lọc theo xe:/i);
    await user.selectOptions(dropdown, 'XE-02 (29 Chỗ)');

    await waitFor(() => {
      expect(screen.getByText('Lê Hoàng Long')).toBeInTheDocument();
      expect(screen.getByText('Phạm Hồng Hạnh')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
    });

    await user.selectOptions(dropdown, 'ALL');
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });
  });

  it('transitions passenger status across lifecycle states upon button trigger', async () => {
    const user = userEvent.setup();
    setupModal();

    await user.type(
      screen.getByPlaceholderText(/Tìm theo tên, cabin, mã vé.../i),
      'Lê Hoàng Long'
    );
    expect(screen.getByText('Đã Lên Xe')).toBeInTheDocument();

    const cycleBtn = screen.getByRole('button', { name: /Đổi trạng thái/i });
    const sequence = ['Đang Tham Quan', 'Về Tàu An Toàn', 'Đã Đăng Ký', 'Đã Lên Xe'];

    for (const expectedStatus of sequence) {
      await user.click(cycleBtn);
      expect(screen.getByText(expectedStatus)).toBeInTheDocument();
    }
  });

  it('invokes onClose callback when clicking close control', async () => {
    const user = userEvent.setup();
    setupModal();

    await user.click(screen.getAllByRole('button', { name: /Đóng/i })[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('returns empty container when isOpen flag is set to false', () => {
    const { container } = setupModal({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });
});
