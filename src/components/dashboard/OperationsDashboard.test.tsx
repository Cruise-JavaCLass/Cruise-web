import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OperationsDashboard } from './OperationsDashboard';
import { operationsDashboardService } from '../../services/operationsDashboardService';

vi.mock('../../services/operationsDashboardService', () => ({
  operationsDashboardService: {
    getOperationsKpis: vi.fn(),
    getLiveOperationsRadar: vi.fn(),
  },
}));

describe('OperationsDashboard UI Tests (KAN-271 & KAN-458)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders KPI metrics and live radar cards accurately', async () => {
    (operationsDashboardService.getOperationsKpis as any).mockResolvedValue({
      totalPassengers: 3000,
      checkedInPassengers: 2700,
      embarkationRate: 90.0,
      totalActivitiesActive: 18,
      totalActivityRegistrations: 750,
      departingExcursionsToday: 5,
      totalExcursionBookings: 500,
      averageActivityRating: 4.9,
      totalFeedbackSubmitted: 420,
    });

    (operationsDashboardService.getLiveOperationsRadar as any).mockResolvedValue({
      timestamp: '2026-10-22T08:00:00Z',
      activityRadar: [
        {
          activityId: 1,
          title: 'Yoga Bình Minh',
          location: 'Boong 12',
          scheduledTime: '06:30',
          capacity: 30,
          registeredCount: 25,
          checkedInCount: 20,
          occupancyRate: 66.7,
        },
      ],
      excursionRadar: [
        {
          excursionId: 10,
          title: 'Khám Phá Hang Sửng Sốt',
          portName: 'Vịnh Hạ Long',
          departureTime: '08:45',
          status: 'BOARDING',
          maxParticipants: 50,
          bookedCount: 45,
          presentCount: 40,
          isDepartingSoon: true,
        },
      ],
    });

    render(<OperationsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Bảng Chỉ Số Vận Hành Hàng Hải (Fleet Operations)')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('Yoga Bình Minh')).toBeInTheDocument();
      expect(screen.getByText('Khám Phá Hang Sửng Sốt')).toBeInTheDocument();
    });
  });

  it('triggers refresh when clicking "Làm Mới Số Liệu"', async () => {
    (operationsDashboardService.getOperationsKpis as any).mockResolvedValue({
      totalPassengers: 1000,
      checkedInPassengers: 900,
      embarkationRate: 90.0,
    });
    (operationsDashboardService.getLiveOperationsRadar as any).mockResolvedValue({
      activityRadar: [],
      excursionRadar: [],
    });

    render(<OperationsDashboard />);

    // Wait for initial load to finish and button to become enabled
    await waitFor(() => {
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Làm Mới Số Liệu/i });
    expect(refreshBtn).not.toBeDisabled();
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(operationsDashboardService.getOperationsKpis).toHaveBeenCalledTimes(2);
    });
  });
});
