import { apiClient } from './api';
import type {
  IdentifyPassengerRequest,
  PassengerIdentificationResponse,
  CredentialManifestCacheResponse,
} from './posAuthTypes';

const MANIFEST_CACHE_KEY = 'pos_credential_manifest_cache';

export const posAuthService = {
  async identify(request: IdentifyPassengerRequest): Promise<PassengerIdentificationResponse> {
    try {
      const response = await apiClient.post<{ success: boolean; data: PassengerIdentificationResponse }>(
        '/api/pos/auth/identify',
        request
      );
      return response.data.data;
    } catch (err: unknown) {
      // Check offline local manifest cache if offline or network error
      const cached = posAuthService.lookupOfflineCache(request.rawCredential);
      if (cached) {
        return cached;
      }
      throw err;
    }
  },

  async syncManifestCache(): Promise<CredentialManifestCacheResponse> {
    const response = await apiClient.get<{ success: boolean; data: CredentialManifestCacheResponse }>(
      '/api/pos/auth/manifest/cache'
    );
    const data = response.data.data;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify(data));
    }
    return data;
  },

  lookupOfflineCache(rawCredential: string): PassengerIdentificationResponse | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(MANIFEST_CACHE_KEY);
      if (!raw) return null;
      const parsed: CredentialManifestCacheResponse = JSON.parse(raw);
      if (!parsed || !parsed.credentials) return null;

      const cleanToken = rawCredential.replace(/^(QR:|CARD:|RFID:)/i, '').trim();
      const match = parsed.credentials.find(
        (c) => c.identifier.toLowerCase() === cleanToken.toLowerCase()
      );
      if (!match) return null;

      return {
        passengerId: match.passengerId,
        fullName: match.fullName,
        cabinNumber: match.cabinNumber,
        photoUrl: match.photoUrl,
        credentialType: match.credentialType,
        maskedIdentifier: match.identifier.length > 4
          ? '*'.repeat(match.identifier.length - 4) + match.identifier.slice(-4)
          : '****',
        credentialStatus: match.status,
        folioStatus: 'ACTIVE',
        creditLimit: 2000,
        currentBalance: 0,
        availableLimit: 2000,
        individualSpendingLimit: match.individualSpendingLimit,
        spendingAllowed: match.spendingAllowed,
        alcoholRestricted: match.alcoholRestricted,
        isMinor: match.isMinor,
      };
    } catch {
      return null;
    }
  },
};
