import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ExcursionsPage } from '../../pages/ExcursionsPage';
import { ExcursionDetailPage } from '../../pages/ExcursionDetailPage';

describe('Excursion Status Dashboard & Schedule Information Component Tests (KAN-192, KAN-193, KAN-194)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('KAN-192 & KAN-194: Build Excursion Status Dashboard & Component Tests', () => {
    it('renders the 4 KPI status summary cards with real-time operational metrics', async () => {
      render(
        <MemoryRouter>
          <ExcursionsPage />
        </MemoryRouter>
      );

      // Verify KPI headings
      expect(screen.getByText('Tổng Chuyến Tour')).toBeInTheDocument();
      expect(screen.getByText('Đang Khởi Hành')).toBeInTheDocument();
      expect(screen.getByText('Cảnh Báo Trễ Giờ')).toBeInTheDocument();
      expect(screen.getByText('Lấp Đầy Chỗ')).toBeInTheDocument();

      // Check default mock metrics rendered from INITIAL_EXCURSIONS (4 tours total, 1 in-progress, 1 delayed)
      await waitFor(() => {
        expect(screen.getByText(/4 Tour/i)).toBeInTheDocument();
        expect(screen.getByText(/1 Đoàn/i)).toBeInTheDocument();
        expect(screen.getByText(/1 Chuyến/i)).toBeInTheDocument();
      });
    });

    it('filters dashboard cards by status dropdown correctly', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <ExcursionsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText(/^Trạng Thái$/i);
      await user.selectOptions(statusSelect, 'DELAYED');

      await waitFor(() => {
        expect(screen.getByText('Khám Phá Quần Đảo An Thới & Sunset Sanato')).toBeInTheDocument();
        expect(screen.queryByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).not.toBeInTheDocument();
      });
    });

    it('displays warning badge and delay reason alert on delayed excursions', async () => {
      render(
        <MemoryRouter>
          <ExcursionsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Cảnh báo trễ giờ:/i)).toBeInTheDocument();
        expect(screen.getByText(/Xe trung chuyển bị kẹt do thời tiết mưa lớn cục bộ/i)).toBeInTheDocument();
      });
    });
  });

  describe('KAN-193 & KAN-194: Display Gathering and Return-to-Ship Information', () => {
    it('displays gathering time, departure time, return to ship time, and all-aboard in ExcursionsPage cards', async () => {
      render(
        <MemoryRouter>
          <ExcursionsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Gathering / Tập trung
        expect(screen.getAllByText('Tập trung').length).toBeGreaterThan(0);
        // Khởi hành
        expect(screen.getAllByText('Khởi hành').length).toBeGreaterThan(0);
        // Về tàu
        expect(screen.getAllByText('Về tàu').length).toBeGreaterThan(0);
        // All-Aboard
        expect(screen.getAllByText(/All-Aboard:/i).length).toBeGreaterThan(0);
      });
    });

    it('displays full operational timeline and maritime safety buffer in ExcursionDetailPage', async () => {
      render(
        <MemoryRouter initialEntries={['/excursions/1']}>
          <Routes>
            <Route path="/excursions/:id" element={<ExcursionDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
      });

      // Heading
      expect(screen.getByText(/Lịch Trình Thời Gian & Giờ Tàu Nhổ Neo/i)).toBeInTheDocument();

      // 4 Operational Steps
      expect(screen.getByText(/1\. Tập Trung/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Khởi Hành/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Về Tàu/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. All-Aboard/i)).toBeInTheDocument();

      // Safety buffer indicator
      expect(screen.getByText(/Khoảng đệm an toàn hải hành:/i)).toBeInTheDocument();
    });

    it('displays prominent alert banner when excursion status is DELAYED in DetailPage', async () => {
      render(
        <MemoryRouter initialEntries={['/excursions/4']}>
          <Routes>
            <Route path="/excursions/:id" element={<ExcursionDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Khám Phá Quần Đảo An Thới & Sunset Sanato')).toBeInTheDocument();
      });

      expect(screen.getByText(/CẢNH BÁO: CHUYẾN TOUR ĐANG BỊ TRỄ GIỜ/i)).toBeInTheDocument();
      expect(screen.getByText(/Xe trung chuyển bị kẹt do thời tiết mưa lớn cục bộ/i)).toBeInTheDocument();
    });
  });
});
