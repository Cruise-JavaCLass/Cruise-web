import type { StaffRole } from './authService';

// Keep these names aligned with Cruise-api RolePermissions (KAN-67).
export const PERMISSIONS = [
  'USERS_MANAGE', 'SECURITY_AUDIT_READ', 'TERMINALS_MANAGE',
  'ITINERARY_READ', 'ITINERARY_MANAGE', 'ACTIVITIES_READ', 'ACTIVITIES_MANAGE',
  'EXCURSIONS_READ', 'EXCURSIONS_MANAGE', 'PASSENGERS_READ', 'PASSENGERS_MANAGE',
  'POS_READ', 'POS_OPERATE', 'FINANCE_MANAGE', 'REPORTS_READ', 'OPERATIONS_MANAGE', 'CATALOG_READ',
] as const;
export type Permission = typeof PERMISSIONS[number];

const grants: Record<StaffRole, readonly Permission[]> = {
  SYSTEM_ADMIN: PERMISSIONS,
  OPERATIONS_MANAGER: PERMISSIONS.filter(p => !['USERS_MANAGE', 'SECURITY_AUDIT_READ', 'TERMINALS_MANAGE'].includes(p)),
  ITINERARY_COORDINATOR: ['ITINERARY_READ', 'ITINERARY_MANAGE', 'CATALOG_READ'],
  ACTIVITY_MANAGER: ['ITINERARY_READ', 'ACTIVITIES_READ', 'ACTIVITIES_MANAGE', 'PASSENGERS_READ', 'CATALOG_READ'],
  SHORE_EXCURSION_MANAGER: ['ITINERARY_READ', 'EXCURSIONS_READ', 'EXCURSIONS_MANAGE', 'PASSENGERS_READ', 'CATALOG_READ'],
  POS_STAFF: ['ITINERARY_READ', 'POS_READ', 'POS_OPERATE', 'PASSENGERS_READ'],
  FINANCE_FRONT_DESK: ['ITINERARY_READ', 'POS_READ', 'FINANCE_MANAGE', 'REPORTS_READ', 'PASSENGERS_READ', 'PASSENGERS_MANAGE'],
  PASSENGER: ['ITINERARY_READ', 'CATALOG_READ'],
};

export function isKnownRole(role: unknown): role is StaffRole {
  return typeof role === 'string' && Object.hasOwn(grants, role);
}

export function hasPermission(role: unknown, permission: Permission): boolean {
  return isKnownRole(role) && grants[role].includes(permission);
}

export function homeForRole(role: unknown): string {
  switch (role) {
    case 'SYSTEM_ADMIN': case 'OPERATIONS_MANAGER': return '/';
    case 'ITINERARY_COORDINATOR': return '/itinerary';
    case 'ACTIVITY_MANAGER': return '/activities';
    case 'SHORE_EXCURSION_MANAGER': return '/excursions';
    case 'POS_STAFF': return '/pos';
    case 'FINANCE_FRONT_DESK': return '/billing/settlement';
    default: return '/login';
  }
}

const routeRules: [RegExp, Permission][] = [
  [/^\/$/, 'OPERATIONS_MANAGE'],
  [/^\/users(?:\/|$)/i, 'USERS_MANAGE'],
  [/^\/(?:ships|itinerary)(?:\/|$)/i, 'ITINERARY_MANAGE'],
  [/^\/admin\/cruise-area-policies(?:\/|$)/i, 'ITINERARY_MANAGE'],
  [/^\/voyage(?:\/|$)/i, 'OPERATIONS_MANAGE'],
  [/^\/(?:excursions|excursion-attendance|excursion-dispatcher|excursion-analytics)(?:\/|$)/i, 'EXCURSIONS_MANAGE'],
  [/^\/(?:activities|activity-attendance|activity-roster)(?:\/|$)/i, 'ACTIVITIES_MANAGE'],
  [/^\/pos(?:\/|$)/i, 'POS_OPERATE'],
  [/^\/passengers(?:\/|$)/i, 'PASSENGERS_READ'],
  [/^\/embarkation(?:\/|$)/i, 'PASSENGERS_MANAGE'],
  [/^\/(?:billing\/settlement|provider-settlement)(?:\/|$)/i, 'FINANCE_MANAGE'],
  [/^\/reports\/operational(?:\/|$)/i, 'REPORTS_READ'],
];

/** UI convenience only: the backend verifies every request independently. */
export function canAccessPath(role: unknown, path: string): boolean {
  if (!isKnownRole(role) || role === 'PASSENGER') return false;
  if (path.toLowerCase() === '/forbidden') return true;
  const permission = routeRules.find(([pattern]) => pattern.test(path))?.[1];
  return permission !== undefined && hasPermission(role, permission);
}
