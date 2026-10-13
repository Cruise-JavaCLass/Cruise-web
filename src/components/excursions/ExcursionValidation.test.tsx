import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcursionModal } from './ExcursionModal';
import { validateExcursionForm } from '../../services/excursionService';

describe('Excursion Form Validation - Price, Capacity and Schedule (KAN-175)', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderExcursionModal = (customOverrides = {}) => {
    const dialogProps = { isOpen: true, onClose: mockOnClose, onSuccess: mockOnSuccess, ...customOverrides };
    return render(<ExcursionModal {...dialogProps} />);
  };

  describe('Pure Function Unit Validation (validateExcursionForm)', () => {
    const validBaseForm = {
      tourId: 1,
      portId: 1,
      title: 'Tour Ngắm Hoàng Hôn',
      code: 'EXC-SUNSET-01',
      operatorName: 'Sunset Ocean Ltd',
      operatorContact: '0901234567',
      guideName: 'Trần Văn Bình',
      guidePhone: '0901234567',
      busNumber: 'BUS-01',
      excursionDate: '2026-05-15',
      meetingTime: '15:00',
      departureTime: '15:30',
      returnToShipTime: '18:00',
      allAboardTime: '18:45',
      maxCapacity: 50,
      isIncluded: false,
      price: 450000,
      currency: 'VND',
      category: 'SIGHTSEEING' as const,
      difficulty: 'EASY' as const,
      description: 'Tour trải nghiệm hoàng hôn trên vịnh',
      status: 'SCHEDULED' as const,
      imageUrl: '',
    };

    it('returns empty errors object when form data is completely valid', () => {
      const errors = validateExcursionForm(validBaseForm);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    describe('Pricing Boundary Rules', () => {
      it('requires price > 0 when isIncluded is false', () => {
        const errorsEmptyPrice = validateExcursionForm({ ...validBaseForm, isIncluded: false, price: '' });
        expect(errorsEmptyPrice.price).toBe('Tour có tính phí bắt buộc phải có giá lớn hơn 0');

        const errorsZeroPrice = validateExcursionForm({ ...validBaseForm, isIncluded: false, price: 0 });
        expect(errorsZeroPrice.price).toBe('Tour có tính phí bắt buộc phải có giá lớn hơn 0');

        const errorsNegativePrice = validateExcursionForm({ ...validBaseForm, isIncluded: false, price: -50000 });
        expect(errorsNegativePrice.price).toBe('Tour có tính phí bắt buộc phải có giá lớn hơn 0');
      });

      it('permits price = 0 or empty when isIncluded is true', () => {
        const errorsFreeZero = validateExcursionForm({ ...validBaseForm, isIncluded: true, price: 0 });
        expect(errorsFreeZero.price).toBeUndefined();

        const errorsFreeEmpty = validateExcursionForm({ ...validBaseForm, isIncluded: true, price: '' });
        expect(errorsFreeEmpty.price).toBeUndefined();
      });
    });

    describe('Capacity Boundary Rules', () => {
      it('rejects capacity <= 0 or empty', () => {
        const errorsEmpty = validateExcursionForm({ ...validBaseForm, maxCapacity: '' });
        expect(errorsEmpty.maxCapacity).toBe('Số lượng chỗ tối đa phải lớn hơn 0');

        const errorsZero = validateExcursionForm({ ...validBaseForm, maxCapacity: 0 });
        expect(errorsZero.maxCapacity).toBe('Số lượng chỗ tối đa phải lớn hơn 0');

        const errorsNegative = validateExcursionForm({ ...validBaseForm, maxCapacity: -10 });
        expect(errorsNegative.maxCapacity).toBe('Số lượng chỗ tối đa phải lớn hơn 0');
      });

      it('rejects capacity exceeding maritime group limit of 1000 guests', () => {
        const errorsExceed = validateExcursionForm({ ...validBaseForm, maxCapacity: 1001 });
        expect(errorsExceed.maxCapacity).toBe('Sức chứa của một đoàn tour trên bờ không quá 1000 khách');
      });

      it('accepts valid capacity boundaries (1 to 1000)', () => {
        const errorsMin = validateExcursionForm({ ...validBaseForm, maxCapacity: 1 });
        expect(errorsMin.maxCapacity).toBeUndefined();

        const errorsMax = validateExcursionForm({ ...validBaseForm, maxCapacity: 1000 });
        expect(errorsMax.maxCapacity).toBeUndefined();
      });
    });

    describe('Schedule & Maritime Timing Chronological Validation', () => {
      it('flags error when departure time is before meeting time', () => {
        const errors = validateExcursionForm({
          ...validBaseForm,
          meetingTime: '16:00',
          departureTime: '15:30',
        });
        expect(errors.departureTime).toBe('Giờ khởi hành phải sau hoặc cùng giờ tập trung');
      });

      it('allows departure time equal to meeting time', () => {
        const errors = validateExcursionForm({
          ...validBaseForm,
          meetingTime: '15:30',
          departureTime: '15:30',
        });
        expect(errors.departureTime).toBeUndefined();
      });

      it('flags error when return to ship is before or equal to departure time', () => {
        const errorsBefore = validateExcursionForm({
          ...validBaseForm,
          departureTime: '16:00',
          returnToShipTime: '15:00',
        });
        expect(errorsBefore.returnToShipTime).toBe('Giờ quay lại tàu phải sau giờ khởi hành');

        const errorsEqual = validateExcursionForm({
          ...validBaseForm,
          departureTime: '16:00',
          returnToShipTime: '16:00',
        });
        expect(errorsEqual.returnToShipTime).toBe('Giờ quay lại tàu phải sau giờ khởi hành');
      });

      it('flags error when return to ship exceeds all aboard deadline', () => {
        const errors = validateExcursionForm({
          ...validBaseForm,
          returnToShipTime: '19:00',
          allAboardTime: '18:45',
        });
        expect(errors.allAboardTime).toBe('Giờ quay lại tàu không thể trễ hơn giờ tàu nhổ neo (All Aboard)');
      });

      it('accepts return to ship exactly at all aboard deadline (margin = 0 min)', () => {
        const errors = validateExcursionForm({
          ...validBaseForm,
          returnToShipTime: '18:45',
          allAboardTime: '18:45',
        });
        expect(errors.allAboardTime).toBeUndefined();
      });
    });
  });

  describe('Interactive Modal Validation & UI Feedback', () => {
    it.each([
      {
        scenario: 'invalid code characters (lowercase or spaces)',
        inputLabel: /Mã Excursion/i,
        badValue: 'exc bad code',
        expectedError: 'Mã excursion chỉ gồm chữ cái in hoa, số và gạch nối (3-25 ký tự)',
      },
      {
        scenario: 'empty excursion title',
        inputLabel: /Tên Tour Trên Bờ/i,
        badValue: '   ',
        expectedError: 'Tên tour trên bờ không được để trống',
      },
      {
        scenario: 'empty operator name',
        inputLabel: /Nhà Cung Cấp Tour Địa Phương/i,
        badValue: '   ',
        expectedError: 'Nhà cung cấp tour địa phương không được để trống',
      },
    ])('displays error on $scenario when submitted', async ({ inputLabel, badValue, expectedError }) => {
      const user = userEvent.setup();
      renderExcursionModal();

      const input = screen.getByLabelText(inputLabel);
      await user.clear(input);
      if (badValue.trim()) {
        await user.type(input, badValue);
      }

      const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(expectedError)).toBeInTheDocument();
      });
    });

    it('toggles free tour mode and clears price error dynamically', async () => {
      const user = userEvent.setup();
      renderExcursionModal();

      // Default is included (free). Uncheck it to make it paid
      const includedCheckbox = screen.getByLabelText(/Đã bao gồm trong giá vé Cruise/i);
      await user.click(includedCheckbox);

      const priceInput = screen.getByLabelText(/Giá Vé Bổ Sung/i);
      await user.clear(priceInput);

      const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Tour có tính phí bắt buộc phải có giá lớn hơn 0')).toBeInTheDocument();
      });

      // Type a valid price > 0 -> error should disappear immediately
      await user.type(priceInput, '750000');
      expect(screen.queryByText('Tour có tính phí bắt buộc phải có giá lớn hơn 0')).not.toBeInTheDocument();

      // Check the included box again -> price field unmounts
      await user.click(includedCheckbox);
      expect(screen.queryByLabelText(/Giá Vé Bổ Sung/i)).not.toBeInTheDocument();
    });

    it('displays dynamic safety margin indicator cards (Safe >=30m, Tight <30m, Critical Danger)', async () => {
      const user = userEvent.setup();
      renderExcursionModal();

      const returnInput = screen.getByLabelText(/Về Lại Tàu/i);
      const allAboardInput = screen.getByLabelText(/All-Aboard/i);

      // 1. Safe Margin (>= 30 mins): return 16:00, all aboard 17:00 (60 mins)
      await user.clear(returnInput);
      await user.type(returnInput, '16:00');
      await user.clear(allAboardInput);
      await user.type(allAboardInput, '17:00');

      expect(screen.getByText(/Đạt chuẩn an toàn hải hành \(>= 30 phút\)/i)).toBeInTheDocument();
      expect(screen.getByText(/60 phút/i)).toBeInTheDocument();

      // 2. Tight Margin (< 30 mins): return 16:45, all aboard 17:00 (15 mins)
      await user.clear(returnInput);
      await user.type(returnInput, '16:45');
      expect(screen.getByText(/Cảnh báo: Khoảng cách ngắn dưới 30 phút/i)).toBeInTheDocument();
      expect(screen.getByText(/15 phút/i)).toBeInTheDocument();

      // 3. Danger: return 17:15, all aboard 17:00 (-15 mins)
      await user.clear(returnInput);
      await user.type(returnInput, '17:15');
      expect(screen.getByText(/Nguy hiểm: Giờ về tàu muộn hơn giờ xuất bến/i)).toBeInTheDocument();
      expect(screen.getByText(/Trễ 15 phút!/i)).toBeInTheDocument();
    });

    it('clears field errors in real-time as user updates inputs', async () => {
      const user = userEvent.setup();
      renderExcursionModal();

      const titleInput = screen.getByLabelText(/Tên Tour Trên Bờ/i);
      await user.clear(titleInput);

      const submitBtn = screen.getByRole('button', { name: /Tạo Excursion/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Tên tour trên bờ không được để trống')).toBeInTheDocument();
      });

      // Typing into input clears the error immediately
      await user.type(titleInput, 'Tour Trực Thăng Ngắm Biển');
      expect(screen.queryByText('Tên tour trên bờ không được để trống')).not.toBeInTheDocument();
    });
  });
});
