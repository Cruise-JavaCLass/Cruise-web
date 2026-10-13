import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateExcursionForm,
  canTransitionExcursionStatus,
  formatExcursionPayload,
  fetchExcursions,
  getExcursionById,
  createExcursion,
  updateExcursion,
  updateExcursionStatus,
  deleteExcursion,
  resetExcursionServiceState,
  type ExcursionFormData,
  type ExcursionStatus,
} from './excursionService';
import { apiClient } from './api';

describe('excursionService Unit & Business Rule Tests (KAN-172)', () => {
  const validFormData: ExcursionFormData = {
    tourId: 1,
    portId: 1,
    title: 'Tour Ngắm Hoàng Hôn Vịnh Hạ Long',
    code: 'EXC-HL-05',
    description: 'Thưởng ngoạn cảnh hoàng hôn ngoạn mục trên Vịnh Hạ Long',
    category: 'SIGHTSEEING',
    difficulty: 'EASY',
    operatorName: 'Halong Discovery Co.',
    operatorContact: '+84 203 111 222',
    guideName: 'Trần Văn Hải',
    guidePhone: '+84 912 345 678',
    busNumber: 'BUS-01',
    excursionDate: '2026-10-16',
    meetingTime: '15:00',
    departureTime: '15:30',
    returnToShipTime: '18:30',
    allAboardTime: '19:00',
    maxCapacity: 50,
    price: 500000,
    currency: 'VND',
    isIncluded: false,
    status: 'SCHEDULED',
  };

  beforeEach(() => {
    resetExcursionServiceState();
    vi.restoreAllMocks();
  });

  describe('Form Validation Rules', () => {
    it('passes validation when all fields are properly filled', () => {
      const errors = validateExcursionForm(validFormData);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('requires title with length between 5 and 150 characters', () => {
      expect(validateExcursionForm({ ...validFormData, title: '' }).title).toBe(
        'Tên tour trên bờ không được để trống'
      );
      expect(validateExcursionForm({ ...validFormData, title: 'abc' }).title).toBe(
        'Tên tour phải từ 5 đến 150 ký tự'
      );
      expect(validateExcursionForm({ ...validFormData, title: 'a'.repeat(151) }).title).toBe(
        'Tên tour phải từ 5 đến 150 ký tự'
      );
    });

    it('validates excursion code pattern', () => {
      expect(validateExcursionForm({ ...validFormData, code: '' }).code).toBe(
        'Mã excursion không được để trống'
      );
      expect(validateExcursionForm({ ...validFormData, code: 'ab' }).code).toBe(
        'Mã excursion chỉ gồm chữ cái in hoa, số và gạch nối (3-25 ký tự)'
      );
      expect(validateExcursionForm({ ...validFormData, code: 'INVALID@CODE' }).code).toBe(
        'Mã excursion chỉ gồm chữ cái in hoa, số và gạch nối (3-25 ký tự)'
      );
    });

    it('requires tourId, portId, and operatorName', () => {
      expect(validateExcursionForm({ ...validFormData, tourId: '' }).tourId).toBe(
        'Vui lòng chọn tour du thuyền liên kết'
      );
      expect(validateExcursionForm({ ...validFormData, portId: '' }).portId).toBe(
        'Vui lòng chọn cảng dừng (Port of Call)'
      );
      expect(validateExcursionForm({ ...validFormData, operatorName: '   ' }).operatorName).toBe(
        'Nhà cung cấp tour địa phương không được để trống'
      );
    });

    it('validates timing order: meeting <= departure < return <= allAboard', () => {
      // departure before meeting
      const badDep = validateExcursionForm({
        ...validFormData,
        meetingTime: '10:00',
        departureTime: '09:00',
      });
      expect(badDep.departureTime).toBe('Giờ khởi hành phải sau hoặc cùng giờ tập trung');

      // return before departure
      const badRet = validateExcursionForm({
        ...validFormData,
        departureTime: '14:00',
        returnToShipTime: '13:00',
      });
      expect(badRet.returnToShipTime).toBe('Giờ quay lại tàu phải sau giờ khởi hành');

      // return after all aboard
      const badAll = validateExcursionForm({
        ...validFormData,
        returnToShipTime: '18:00',
        allAboardTime: '17:30',
      });
      expect(badAll.allAboardTime).toBe('Giờ quay lại tàu không thể trễ hơn giờ tàu nhổ neo (All Aboard)');
    });

    it('validates capacity limits and pricing rules', () => {
      expect(validateExcursionForm({ ...validFormData, maxCapacity: '' }).maxCapacity).toBe(
        'Số lượng chỗ tối đa phải lớn hơn 0'
      );
      expect(validateExcursionForm({ ...validFormData, maxCapacity: 0 }).maxCapacity).toBe(
        'Số lượng chỗ tối đa phải lớn hơn 0'
      );
      expect(validateExcursionForm({ ...validFormData, maxCapacity: 1200 }).maxCapacity).toBe(
        'Sức chứa của một đoàn tour trên bờ không quá 1000 khách'
      );

      // Paid excursion requires price > 0
      expect(validateExcursionForm({ ...validFormData, isIncluded: false, price: 0 }).price).toBe(
        'Tour có tính phí bắt buộc phải có giá lớn hơn 0'
      );

      // Free package excursion allows price 0
      expect(validateExcursionForm({ ...validFormData, isIncluded: true, price: 0 }).price).toBeUndefined();
    });
  });

  describe('Status Transitions (State Machine)', () => {
    it('permits valid transitions from SCHEDULED', () => {
      expect(canTransitionExcursionStatus('SCHEDULED', 'IN_PROGRESS')).toBe(true);
      expect(canTransitionExcursionStatus('SCHEDULED', 'DELAYED')).toBe(true);
      expect(canTransitionExcursionStatus('SCHEDULED', 'CANCELLED')).toBe(true);
      expect(canTransitionExcursionStatus('SCHEDULED', 'COMPLETED')).toBe(false);
    });

    it('permits valid transitions from IN_PROGRESS', () => {
      expect(canTransitionExcursionStatus('IN_PROGRESS', 'COMPLETED')).toBe(true);
      expect(canTransitionExcursionStatus('IN_PROGRESS', 'DELAYED')).toBe(true);
      expect(canTransitionExcursionStatus('IN_PROGRESS', 'CANCELLED')).toBe(true);
      expect(canTransitionExcursionStatus('IN_PROGRESS', 'SCHEDULED')).toBe(false);
    });

    it('prevents transitioning from COMPLETED', () => {
      expect(canTransitionExcursionStatus('COMPLETED', 'SCHEDULED')).toBe(false);
      expect(canTransitionExcursionStatus('COMPLETED', 'CANCELLED')).toBe(false);
      expect(canTransitionExcursionStatus('COMPLETED', 'COMPLETED')).toBe(true);
    });
  });

  describe('Service API Operations with Local Fallbacks', () => {
    it('formats payload correctly and zeroes price if included', () => {
      const payload = formatExcursionPayload({
        ...validFormData,
        title: '   Khám phá Đảo Ti Tốp   ',
        code: 'exc-titop-01',
        isIncluded: true,
        price: 990000,
      });

      expect(payload.title).toBe('Khám phá Đảo Ti Tốp');
      expect(payload.code).toBe('EXC-TITOP-01');
      expect(payload.price).toBe(0);
    });

    it('fetches excursions with keyword and port filtering', async () => {
      const all = await fetchExcursions();
      expect(all.length).toBeGreaterThan(0);

      const filteredByPort = await fetchExcursions({ portId: 1 });
      expect(filteredByPort.every((e) => e.portId === 1)).toBe(true);

      const filteredByKw = await fetchExcursions({ keyword: 'Hội An' });
      expect(filteredByKw.length).toBeGreaterThan(0);
      expect(filteredByKw[0].title).toContain('Hội An');
    });

    it('gets excursion by ID or returns null if not found', async () => {
      const exc = await getExcursionById(1);
      expect(exc).not.toBeNull();
      expect(exc?.id).toBe(1);

      const nonExistent = await getExcursionById(9999);
      expect(nonExistent).toBeNull();
    });

    it('creates, updates, transitions status, and deletes an excursion', async () => {
      const created = await createExcursion(validFormData, 'Cảng Tuần Châu', 'Hạ Long');
      expect(created.id).toBeDefined();
      expect(created.title).toBe(validFormData.title);

      const updated = await updateExcursion(created.id, {
        ...validFormData,
        title: 'Cập nhật Tour Vịnh',
      });
      expect(updated.title).toBe('Cập nhật Tour Vịnh');

      const delayed = await updateExcursionStatus(created.id, 'DELAYED', 'Tắc đường quốc lộ');
      expect(delayed.status).toBe('DELAYED');
      expect(delayed.delayReason).toBe('Tắc đường quốc lộ');

      await deleteExcursion(created.id);
      const afterDelete = await getExcursionById(created.id);
      expect(afterDelete).toBeNull();
    });

    it('uses apiClient when API call succeeds', async () => {
      const mockData = [
        {
          id: 10,
          tourId: 1,
          portId: 1,
          portName: 'Test Port',
          portCity: 'City',
          title: 'Remote Excursion',
          code: 'EXC-REM-10',
          description: 'Desc',
          category: 'CULTURAL' as const,
          difficulty: 'EASY' as const,
          operatorName: 'Op',
          operatorContact: '123',
          guideName: 'Guide',
          guidePhone: '456',
          busNumber: 'BUS',
          excursionDate: '2026-10-15',
          meetingTime: '08:00',
          departureTime: '08:30',
          returnToShipTime: '11:00',
          allAboardTime: '11:30',
          maxCapacity: 40,
          bookedCount: 10,
          price: 200000,
          currency: 'VND',
          isIncluded: false,
          status: 'SCHEDULED' as ExcursionStatus,
          active: true,
        },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: mockData },
      });

      const res = await fetchExcursions();
      expect(res).toEqual(mockData);
    });
  });
});
