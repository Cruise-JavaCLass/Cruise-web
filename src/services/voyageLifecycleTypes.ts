export type VoyageOperationalPhase =
  | 'PLANNING'
  | 'EMBARKING'
  | 'AT_SEA'
  | 'PORT_VISIT'
  | 'DEBARKING'
  | 'CLOSED';

export interface VoyageLifecycleState {
  id: number;
  voyageNumber: string;
  shipId: string;
  itineraryName: string;
  currentPhase: VoyageOperationalPhase;
  currentPortName?: string;
  currentTimezone: string;
  vesselClockOffsetMinutes: number;
  clockSyncEnabled: boolean;
  phaseTransitionedAt: string;
  transitionedBy: string;
  transitionReason?: string;
  taxExemptionActive: boolean;
  casinoOpen: boolean;
  createdAt: string;
}

export interface CreateVoyageStateRequest {
  voyageNumber: string;
  shipId: string;
  itineraryName: string;
  initialPhase?: VoyageOperationalPhase;
  initialTimezone?: string;
  currentPortName?: string;
}

export interface TransitionVoyagePhaseRequest {
  targetPhase: VoyageOperationalPhase;
  transitionReason?: string;
  currentPortName?: string;
}

export interface SyncPortTimezoneRequest {
  portName: string;
  timezone: string;
  clockOffsetMinutes?: number;
  adjustmentReason?: string;
}

export interface TimezoneShiftScheduleItem {
  portName: string;
  timezone: string;
  clockOffsetMinutes: number;
  scheduledTransitionTime: string;
  status: string;
}

export interface TimezoneShiftScheduleResponse {
  voyageNumber: string;
  currentTimezone: string;
  currentOffsetMinutes: number;
  currentShipClockTime: string;
  plannedPortShifts: TimezoneShiftScheduleItem[];
}
