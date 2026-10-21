import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { PassengerFolioPage } from './PassengerFolioPage';
import { passengerFolioService } from '../../services/passengerFolioService';

vi.mock('../../services/passengerFolioService');

describe('PassengerFolioPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders folio summary, threshold warning banners, and breakdown', async () => {
    vi.mocked(passengerFolioService.getFolioSummary).mockResolvedValue({
      passengerId: 101,
      cabinNumber: 'CABIN-7012',
      passengerName: 'Nguyễn Văn An',
      currentBalance: 850.0,
      creditLimit: 1000.0,
      availableLimit: 150.0,
      spendingPercentage: 85.0,
      warningThresholdReached: true,
      limitExceeded: false,
      status: 'ACTIVE',
      spendingByCategory: {
        FOOD_AND_BEVERAGE: 450.0,
        SHORE_EXCURSIONS: 200.0,
        SPA_AND_WELLNESS: 200.0,
        RETAIL_SHOPPING: 0.0,
        SERVICE_FEES: 0.0,
      },
    });

    vi.mocked(passengerFolioService.getTransactions).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
      size: 10,
      number: 0,
    });

    render(<PassengerFolioPage />);

    await waitFor(() => {
      expect(screen.getByText('Chi Phí Phòng & Sao Kê Trực Tuyến')).toBeDefined();
      expect(screen.getByText('Cabin CABIN-7012')).toBeDefined();
      expect(screen.getByText('Nguyễn Văn An')).toBeDefined();
      expect(screen.getByText('Cảnh báo: Đã dùng hơn 80% hạn mức tín dụng cabin')).toBeDefined();
      expect(screen.getByText('85.0%')).toBeDefined();
      expect(screen.getByText('$850.00')).toBeDefined();
    });
  });

  it('renders critical alert when limit is exceeded (100%)', async () => {
    vi.mocked(passengerFolioService.getFolioSummary).mockResolvedValue({
      passengerId: 101,
      cabinNumber: 'CABIN-7012',
      passengerName: 'Nguyễn Văn An',
      currentBalance: 1100.0,
      creditLimit: 1000.0,
      availableLimit: -100.0,
      spendingPercentage: 110.0,
      warningThresholdReached: true,
      limitExceeded: true,
      status: 'ACTIVE',
      spendingByCategory: {
        FOOD_AND_BEVERAGE: 1100.0,
      },
    });

    vi.mocked(passengerFolioService.getTransactions).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
      size: 10,
      number: 0,
    });

    render(<PassengerFolioPage />);

    await waitFor(() => {
      expect(screen.getByText('Cảnh báo: Đã đạt 100% hạn mức tín dụng cabin!')).toBeDefined();
    });
  });
});
