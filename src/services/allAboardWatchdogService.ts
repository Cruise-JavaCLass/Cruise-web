import { apiClient } from './api';

export interface MissingPassengerDto {
  passengerId: number;
  fullName: string;
  cabinNumber: string;
  rfidTag?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  currentStatus: 'DISEMBARKED_SHORE' | 'EMBARKED_SHIP';
  disembarkedAt: string;
  lastKnownLocation?: string;
  alertSent: boolean;
  lastAlertSentAt?: string;
}

export interface AllAboardStatusDto {
  tourId: number;
  portCallId: number;
  portName: string;
  allAboardTime: string;
  departureTime: string;
  secondsRemaining: number;
  countdownExpired: boolean;
  totalEmbarkedPassengers: number;
  passengersOnBoard: number;
  missingAshoreCount: number;
  aboardPercentage: number;
  missingPassengers: MissingPassengerDto[];
}

export interface UrgentAlertPayload {
  tourId: number;
  portCallId: number;
  passengerIds?: number[];
  sendSms: boolean;
  sendInAppNotification: boolean;
  broadcastPaSystem: boolean;
  customUrgentMessage?: string;
  dispatchedBy?: string;
}

export interface UrgentAlertResponse {
  alertBatchId: string;
  targetedPassengersCount: number;
  smsSentCount: number;
  inAppSentCount: number;
  paBroadcastTriggered: boolean;
  broadcastMessage: string;
  dispatchedAt: string;
  contactedPassengerIds: number[];
}

export const allAboardWatchdogService = {
  async getStatus(tourId: number, portCallId: number): Promise<AllAboardStatusDto> {
    const res = await apiClient.get<{ success: boolean; data: AllAboardStatusDto }>(
      '/api/operations/all-aboard-watchdog/status',
      {
        params: { tourId, portCallId },
      }
    );
    return res.data.data;
  },

  async dispatchAlert(payload: UrgentAlertPayload): Promise<UrgentAlertResponse> {
    const res = await apiClient.post<{ success: boolean; data: UrgentAlertResponse }>(
      '/api/operations/all-aboard-watchdog/dispatch-alert',
      payload
    );
    return res.data.data;
  },

  async recordGangwayScan(scan: {
    tourId: number;
    portCallId: number;
    passengerId?: number;
    rfidTag?: string;
    movementType: 'DISEMBARKED_SHORE' | 'EMBARKED_SHIP';
    gangwayTerminalId?: string;
  }) {
    const res = await apiClient.post('/api/operations/all-aboard-watchdog/gangway-scan', scan);
    return res.data.data;
  },
};
