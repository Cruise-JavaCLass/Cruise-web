import { apiClient } from './api';

export interface PassengerEmbarkationProfile {
  id: number;
  tourId: number;
  bookingCode?: string;
  fullName: string;
  passportNumber?: string;
  nationality?: string;
  emergencyContact?: string;
  email?: string;
  phoneNumber?: string;
  cabinNumber: string;
  cabinCategory?: string;
  isVip?: boolean;
  healthDeclarationCompleted?: boolean;
  rfidTag?: string;
  qrCode?: string;
  tourPackage?: string;
  bleZone?: string;
  folioStatus?: string;
  checkInStatus: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'BOARDED';
  boardedAt?: string;
}

export interface EmbarkationCheckInPayload {
  staffId?: string;
  terminalDeviceId?: string;
  rfidTag?: string;
  gateLane?: string;
  verificationMethod?: string;
}

export interface EmbarkationCheckInResult {
  passengerId: number;
  checkInStatus: string;
  boardedAt: string;
  rfidTag: string;
  cabinNumber: string;
  folioStatus: string;
  message: string;
}

export interface BindRfidPayload {
  rfidTag: string;
  qrCode?: string;
  activateFolio?: boolean;
}

export interface BindRfidResult {
  passengerId: number;
  rfidTag: string;
  qrCode?: string;
  cabinNumber: string;
  folioStatus: string;
  message: string;
}

export interface EmbarkationSummary {
  tourId: number;
  expectedTotal: number;
  boardedCount: number;
  remainingCount: number;
  boardingProgressPercent: number;
  categoryBreakdown: Record<string, number>;
  vipTotal: number;
  vipBoarded: number;
}

export interface HealthDeclarationPayload {
  healthDeclarationCompleted: boolean;
  hasHealthSymptoms: boolean;
}

const isMockEnabled = (): boolean => {
  return (
    import.meta.env.VITE_EMBARKATION_MOCK === 'true' ||
    import.meta.env.VITE_USE_MOCK_DATA === 'true'
  );
};

export const embarkationService = {
  async submitHealthDeclaration(
    passengerId: number,
    payload: HealthDeclarationPayload
  ): Promise<PassengerEmbarkationProfile> {
    try {
      const response = await apiClient.post<PassengerEmbarkationProfile>(
        `/activities/passengers/${passengerId}/embarkation/health-declaration`,
        payload
      );
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Empty response from health declaration');
    } catch (error) {
      if (!isMockEnabled()) {
        throw error;
      }
      return {
        id: passengerId,
        tourId: 1,
        fullName: 'Nguyễn Văn An',
        cabinNumber: 'Suite-801',
        healthDeclarationCompleted: payload.healthDeclarationCompleted,
        checkInStatus: 'NOT_CHECKED_IN',
      };
    }
  },

  async lookupPassenger(keyword: string): Promise<PassengerEmbarkationProfile> {
    try {
      const response = await apiClient.get<PassengerEmbarkationProfile>(
        `/activities/passengers/embarkation/lookup?keyword=${encodeURIComponent(keyword)}`
      );
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Empty response from passenger lookup');
    } catch (error) {
      if (!isMockEnabled()) {
        throw error;
      }
    }

    // High fidelity fallback mock
    return {
      id: 1,
      tourId: 1,
      bookingCode: keyword.toUpperCase().includes('BK') ? keyword.toUpperCase() : 'BK-202688',
      fullName: 'Nguyễn Văn An',
      passportNumber: keyword.startsWith('B') || keyword.startsWith('C') ? keyword : 'B9827361',
      nationality: 'Việt Nam',
      emergencyContact: '+84 912 345 678 (Vợ: Trần Thị Mai)',
      email: 'an.nguyen@example.com',
      phoneNumber: '0901234567',
      cabinNumber: 'Suite-801',
      cabinCategory: 'Royal Suite',
      isVip: true,
      healthDeclarationCompleted: true,
      rfidTag: 'RFID-VIP-8899',
      qrCode: 'CRUISE-PASS-8899',
      tourPackage: 'Royal Luxury All-Inclusive',
      bleZone: 'Zone VIP Deck 8',
      folioStatus: 'INACTIVE',
      checkInStatus: 'NOT_CHECKED_IN',
    };
  },

  async processCheckIn(
    passengerId: number,
    payload: EmbarkationCheckInPayload
  ): Promise<EmbarkationCheckInResult> {
    try {
      const response = await apiClient.post<EmbarkationCheckInResult>(
        `/activities/passengers/${passengerId}/embarkation/check-in`,
        payload
      );
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Empty response from check-in');
    } catch (error) {
      if (!isMockEnabled()) {
        throw error;
      }
    }

    return {
      passengerId,
      checkInStatus: 'BOARDED',
      boardedAt: new Date().toISOString(),
      rfidTag: payload.rfidTag || 'RFID-TAG-MOCK',
      cabinNumber: 'Suite-801',
      folioStatus: 'ACTIVE',
      message: 'Làm thủ tục lên tàu thành công',
    };
  },

  async bindRfid(passengerId: number, payload: BindRfidPayload): Promise<BindRfidResult> {
    try {
      const response = await apiClient.post<BindRfidResult>(
        `/activities/passengers/${passengerId}/embarkation/bind-rfid`,
        payload
      );
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Empty response from bind-rfid');
    } catch (error) {
      if (!isMockEnabled()) {
        throw error;
      }
    }

    return {
      passengerId,
      rfidTag: payload.rfidTag,
      qrCode: payload.qrCode || `QR-${payload.rfidTag}`,
      cabinNumber: 'Suite-801',
      folioStatus: 'ACTIVE',
      message: 'Gán thẻ RFID và kích hoạt Folio thành công',
    };
  },

  async getEmbarkationSummary(tourId: number): Promise<EmbarkationSummary> {
    try {
      const response = await apiClient.get<EmbarkationSummary>(
        `/activities/passengers/embarkation/summary?tourId=${tourId}`
      );
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Empty response from embarkation summary');
    } catch (error) {
      if (!isMockEnabled()) {
        throw error;
      }
    }

    return {
      tourId,
      expectedTotal: 120,
      boardedCount: 94,
      remainingCount: 26,
      boardingProgressPercent: 78.3,
      categoryBreakdown: {
        'Royal Suite': 18,
        'Balcony Stateroom': 45,
        'Oceanview Stateroom': 32,
        'Standard Stateroom': 25,
      },
      vipTotal: 22,
      vipBoarded: 20,
    };
  },

  async exportBorderControlManifest(tourId: number): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(
        `/activities/passengers/embarkation/manifest/export?tourId=${tourId}`,
        { responseType: 'blob' }
      );
      if (response && response.data) {
        return response.data;
      }
      throw new Error('Empty response from export manifest');
    } catch (error) {
      if (!isMockEnabled()) {
        throw error;
      }
    }

    const mockCsv =
      '\ufeffID,BookingCode,FullName,PassportNumber,Nationality,CabinNumber,CabinCategory,VIP,HealthDeclaration,RFIDTag,CheckInStatus,BoardedAt,FolioStatus\n' +
      '1,BK-202688,Nguyễn Văn An,B9827361,Việt Nam,Suite-801,Royal Suite,YES,YES,RFID-VIP-8899,BOARDED,2026-10-21T10:30:00Z,ACTIVE\n';
    return new Blob([mockCsv], { type: 'text/csv;charset=utf-8' });
  },
};
