import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ExcursionsPage } from './ExcursionsPage';
import * as excursionService from '../services/excursionService';

describe('ExcursionsPage Component Tests (KAN-172)', () => {
  beforeEach(() => {
    excursionService.resetExcursionServiceState();
    vi.restoreAllMocks();
  });

  it('renders page header, KPI metrics, and list of initial excursions', async () => {
    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Quản Lý Tour Trên Bờ/i })
      ).toBeInTheDocument();
      expect(screen.getByText('Tổng Chuyến Tour')).toBeInTheDocument();
      expect(screen.getByText('Đang Khởi Hành')).toBeInTheDocument();
      expect(screen.getByText('Cảnh Báo Trễ Giờ')).toBeInTheDocument();
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });
  });

  it('switches between Grid view and Table view', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });

    const tableViewBtn = screen.getByTitle('Xem dạng bảng');
    await user.click(tableViewBtn);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Tour Trên Bờ')).toBeInTheDocument();
      expect(screen.getByText('Điểm Dừng / Cảng')).toBeInTheDocument();
    });

    const gridViewBtn = screen.getByTitle('Xem dạng thẻ');
    await user.click(gridViewBtn);

    await waitFor(() => {
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  it('filters excursions when typing into the search input', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
      expect(screen.getByText('Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Nhập tên excursion, địa danh/i);
    await user.type(searchInput, 'Hội An');

    await waitFor(() => {
      expect(screen.getByText('Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu')).toBeInTheDocument();
      expect(screen.queryByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).not.toBeInTheDocument();
    });
  });

  it('filters excursions by Port of Call selection', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });

    const portSelect = screen.getByLabelText(/Cảng Dừng \(Port of Call\)/i);
    // Port 1 is Cảng Tuần Châu
    await user.selectOptions(portSelect, '1');

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
      expect(screen.queryByText('Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu')).not.toBeInTheDocument();
    });
  });

  it('filters excursions by status dropdown', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/Trạng Thái/i);
    await user.selectOptions(statusSelect, 'DELAYED');

    await waitFor(() => {
      expect(screen.getByText('Khám Phá Quần Đảo An Thới & Sunset Sanato')).toBeInTheDocument();
      expect(screen.queryByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).not.toBeInTheDocument();
    });
  });

  it('displays empty state when no excursion matches search query', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Nhập tên excursion, địa danh/i);
    await user.type(searchInput, 'KhongCoTourNaoNhuTheNay123');

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy tour trên bờ nào')).toBeInTheDocument();
    });
  });

  it('opens and closes ExcursionModal when clicking "Tạo Excursion Mới"', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    const createBtn = screen.getByRole('button', { name: /Tạo Excursion Mới/i });
    await user.click(createBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Tạo Tour Trên Bờ Mới/i })).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /Hủy Bỏ/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Tạo Tour Trên Bờ Mới/i })).not.toBeInTheDocument();
    });
  });

  it('opens ExcursionManifestModal when clicking "Đoàn & Xe"', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });

    const manifestButtons = screen.getAllByRole('button', { name: /Đoàn & Xe/i });
    await user.click(manifestButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Danh Sách Đoàn & Xe Đưa Đón/i })
      ).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByRole('button', { name: /Đóng/i });
    await user.click(closeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Danh Sách Đoàn & Xe Đưa Đón/i })).not.toBeInTheDocument();
    });
  });

  it('deletes excursion when user confirms confirmation prompt', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteSpy = vi.spyOn(excursionService, 'deleteExcursion');

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Xóa tour');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalled();
    });
  });

  it('filters excursions by Category pills and resets to all', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu')).toBeInTheDocument();
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });

    const culturalPill = screen.getByRole('button', { name: 'Văn hóa & Di sản' });
    await user.click(culturalPill);

    await waitFor(() => {
      expect(screen.getByText('Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu')).toBeInTheDocument();
      expect(screen.queryByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).not.toBeInTheDocument();
    });

    // Reset via Tất cả pill
    const allPill = screen.getByRole('button', { name: 'Tất cả' });
    await user.click(allPill);

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });
  });

  it('filters excursions by multi-day cruise Tour selection', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });

    const tourSelect = screen.getByLabelText(/Tour Du Thuyền/i);
    // Select Tour 3: Phu Quoc tour
    await user.selectOptions(tourSelect, '3');

    await waitFor(() => {
      expect(screen.getByText('Khám Phá Quần Đảo An Thới & Sunset Sanato')).toBeInTheDocument();
      expect(screen.queryByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).not.toBeInTheDocument();
    });
  });

  it('re-fetches excursions when user clicks the Refresh button', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(excursionService, 'fetchExcursions');

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByTitle('Làm mới');
    await user.click(refreshBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  it('opens ExcursionModal in Edit mode when clicking edit button on a tour card', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ExcursionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Chỉnh sửa tour');
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Chỉnh Sửa Tour Trên Bờ/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Tên Tour Trên Bờ/i)).toHaveValue(
        'Khám phá Hang Sửng Sốt & Đảo Ti Tốp'
      );
    });
  });
});
