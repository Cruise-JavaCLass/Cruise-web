import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcursionStatusModal } from './ExcursionStatusModal';
import * as excursionService from '../../services/excursionService';

describe('ExcursionStatusModal Component Tests (KAN-172)', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockExcursion = excursionService.INITIAL_EXCURSIONS[1]; // status: IN_PROGRESS

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with current status and available transition options', () => {
    render(
      <ExcursionStatusModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        excursion={mockExcursion}
      />
    );

    expect(
      screen.getByRole('heading', { name: /Chuyển Đổi Trạng Thái Tour Trên Bờ/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Trạng thái hiện tại:/i)).toBeInTheDocument();
    expect(screen.getByText('Đang khởi hành (IN_PROGRESS)')).toBeInTheDocument();

    // From IN_PROGRESS, allowed are COMPLETED, DELAYED, CANCELLED
    expect(screen.getByText(/Hoàn thành \(COMPLETED\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Bị trễ giờ \(DELAYED\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã hủy \(CANCELLED\)/i)).toBeInTheDocument();
  });

  it('closes immediately without updating if the status was not changed', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(excursionService, 'updateExcursionStatus');

    render(
      <ExcursionStatusModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        excursion={mockExcursion}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đổi/i });
    await user.click(submitBtn);

    expect(updateSpy).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('requires reason when transitioning to DELAYED', async () => {
    const user = userEvent.setup();

    render(
      <ExcursionStatusModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        excursion={mockExcursion}
      />
    );

    const delayedOption = screen.getByRole('button', { name: /Bị trễ giờ \(DELAYED\)/i });
    await user.click(delayedOption);

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đổi/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Vui lòng nhập lý do bị trễ giờ (để thông báo bộ phận điều phối và hành khách)')
      ).toBeInTheDocument();
    });
  });

  it('requires reason when transitioning to CANCELLED', async () => {
    const user = userEvent.setup();

    render(
      <ExcursionStatusModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        excursion={mockExcursion}
      />
    );

    const cancelledOption = screen.getByRole('button', { name: /Đã hủy \(CANCELLED\)/i });
    await user.click(cancelledOption);

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đổi/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập lý do hủy chuyến tour trên bờ')).toBeInTheDocument();
    });
  });

  it('successfully transitions to COMPLETED without requiring reason', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(excursionService, 'updateExcursionStatus');

    render(
      <ExcursionStatusModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        excursion={mockExcursion}
      />
    );

    const completedOption = screen.getByRole('button', { name: /Hoàn thành \(COMPLETED\)/i });
    await user.click(completedOption);

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đổi/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(mockExcursion.id, 'COMPLETED', '');
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('successfully transitions to DELAYED when reason is provided', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(excursionService, 'updateExcursionStatus');

    render(
      <ExcursionStatusModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        excursion={mockExcursion}
      />
    );

    const delayedOption = screen.getByRole('button', { name: /Bị trễ giờ \(DELAYED\)/i });
    await user.click(delayedOption);

    const reasonInput = screen.getByLabelText(/Lý do bị trễ giờ/i);
    await user.type(reasonInput, 'Mưa lớn tại đèo Hải Vân gây ùn ứ');

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đổi/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        mockExcursion.id,
        'DELAYED',
        'Mưa lớn tại đèo Hải Vân gây ùn ứ'
      );
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
