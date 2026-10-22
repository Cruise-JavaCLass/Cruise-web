import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { StarRatingModal } from './StarRatingModal';
import { FeedbackTriageDrawer } from '../admin/FeedbackTriageDrawer';
import { passengerReviewService } from '../../services/passengerReviewService';
import type { PassengerServiceReviewResponse } from '../../services/feedbackTypes';

describe('StarRatingModal (KAN-266 & KAN-441)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits rating review successfully with star selection and comments', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    vi.spyOn(passengerReviewService, 'submitReview').mockResolvedValue({
      id: 1,
      passengerId: 101,
      passengerName: 'Bob Vance',
      cabinNumber: 'CABIN-601',
      category: 'DINING_EXPERIENCE',
      rating: 4,
      sentiment: 'POSITIVE',
      status: 'NEW',
      isLowRatingAlert: false,
      createdAt: new Date().toISOString(),
    });

    render(
      <StarRatingModal
        isOpen={true}
        onClose={onClose}
        passengerId={101}
        passengerName="Bob Vance"
        cabinNumber="CABIN-601"
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText('Đánh Giá Trải Nghiệm Dịch Vụ')).toBeInTheDocument();
    expect(screen.getByText('Bob Vance')).toBeInTheDocument();

    const starButtons = screen.getAllByRole('button', { name: /sao/ });
    fireEvent.click(starButtons[3]); // 4 stars

    const commentInput = screen.getByPlaceholderText(/Chia sẻ thêm cảm nhận/);
    fireEvent.change(commentInput, { target: { value: 'Great dining experience!' } });

    const submitBtn = screen.getByRole('button', { name: 'Gửi Đánh Giá' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(passengerReviewService.submitReview).toHaveBeenCalledWith(
        expect.objectContaining({
          passengerId: 101,
          rating: 4,
          comments: 'Great dining experience!',
        })
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <StarRatingModal
        isOpen={false}
        onClose={vi.fn()}
        passengerId={101}
        passengerName="Bob"
        cabinNumber="101"
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('FeedbackTriageDrawer (KAN-440 & KAN-441)', () => {
  const mockReview: PassengerServiceReviewResponse = {
    id: 99,
    passengerId: 202,
    passengerName: 'Dwight Schrute',
    cabinNumber: 'CABIN-301',
    category: 'CABIN_SERVICE',
    rating: 1,
    sentiment: 'NEGATIVE',
    comments: 'Unacceptable housekeeping delays!',
    status: 'ESCALATED',
    isLowRatingAlert: true,
    escalationReason: 'Low CSAT Score (1/5)',
    createdAt: new Date().toISOString(),
  };

  it('renders review details, alert badges and executes triage update', async () => {
    const onTriageSuccess = vi.fn();
    const onClose = vi.fn();

    vi.spyOn(passengerReviewService, 'triageReview').mockResolvedValue({
      ...mockReview,
      status: 'RESOLVED',
      adminNotes: 'Apologized in person and granted shipboard credit',
      resolvedBy: 'Manager',
    });

    render(
      <FeedbackTriageDrawer
        isOpen={true}
        onClose={onClose}
        review={mockReview}
        onTriageSuccess={onTriageSuccess}
      />
    );

    expect(screen.getByText(/Xử Lý Phản Hồi Khách Hàng #99/)).toBeInTheDocument();
    expect(screen.getByText('Cảnh báo điểm thấp')).toBeInTheDocument();
    expect(screen.getByText(/"Unacceptable housekeeping delays!"/)).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'Lưu Kết Quả Xử Lý' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(passengerReviewService.triageReview).toHaveBeenCalledWith(
        99,
        expect.objectContaining({
          resolvedBy: 'GuestRelationsManager',
        })
      );
      expect(onTriageSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
