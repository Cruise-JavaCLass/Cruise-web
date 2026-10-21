import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityFeedbackModal } from './ActivityFeedbackModal';
import {
  passengerNotificationService,
  type ActivityFeedbackResponse,
} from '../../services/passengerNotificationService';

vi.mock('../../services/passengerNotificationService');

describe('ActivityFeedbackModal Component Tests (KAN-367 & KAN-368)', () => {
  const mockActivityId = 42;
  const mockActivityTitle = 'Yoga Lúc Bình Minh';
  const mockPassengerId = 15;

  const mockSuccessResponse: ActivityFeedbackResponse = {
    id: 101,
    activityId: mockActivityId,
    passengerId: mockPassengerId,
    rating: 5,
    organizationRating: 5,
    guideRating: 5,
    valueRating: 5,
    comments: 'Dịch vụ rất tốt!',
    escalated: false,
    createdAt: '2026-10-21T10:00:00Z',
  };

  const mockEscalatedResponse: ActivityFeedbackResponse = {
    id: 102,
    activityId: mockActivityId,
    passengerId: mockPassengerId,
    rating: 2,
    comments: 'Không hài lòng về khâu đón tiếp',
    escalated: true,
    escalationReason: 'Đánh giá thấp (2 sao) cần chuyển Trưởng bộ phận CSKH xử lý',
    createdAt: '2026-10-21T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with activity title and initial 5 stars', () => {
    render(
      <ActivityFeedbackModal
        activityId={mockActivityId}
        activityTitle={mockActivityTitle}
        passengerId={mockPassengerId}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Đánh Giá Trải Nghiệm')).toBeInTheDocument();
    expect(screen.getByText(`Hoạt động: ${mockActivityTitle}`)).toBeInTheDocument();
    expect(screen.getByTestId('overall-star-5')).toBeInTheDocument();
  });

  it('submits 5-star rating successfully and shows normal appreciation state', async () => {
    vi.mocked(passengerNotificationService.submitActivityFeedback).mockResolvedValue(
      mockSuccessResponse
    );

    const handleSuccess = vi.fn();
    render(
      <ActivityFeedbackModal
        activityId={mockActivityId}
        activityTitle={mockActivityTitle}
        passengerId={mockPassengerId}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={handleSuccess}
      />
    );

    const commentsInput = screen.getByTestId('feedback-comments-input');
    fireEvent.change(commentsInput, { target: { value: 'Dịch vụ rất tốt!' } });

    const submitBtn = screen.getByTestId('submit-feedback-button');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(passengerNotificationService.submitActivityFeedback).toHaveBeenCalledWith(
        mockActivityId,
        expect.objectContaining({
          passengerId: mockPassengerId,
          rating: 5,
          comments: 'Dịch vụ rất tốt!',
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(mockSuccessResponse);
      expect(screen.getByTestId('feedback-success-state')).toBeInTheDocument();
      expect(screen.getByText('Cảm Ơn Phản Hồi Của Quý Khách!')).toBeInTheDocument();
    });
  });

  it('displays escalation alert for low rating (<= 2 stars) and shows escalated message on submit', async () => {
    vi.mocked(passengerNotificationService.submitActivityFeedback).mockResolvedValue(
      mockEscalatedResponse
    );

    render(
      <ActivityFeedbackModal
        activityId={mockActivityId}
        activityTitle={mockActivityTitle}
        passengerId={mockPassengerId}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Click 2 stars
    const twoStarBtn = screen.getByTestId('overall-star-2');
    fireEvent.click(twoStarBtn);

    // Warning alert is visible
    expect(
      screen.getByText(/Ý kiến của bạn sẽ được chuyển ngay đến Trưởng bộ phận CSKH/)
    ).toBeInTheDocument();

    const submitBtn = screen.getByTestId('submit-feedback-button');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(passengerNotificationService.submitActivityFeedback).toHaveBeenCalledWith(
        mockActivityId,
        expect.objectContaining({
          passengerId: mockPassengerId,
          rating: 2,
        })
      );
      expect(
        screen.getByText(/Đánh giá của bạn đã được chuyển khẩn cấp tới Giám đốc chăm sóc khách hàng/)
      ).toBeInTheDocument();
    });
  });
});
