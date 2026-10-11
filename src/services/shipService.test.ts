import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateShipForm,
  getShips,
  createShip,
  updateShip,
  formatShipPayload,
  INITIAL_SHIPS,
} from './shipService';
import type { ShipFormData } from './shipService';
import { apiClient } from './api';

// ─── helpers ────────────────────────────────────────────────────────────────

const baseValid: ShipFormData = {
  name: 'Sea Pearl',
  code: 'SHIP-001',
  operator: 'Cruise Lines',
  capacity: 1000,
  crewCapacity: 300,
  totalCabins: 500,
  totalDecks: 10,
  status: 'ACTIVE',
};

// ────────────────────────────────────────────────────────────────────────────
// validateShipForm — Form Validation Unit Tests
// ────────────────────────────────────────────────────────────────────────────

describe('validateShipForm', () => {
  describe('name field', () => {
    it('returns error when name is empty', () => {
      const errors = validateShipForm({ ...baseValid, name: '' });
      expect(errors.name).toBeDefined();
    });

    it('returns error when name is only whitespace', () => {
      const errors = validateShipForm({ ...baseValid, name: '   ' });
      expect(errors.name).toBeDefined();
    });

    it('returns error when name is shorter than 2 characters', () => {
      const errors = validateShipForm({ ...baseValid, name: 'A' });
      expect(errors.name).toBeDefined();
    });

    it('returns error when name exceeds 100 characters', () => {
      const errors = validateShipForm({ ...baseValid, name: 'A'.repeat(101) });
      expect(errors.name).toBeDefined();
    });

    it('passes for a valid name within range', () => {
      const errors = validateShipForm({ ...baseValid, name: 'Ha Long Beauty' });
      expect(errors.name).toBeUndefined();
    });
  });

  describe('code field', () => {
    it('returns error when code is empty', () => {
      const errors = validateShipForm({ ...baseValid, code: '' });
      expect(errors.code).toBeDefined();
    });

    it('returns error for code shorter than 3 characters', () => {
      const errors = validateShipForm({ ...baseValid, code: 'AB' });
      expect(errors.code).toBeDefined();
    });

    it('returns error for code with invalid characters (spaces)', () => {
      const errors = validateShipForm({ ...baseValid, code: 'SHIP 001' });
      expect(errors.code).toBeDefined();
    });

    it('passes for lowercase code (auto-uppercased internally)', () => {
      // Code is uppercased before regex test, so lowercase input should pass
      const errors = validateShipForm({ ...baseValid, code: 'ship-001' });
      expect(errors.code).toBeUndefined();
    });

    it('passes for valid code with hyphens and underscores', () => {
      const errors = validateShipForm({ ...baseValid, code: 'SHIP_001-A' });
      expect(errors.code).toBeUndefined();
    });
  });

  describe('operator field', () => {
    it('returns error when operator is empty', () => {
      const errors = validateShipForm({ ...baseValid, operator: '' });
      expect(errors.operator).toBeDefined();
    });

    it('passes for a valid operator name', () => {
      const errors = validateShipForm({ ...baseValid, operator: 'Paradise Cruises' });
      expect(errors.operator).toBeUndefined();
    });
  });

  describe('capacity field', () => {
    it('returns error when capacity is empty string', () => {
      const errors = validateShipForm({ ...baseValid, capacity: '' });
      expect(errors.capacity).toBeDefined();
    });

    it('returns error when capacity is 0', () => {
      const errors = validateShipForm({ ...baseValid, capacity: 0 });
      expect(errors.capacity).toBeDefined();
    });

    it('returns error when capacity is negative', () => {
      const errors = validateShipForm({ ...baseValid, capacity: -1 });
      expect(errors.capacity).toBeDefined();
    });

    it('passes for positive capacity', () => {
      const errors = validateShipForm({ ...baseValid, capacity: 1 });
      expect(errors.capacity).toBeUndefined();
    });
  });

  describe('totalCabins field', () => {
    it('returns error when totalCabins exceeds capacity', () => {
      const errors = validateShipForm({ ...baseValid, capacity: 500, totalCabins: 600 });
      expect(errors.totalCabins).toBeDefined();
    });

    it('passes when totalCabins equals capacity', () => {
      const errors = validateShipForm({ ...baseValid, capacity: 500, totalCabins: 500 });
      expect(errors.totalCabins).toBeUndefined();
    });
  });

  describe('crewCapacity field', () => {
    it('returns error when crewCapacity exceeds 2x passenger capacity', () => {
      const errors = validateShipForm({
        ...baseValid,
        capacity: 100,
        crewCapacity: 201,
      });
      expect(errors.crewCapacity).toBeDefined();
    });

    it('passes when crewCapacity equals exactly 2x passenger capacity', () => {
      const errors = validateShipForm({
        ...baseValid,
        capacity: 100,
        crewCapacity: 200,
      });
      expect(errors.crewCapacity).toBeUndefined();
    });
  });

  describe('manufacturingYear field (optional)', () => {
    it('returns error for year before 1900', () => {
      const errors = validateShipForm({ ...baseValid, manufacturingYear: 1899 });
      expect(errors.manufacturingYear).toBeDefined();
    });

    it('returns error for year more than 5 years in the future', () => {
      const futureYear = new Date().getFullYear() + 6;
      const errors = validateShipForm({ ...baseValid, manufacturingYear: futureYear });
      expect(errors.manufacturingYear).toBeDefined();
    });

    it('passes for empty manufacturingYear (optional field)', () => {
      const errors = validateShipForm({ ...baseValid, manufacturingYear: '' });
      expect(errors.manufacturingYear).toBeUndefined();
    });

    it('passes for valid year', () => {
      const errors = validateShipForm({ ...baseValid, manufacturingYear: 2020 });
      expect(errors.manufacturingYear).toBeUndefined();
    });
  });

  describe('maritime dimension rules', () => {
    it('returns error when length is less than or equal to beam', () => {
      const errors = validateShipForm({
        ...baseValid,
        lengthMeters: 30,
        beamMeters: 35,
      });
      expect(errors.lengthMeters).toBeDefined();
    });

    it('returns error when draft is greater than or equal to beam', () => {
      const errors = validateShipForm({
        ...baseValid,
        beamMeters: 30,
        draftMeters: 30,
      });
      expect(errors.draftMeters).toBeDefined();
    });

    it('passes when all dimensions are valid', () => {
      const errors = validateShipForm({
        ...baseValid,
        lengthMeters: 300,
        beamMeters: 40,
        draftMeters: 8,
      });
      expect(errors.lengthMeters).toBeUndefined();
      expect(errors.draftMeters).toBeUndefined();
    });

    it('skips dimension checks when fields are empty (optional)', () => {
      const errors = validateShipForm({
        ...baseValid,
        lengthMeters: '',
        beamMeters: '',
        draftMeters: '',
      });
      expect(errors.lengthMeters).toBeUndefined();
      expect(errors.draftMeters).toBeUndefined();
    });
  });

  it('returns no errors for a fully valid form', () => {
    const errors = validateShipForm(baseValid);
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// formatShipPayload — Data Transformation
// ────────────────────────────────────────────────────────────────────────────

describe('formatShipPayload', () => {
  it('uppercases and trims the code', () => {
    const result = formatShipPayload({ ...baseValid, code: '  ship-001  ' });
    expect(result.code).toBe('SHIP-001');
  });

  it('trims the name and operator', () => {
    const result = formatShipPayload({ ...baseValid, name: '  Sea Pearl  ', operator: '  Cruises  ' });
    expect(result.name).toBe('Sea Pearl');
    expect(result.operator).toBe('Cruises');
  });

  it('converts numeric string fields to numbers', () => {
    const result = formatShipPayload({ ...baseValid, capacity: 1000, crewCapacity: 300 });
    expect(typeof result.capacity).toBe('number');
    expect(typeof result.crewCapacity).toBe('number');
  });

  it('sets optional fields to undefined when empty', () => {
    const result = formatShipPayload({
      ...baseValid,
      manufacturingYear: '',
      lengthMeters: '',
      beamMeters: '',
      draftMeters: '',
    });
    expect(result.manufacturingYear).toBeUndefined();
    expect(result.lengthMeters).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// API Functions — Error Handling
// ────────────────────────────────────────────────────────────────────────────

describe('shipService API functions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getShips', () => {
    it('returns ships from API when backend responds with data', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { content: INITIAL_SHIPS } },
      });
      const result = await getShips();
      expect(result).toEqual(INITIAL_SHIPS);
    });

    it('falls back to INITIAL_SHIPS when API returns empty content', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: { success: true, data: { content: [] } },
      });
      const result = await getShips();
      expect(result).toEqual(INITIAL_SHIPS);
    });

    it('falls back to INITIAL_SHIPS when API call throws', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network Error'));
      const result = await getShips();
      expect(result).toEqual(INITIAL_SHIPS);
    });
  });

  describe('createShip', () => {
    it('returns created ship on successful API response', async () => {
      const mockShip = { ...INITIAL_SHIPS[0], id: 99 };
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: mockShip },
      });
      const result = await createShip(baseValid);
      expect(result).toEqual(mockShip);
    });

    it('throws when API rejects (duplicate code, server error, etc.)', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(new Error('Mã tàu đã tồn tại trong hệ thống'));
      await expect(createShip(baseValid)).rejects.toThrow('Mã tàu đã tồn tại trong hệ thống');
    });

    it('throws on 409 Conflict from server', async () => {
      const conflictError = Object.assign(new Error('Request failed with status code 409'), {
        response: { status: 409, data: { message: 'Conflict' } },
      });
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(conflictError);
      await expect(createShip(baseValid)).rejects.toThrow();
    });
  });

  describe('updateShip', () => {
    it('returns updated ship on successful API response', async () => {
      const mockShip = { ...INITIAL_SHIPS[0], name: 'Updated Name' };
      vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: { success: true, data: mockShip },
      });
      const result = await updateShip(1, baseValid);
      expect(result.name).toBe('Updated Name');
    });

    it('throws when API rejects (e.g. ship not found)', async () => {
      vi.spyOn(apiClient, 'put').mockRejectedValueOnce(new Error('Không tìm thấy tàu'));
      await expect(updateShip(999, baseValid)).rejects.toThrow('Không tìm thấy tàu');
    });

    it('calls PUT with the correct ship id', async () => {
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: { success: true, data: INITIAL_SHIPS[0] },
      });
      await updateShip(42, baseValid);
      expect(putSpy).toHaveBeenCalledWith('/itinerary/ships/42', expect.any(Object));
    });
  });
});
