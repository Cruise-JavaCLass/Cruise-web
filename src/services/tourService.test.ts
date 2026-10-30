import { beforeEach, describe, it, expect, vi } from 'vitest';
import { apiClient } from './api';
import {
  validateTourForm,
  canTransitionTourStatus,
  formatTourPayload,
  getTourProviders,
  createTourProvider,
  updateTourProvider,
} from './tourService';
import type { TourFormData } from './tourService';

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('tourService - Tour Business Logic & Validation', () => {
  const validFormData: TourFormData = {
    name: 'Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ',
    code: 'TOUR-HL-001',
    description: 'Tour tham quan vịnh',
    shipId: 1,
    durationDays: 4,
    durationNights: 3,
    departurePort: 'Cảng Tuần Châu (Hạ Long)',
    destinationPort: 'Cảng Tuần Châu (Hạ Long)',
    startDate: '2026-10-15',
    endDate: '2026-10-18',
    maxCapacity: 2000,
    basePrice: 15500000,
    currency: 'VND',
    status: 'PUBLISHED',
  };

  it('validates a correct tour form with no errors', () => {
    const errors = validateTourForm(validFormData, 2400);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('validates required name and length constraints', () => {
    const errorsEmpty = validateTourForm({ ...validFormData, name: '' });
    expect(errorsEmpty.name).toBe('Tên tour không được để trống');

    const errorsShort = validateTourForm({ ...validFormData, name: 'Tour' });
    expect(errorsShort.name).toBe('Tên tour phải từ 5 đến 150 ký tự');
  });

  it('validates tour code format', () => {
    const errorsEmpty = validateTourForm({ ...validFormData, code: '' });
    expect(errorsEmpty.code).toBe('Mã tour không được để trống');

    const errorsInvalid = validateTourForm({ ...validFormData, code: 'TOUR 01' });
    expect(errorsInvalid.code).toBe('Mã tour chỉ được chứa chữ cái, số, gạch ngang/dưới (3-30 ký tự)');
  });

  it('validates tour duration rules (days and nights)', () => {
    const errorNightsMoreThanDays = validateTourForm({
      ...validFormData,
      durationDays: 3,
      durationNights: 4,
    });
    expect(errorNightsMoreThanDays.durationNights).toBe('Số đêm tour không thể lớn hơn số ngày tour');

    const errorZeroDays = validateTourForm({
      ...validFormData,
      durationDays: 0,
    });
    expect(errorZeroDays.durationDays).toBe('Số ngày tour phải từ 1 ngày trở lên');
  });

  it('validates tour date order', () => {
    const errorDates = validateTourForm({
      ...validFormData,
      startDate: '2026-10-20',
      endDate: '2026-10-15',
    });
    expect(errorDates.endDate).toBe('Ngày kết thúc tour không thể trước ngày bắt đầu');
  });

  it('validates capacity against ship capacity', () => {
    const errorOverCapacity = validateTourForm(
      {
        ...validFormData,
        maxCapacity: 3000,
      },
      2400
    );
    expect(errorOverCapacity.maxCapacity).toContain('không thể vượt quá sức chứa tàu (2400)');
  });

  it('validates base price not negative', () => {
    const errorPrice = validateTourForm({
      ...validFormData,
      basePrice: -100,
    });
    expect(errorPrice.basePrice).toBe('Giá tour cơ bản không được âm');
  });

  it('validates status transitions state machine', () => {
    expect(canTransitionTourStatus('DRAFT', 'PUBLISHED')).toBe(true);
    expect(canTransitionTourStatus('DRAFT', 'CANCELLED')).toBe(true);
    expect(canTransitionTourStatus('DRAFT', 'COMPLETED')).toBe(false);

    expect(canTransitionTourStatus('PUBLISHED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionTourStatus('PUBLISHED', 'DRAFT')).toBe(true);
    expect(canTransitionTourStatus('PUBLISHED', 'CANCELLED')).toBe(true);

    expect(canTransitionTourStatus('IN_PROGRESS', 'COMPLETED')).toBe(true);
    expect(canTransitionTourStatus('IN_PROGRESS', 'CANCELLED')).toBe(true);
    expect(canTransitionTourStatus('IN_PROGRESS', 'DRAFT')).toBe(false);

    expect(canTransitionTourStatus('COMPLETED', 'DRAFT')).toBe(false);
    expect(canTransitionTourStatus('CANCELLED', 'DRAFT')).toBe(true);
  });

  it('formats payload correctly with trimmed values and numbers', () => {
    const payload = formatTourPayload({
      ...validFormData,
      name: '  Tour Vịnh Hạ Long  ',
      code: 'tour-01',
      maxCapacity: '500' as unknown as number,
      basePrice: '10000000' as unknown as number,
    });

    expect(payload.name).toBe('Tour Vịnh Hạ Long');
    expect(payload.code).toBe('TOUR-01');
    expect(payload.maxCapacity).toBe(500);
    expect(payload.basePrice).toBe(10000000);
  });
});

describe('tourService - Tour provider API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets tour providers from the backend', async () => {
    const providers = [{ providerId: 'provider-1', providerName: 'Provider One' }];
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: providers } });

    await expect(getTourProviders()).resolves.toEqual(providers);
    expect(apiClient.get).toHaveBeenCalledWith('/v1/tour-providers?page=0&size=100');
  });

  it('gets provider content from a paginated backend response', async () => {
    const providers = [{ id: 'provider-1', name: 'Provider One' }];
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { success: true, data: { content: providers, totalElements: 1 } },
    });

    await expect(getTourProviders()).resolves.toEqual(providers);
  });

  it('creates a tour provider through the backend', async () => {
    const provider = { providerId: 'provider-1', providerName: 'Provider One' };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true, data: provider } });

    await expect(createTourProvider(provider)).resolves.toEqual(provider);
    expect(apiClient.post).toHaveBeenCalledWith('/v1/tour-providers', provider);
  });

  it('updates a tour provider through the backend', async () => {
    const provider = { providerId: 'provider/1', providerName: 'Updated Provider' };
    vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true, data: provider } });

    await expect(updateTourProvider(provider.providerId, provider)).resolves.toEqual(provider);
    expect(apiClient.put).toHaveBeenCalledWith('/v1/tour-providers/provider%2F1', provider);
  });
});
