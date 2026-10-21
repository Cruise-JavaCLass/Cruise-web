import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ExcursionAnalyticsDashboard } from '../pages/ExcursionAnalyticsDashboard';
import { FleetOccupancyChart } from '../components/excursions/FleetOccupancyChart';
import { GuestReviewFeed } from '../components/excursions/GuestReviewFeed';
import { GuideRatingMatrix } from '../components/excursions/GuideRatingMatrix';
import * as analyticsService from '../services/excursionAnalyticsService';

describe('Shore Excursion Analytics UI Suite (KAN-347)', () => {
  const mockKpi: analyticsService.ExcursionOpsKpi = {
    totalExcursions: 5,
    totalReviews: 24,
    averageOverallRating: 4.8,
    averageGuideRating: 4.9,
    averageBusRating: 4.6,
    averageValueRating: 4.7,
    totalFlaggedReviews: 1,
    providerScorecards: [
      {
        providerId: 'prov-1',
        providerName: 'Halong Heritage Tours',
        totalExcursions: 3,
        totalReviews: 15,
        averageRating: 4.9,
        averageGuideRating: 4.9,
        averageBusRating: 4.8,
        averageValueRating: 4.9,
        flaggedCount: 0,
        performanceTier: 'EXCELLENT',
      },
      {
        providerId: 'prov-2',
        providerName: 'Coastal Speedboat Co',
        totalExcursions: 2,
        totalReviews: 9,
        averageRating: 2.8,
        averageGuideRating: 3.1,
        averageBusRating: 2.5,
        averageValueRating: 2.9,
        flaggedCount: 1,
        performanceTier: 'HIGH_RISK',
      },
    ],
    guideRatings: [
      {
        guideId: 1,
        guideName: 'Nguyễn Văn A',
        guideCode: 'GD-001',
        role: 'LEAD',
        averageRating: 4.95,
        totalAssignedExcursions: 12,
      },
    ],
  };

  const mockFleet: analyticsService.FleetOccupancyAnalyticsResponse = {
    totalFleetCount: 8,
    totalFleetCapacity: 360,
    totalPassengersSeated: 288,
    overallFleetOccupancyRate: 80.0,
    portSummaries: [
      {
        portId: 1,
        portName: 'Hạ Long Bay Port',
        busCount: 4,
        totalCapacity: 180,
        assignedPassengers: 144,
        occupancyRate: 80.0,
      },
    ],
    providerSummaries: [
      {
        providerName: 'Halong Heritage Tours',
        busCount: 4,
        totalCapacity: 180,
        assignedPassengers: 144,
        occupancyRate: 80.0,
      },
    ],
    excursions: [],
  };

  const mockReviews: analyticsService.ExcursionReview[] = [
    {
      id: 101,
      excursionId: 1,
      passengerId: 501,
      ratingOverall: 1,
      ratingGuide: 2,
      ratingBus: 1,
      ratingValue: 1,
      comments: 'Xe phóng nhanh vượt ẩu, rất nguy hiểm!',
      isFlagged: true,
      flagReason: 'Đánh giá tiêu cực mức độ cao (1 sao)',
      createdAt: '2026-10-21T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders FleetOccupancyChart with correct KPI and breakdown', () => {
    render(<FleetOccupancyChart kpi={mockKpi} fleet={mockFleet} />);

    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('(288/360 chỗ)')).toBeInTheDocument();
    expect(screen.getByText('4.8 / 5.0')).toBeInTheDocument();
    expect(screen.getByText('Hạ Long Bay Port')).toBeInTheDocument();
    expect(screen.getByText('Halong Heritage Tours')).toBeInTheDocument();
  });

  it('renders GuestReviewFeed with flagged negative reviews', async () => {
    vi.spyOn(analyticsService, 'getFlaggedReviews').mockResolvedValue(mockReviews);

    render(<GuestReviewFeed />);

    await waitFor(() => {
      expect(screen.getByText('CẢNH BÁO KHẨN')).toBeInTheDocument();
      expect(screen.getByText(/Xe phóng nhanh vượt ẩu, rất nguy hiểm!/)).toBeInTheDocument();
    });
  });

  it('renders GuideRatingMatrix and classifies provider performance tiers', () => {
    render(<GuideRatingMatrix kpi={mockKpi} />);

    expect(screen.getByText('Halong Heritage Tours')).toBeInTheDocument();
    expect(screen.getByText('Xuất Sắc')).toBeInTheDocument();
    expect(screen.getByText('Coastal Speedboat Co')).toBeInTheDocument();
    expect(screen.getByText(/Rủi Ro Cao/)).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('4.95')).toBeInTheDocument();
  });

  it('switches tabs smoothly on ExcursionAnalyticsDashboard and fetches all reviews', async () => {
    vi.spyOn(analyticsService, 'getExcursionOpsKpi').mockResolvedValue(mockKpi);
    vi.spyOn(analyticsService, 'getFleetOccupancyAnalytics').mockResolvedValue(mockFleet);
    vi.spyOn(analyticsService, 'getFlaggedReviews').mockResolvedValue(mockReviews);
    vi.spyOn(analyticsService, 'getAllExcursionReviews').mockResolvedValue({
      content: mockReviews,
      totalElements: 1,
      totalPages: 1,
    });

    render(<ExcursionAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Phân Tích Hiệu Suất Tour Bờ & Đội Xe (Analytics)')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    const reviewsTab = screen.getByRole('button', { name: /Đánh Giá Khách Hàng/i });
    fireEvent.click(reviewsTab);

    await waitFor(() => {
      expect(screen.getByText('CẢNH BÁO KHẨN')).toBeInTheDocument();
    });

    const allFilterBtn = screen.getByRole('button', { name: /Tất Cả Đánh Giá/i });
    fireEvent.click(allFilterBtn);

    await waitFor(() => {
      expect(screen.getByText(/Hiển thị/)).toBeInTheDocument();
    });

    const scorecardsTab = screen.getByRole('button', { name: /Đối Tác & Hướng Dẫn Viên/i });
    fireEvent.click(scorecardsTab);

    await waitFor(() => {
      expect(screen.getByText('Bảng Điểm Hiệu Suất Đối Tác Vận Hành Tour Bờ (Provider Scorecards)')).toBeInTheDocument();
    });
  });
});
