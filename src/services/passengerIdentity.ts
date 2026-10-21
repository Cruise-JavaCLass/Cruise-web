/**
 * Helper to resolve the active passenger ID from URL params or stored session.
 * Order of precedence:
 * 1. URL search params: `passengerId` or `id`
 * 2. Session / local storage: `currentPassenger` (id or passengerId)
 * 3. Session / local storage: `currentUser` (passengerId)
 * 4. Session / local storage: direct `passengerId` key
 * 5. Optional fallback ID (if provided)
 *
 * Rejects non-numeric, null, empty or NaN values.
 */
export function resolvePassengerId(fallbackId?: number): number | null {
  // 1. Check URL search param (e.g. ?passengerId=5)
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('passengerId') || params.get('id');
    if (queryId !== null && queryId.trim() !== '') {
      const parsed = Number(queryId);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  // 2. Check session / local storage for authenticated passenger or user
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const storedPassenger =
        localStorage.getItem('currentPassenger') || sessionStorage.getItem('currentPassenger');
      if (storedPassenger) {
        const parsed = JSON.parse(storedPassenger);
        const candidate = parsed?.id ?? parsed?.passengerId;
        if (candidate !== null && candidate !== undefined && String(candidate).trim() !== '') {
          const num = Number(candidate);
          if (!Number.isNaN(num) && Number.isFinite(num) && num > 0) {
            return num;
          }
        }
      }

      const storedUser =
        localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const candidate = parsedUser?.passengerId;
        if (candidate !== null && candidate !== undefined && String(candidate).trim() !== '') {
          const num = Number(candidate);
          if (!Number.isNaN(num) && Number.isFinite(num) && num > 0) {
            return num;
          }
        }
      }

      const directId = localStorage.getItem('passengerId') || sessionStorage.getItem('passengerId');
      if (directId !== null && directId.trim() !== '') {
        const num = Number(directId);
        if (!Number.isNaN(num) && Number.isFinite(num) && num > 0) {
          return num;
        }
      }
    } catch {
      // Storage parsing failed, continue to fallback
    }
  }

  return fallbackId !== undefined && !Number.isNaN(fallbackId) ? fallbackId : null;
}
