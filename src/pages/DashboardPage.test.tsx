import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';

describe('DashboardPage Component', () => {
  it('renders cruise management hero banner and title', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền')).toBeInTheDocument();
    expect(screen.getByText(/Frontend Client v1.0.0/i)).toBeInTheDocument();
  });

  it('renders key metrics for cruise operations', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Hành khách trên tàu')).toBeInTheDocument();
    expect(screen.getByText('Hoạt động hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Doanh thu POS hôm nay')).toBeInTheDocument();
    expect(screen.getByText('An toàn & Tập trung')).toBeInTheDocument();
  });

  it('renders itinerary preview stops', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Cảng Quốc Tế Tuần Châu (Hạ Long)')).toBeInTheDocument();
    expect(screen.getByText('Cảng Tiên Sa (Đà Nẵng & Hội An)')).toBeInTheDocument();
  });
});
