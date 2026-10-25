import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

    const commentInput = screen.getByLabelText(/Ý kiến đóng góp chi tiết/);
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

  it('resets draft state when reopened with a new session', () => {
    const { rerender } = render(
      <StarRatingModal
        isOpen={true}
        onClose={vi.fn()}
        passengerId={101}
        passengerName="Bob"
        cabinNumber="101"
      />
    );

    const commentInput = screen.getByLabelText(/Ý kiến đóng góp chi tiết/);
    fireEvent.change(commentInput, { target: { value: 'Old comment' } });
    expect((commentInput as HTMLTextAreaElement).value).toBe('Old comment');

    // Close modal
    rerender(
      <StarRatingModal
        isOpen={false}
        onClose={vi.fn()}
        passengerId={101}
        passengerName="Bob"
        cabinNumber="101"
      />
    );

    // Reopen modal
    rerender(
      <StarRatingModal
        isOpen={true}
        onClose={vi.fn()}
        passengerId={101}
        passengerName="Bob"
        cabinNumber="101"
      />
    );

    const reloadedInput = screen.getByLabelText(/Ý kiến đóng góp chi tiết/);
    expect((reloadedInput as HTMLTextAreaElement).value).toBe('');
  });

  it('invalidates stale submission rejection when reopened in a new session', async () => {
    let rejectPromise: ((err: Error) => void) | null = null;
    vi.spyOn(passengerReviewService, 'submitReview').mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectPromise = reject;
        })
    );

    const { rerender } = render(
      <StarRatingModal
        isOpen={true}
        onClose={vi.fn()}
        passengerId={101}
        passengerName="Bob"
        cabinNumber="101"
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Gửi Đánh Giá' });
    fireEvent.click(submitBtn);

    // Modal closes while request is in flight
    rerender(
      <StarRatingModal
        isOpen={false}
        onClose={vi.fn()}
        passengerId={101}
        passengerName="Bob"
        cabinNumber="101"
      />
    );

    // Reopen in a new session
    rerender(
      <StarRatingModal
        isOpen={true}
        onClose={vi.fn()}
        passengerId={101}
        passengerName="Bob"
        cabinNumber="101"
      />
    );

    // Now previous submission rejects
    if (rejectPromise) {
      (rejectPromise as (err: Error) => void)(new Error('Late network failure'));
    }

    await waitFor(() => {
      // Error message should NOT be shown in the new session
      expect(screen.queryByText('Late network failure')).not.toBeInTheDocument();
      // Submit button should be enabled
      const newSubmitBtn = screen.getByRole('button', { name: 'Gửi Đánh Giá' });
      expect(newSubmitBtn).not.toBeDisabled();
    });
  });

  it('does not display submission failure if onSuccess throws', async () => {
    const failingOnSuccess = vi.fn().mockImplementation(() => {
      throw new Error('Callback crash');
    });
    vi.spyOn(passengerReviewService, 'submitReview').mockResolvedValue({
      id: 2,
      passengerId: 101,
      passengerName: 'Bob',
      cabinNumber: '101',
      category: 'GENERAL_ONBOARD',
      rating: 5,
      sentiment: 'POSITIVE',
      status: 'NEW',
      isLowRatingAlert: false,
      createdAt: new Date().toISOString(),
    });

    const onClose = vi.fn();
    render(
      <StarRatingModal
        isOpen={true}
        onClose={onClose}
        passengerId={101}
        passengerName="Bob"
        cabinNumber="101"
        onSuccess={failingOnSuccess}
      />
    );

    const submitBtn = screen.getByRole('button', { name: 'Gửi Đánh Giá' });
    expect(() => fireEvent.click(submitBtn)).not.toThrow();

    await waitFor(() => {
      expect(passengerReviewService.submitReview).toHaveBeenCalled();
      expect(failingOnSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(screen.queryByText(/Callback crash/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Không thể gửi đánh giá')).not.toBeInTheDocument();
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
          status: 'ESCALATED',
          resolvedBy: 'GuestRelationsManager',
        })
      );
      expect(onTriageSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('resets triage fields when review prop changes', () => {
    const { rerender } = render(
      <FeedbackTriageDrawer
        isOpen={true}
        onClose={vi.fn()}
        review={mockReview}
      />
    );

    const notesTextarea = screen.getByLabelText(/Ghi chú xử lý/);
    fireEvent.change(notesTextarea, { target: { value: 'Custom draft note' } });
    expect((notesTextarea as HTMLTextAreaElement).value).toBe('Custom draft note');

    const nextReview: PassengerServiceReviewResponse = {
      ...mockReview,
      id: 100,
      adminNotes: 'Existing notes on second review',
      status: 'NEW',
    };

    rerender(
      <FeedbackTriageDrawer
        isOpen={true}
        onClose={vi.fn()}
        review={nextReview}
      />
    );

    const updatedTextarea = screen.getByLabelText(/Ghi chú xử lý/);
    expect((updatedTextarea as HTMLTextAreaElement).value).toBe('Existing notes on second review');
    const statusSelect = screen.getByLabelText(/Trạng thái xử lý/);
    expect((statusSelect as HTMLSelectElement).value).toBe('NEW');
  });

  it('ignores stale triage completion when review selection changes during pending request', async () => {
    let resolvePromise: ((val: PassengerServiceReviewResponse) => void) | null = null;
    vi.spyOn(passengerReviewService, 'triageReview').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    const onTriageSuccess = vi.fn();
    const onClose = vi.fn();

    const { rerender } = render(
      <FeedbackTriageDrawer
        isOpen={true}
        onClose={onClose}
        review={mockReview}
        onTriageSuccess={onTriageSuccess}
      />
    );

    const saveBtn = screen.getByRole('button', { name: 'Lưu Kết Quả Xử Lý' });
    fireEvent.click(saveBtn);

    // Switch to another review while pending
    const secondReview: PassengerServiceReviewResponse = {
      ...mockReview,
      id: 200,
      passengerName: 'Jim Halpert',
      status: 'NEW',
    };

    rerender(
      <FeedbackTriageDrawer
        isOpen={true}
        onClose={onClose}
        review={secondReview}
        onTriageSuccess={onTriageSuccess}
      />
    );

    // Previous request resolves
    if (resolvePromise) {
      (resolvePromise as (val: PassengerServiceReviewResponse) => void)({
        ...mockReview,
        status: 'RESOLVED',
      });
    }

    await waitFor(() => {
      // onTriageSuccess and onClose should NOT be called for stale review 99
      expect(onTriageSuccess).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
