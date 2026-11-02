import { describe, expect, it } from 'vitest';
import { canAccessPath, hasPermission, homeForRole, isKnownRole } from './accessControl';

describe('KAN-70 permission rules', () => {
  it.each([
    ['SYSTEM_ADMIN', '/users', true], ['OPERATIONS_MANAGER', '/users', false],
    ['ITINERARY_COORDINATOR', '/ships/1', true], ['POS_STAFF', '/ships/1', false],
    ['ACTIVITY_MANAGER', '/activities/1/attendance', true], ['ACTIVITY_MANAGER', '/excursions/1', false],
    ['SHORE_EXCURSION_MANAGER', '/excursions/1/roster', true], ['SHORE_EXCURSION_MANAGER', '/activities', false],
    ['POS_STAFF', '/pos', true], ['POS_STAFF', '/billing/settlement', false],
    ['FINANCE_FRONT_DESK', '/billing/settlement', true], ['FINANCE_FRONT_DESK', '/reports/operational', true],
    ['FINANCE_FRONT_DESK', '/pos', false], ['PASSENGER', '/passengers', false],
    ['SYSTEM_ADMIN', '/users-evil', false], ['SYSTEM_ADMIN', '/unknown-feature', false],
  ])('%s access to %s is %s', (role, path, expected) => {
    expect(canAccessPath(role, path)).toBe(expected);
  });

  it.each([null, undefined, '', 'ADMIN', 'STAFF', 'MANAGER', '__proto__', 'toString', 42])(
    'rejects unknown role %s without inherited object grants', role => {
      expect(isKnownRole(role)).toBe(false);
      expect(hasPermission(role, 'USERS_MANAGE')).toBe(false);
      expect(canAccessPath(role, '/users')).toBe(false);
    },
  );

  it.each(['SYSTEM_ADMIN', 'OPERATIONS_MANAGER', 'ITINERARY_COORDINATOR', 'ACTIVITY_MANAGER',
    'SHORE_EXCURSION_MANAGER', 'POS_STAFF', 'FINANCE_FRONT_DESK'])(
    'provides an authorized landing page for %s', role => {
      expect(canAccessPath(role, homeForRole(role))).toBe(true);
    },
  );

  it('separates read-only passenger roster and identity management permissions', () => {
    expect(hasPermission('ACTIVITY_MANAGER', 'PASSENGERS_READ')).toBe(true);
    expect(hasPermission('ACTIVITY_MANAGER', 'PASSENGERS_MANAGE')).toBe(false);
    expect(hasPermission('OPERATIONS_MANAGER', 'USERS_MANAGE')).toBe(false);
  });
});
