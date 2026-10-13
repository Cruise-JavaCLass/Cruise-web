import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ExcursionDetailPage } from './ExcursionDetailPage';
import * as excursionService from '../services/excursionService';

describe('ExcursionDetailPage Component Tests (KAN-172)', () => {
  beforeEach(() => {
    excursionService.resetExcursionServiceState();
    vi.restoreAllMocks();
  });

  it('renders excursion detail information successfully', async () => {
    render(
      <MemoryRouter initialEntries={['/excursions/1']}>
        <Routes>
          <Route path="/excursions/:id" element={<ExcursionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Khám phá Hang Sửng Sốt & Đảo Ti Tốp' })
      ).toBeInTheDocument();
      expect(screen.getByText('EXC-HL-01')).toBeInTheDocument();
      expect(screen.getByText(/Halong Heritage Travel Co./i)).toBeInTheDocument();
      expect(screen.getByText(/Hoàng Hải Đăng/i)).toBeInTheDocument();
      expect(screen.getByText(/Tender-01/i)).toBeInTheDocument();
      expect(screen.getByText(/Khoảng đệm an toàn hải hành:/i)).toBeInTheDocument();
    });
  });

  it('renders not found empty state when excursion ID does not exist', async () => {
    render(
      <MemoryRouter initialEntries={['/excursions/99999']}>
        <Routes>
          <Route path="/excursions/:id" element={<ExcursionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy thông tin tour trên bờ')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Quay lại danh sách/i })).toHaveAttribute(
        'href',
        '/excursions'
      );
    });
  });

  it('opens ExcursionStatusModal when clicking "Đổi Trạng Thái"', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/excursions/2']}>
        <Routes>
          <Route path="/excursions/:id" element={<ExcursionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('EXC-DAD-02')).toBeInTheDocument();
    });

    const statusBtn = screen.getByRole('button', { name: /Đổi Trạng Thái/i });
    await user.click(statusBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Chuyển Đổi Trạng Thái Tour Trên Bờ/i })
      ).toBeInTheDocument();
    });
  });

  it('opens ExcursionModal in edit mode when clicking "Chỉnh Sửa"', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/excursions/1']}>
        <Routes>
          <Route path="/excursions/:id" element={<ExcursionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('EXC-HL-01')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /Chỉnh Sửa/i });
    await user.click(editBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Chỉnh Sửa Tour Trên Bờ/i })
      ).toBeInTheDocument();
    });
  });

  it('filters passengers in the manifest and allows toggling status', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/excursions/1']}>
        <Routes>
          <Route path="/excursions/:id" element={<ExcursionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Thu Mai')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Lọc tên, cabin.../i);
    await user.type(searchInput, 'Thu Mai');

    await waitFor(() => {
      expect(screen.getByText('Trần Thị Thu Mai')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
    });

    // Toggle passenger status
    const updateButtons = screen.getAllByRole('button', { name: /Cập nhật/i });
    await user.click(updateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Về Tàu An Toàn')).toBeInTheDocument();
    });
  });

  it('deletes excursion when user confirms and triggers navigation', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteSpy = vi.spyOn(excursionService, 'deleteExcursion');

    render(
      <MemoryRouter initialEntries={['/excursions/1']}>
        <Routes>
          <Route path="/excursions/:id" element={<ExcursionDetailPage />} />
          <Route path="/excursions" element={<div>Danh sách tour đã điều hướng</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('EXC-HL-01')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Xóa tour');
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(1);
      expect(screen.getByText('Danh sách tour đã điều hướng')).toBeInTheDocument();
    });
  });
});
