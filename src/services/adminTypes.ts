export type PosTerminalStatus = 'PROVISIONED' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'WIPED';

export interface PosTerminal {
  id: number;
  deviceId: string;
  deviceName: string;
  stationId: string;
  ipAddress?: string;
  macAddress?: string;
  status: PosTerminalStatus;
  apiKeyPrefix?: string;
  certificateFingerprint?: string;
  certificateExpiry?: string;
  tokenVersion: number;
  lastSeenAt?: string;
  firmwareVersion?: string;
  remoteWipeCommand?: string;
  remoteWipeRequestedAt?: string;
  remoteWipeAcknowledgedAt?: string;
  createdAt: string;
}

export interface ProvisionTerminalRequest {
  deviceId: string;
  deviceName: string;
  stationId: string;
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion?: string;
  certificateFingerprint?: string;
}

export interface ProvisionTerminalResponse {
  terminal: PosTerminal;
  rawApiKey?: string;
  clientCertificatePem?: string;
  certificateExpiry?: string;
  message: string;
}

export interface RotateKeyRequest {
  reason?: string;
}

export interface RevokeTerminalRequest {
  reason?: string;
}

export interface RenewCertificateRequest {
  customExpiry?: string;
  csrPem?: string;
}

export interface CertificateRenewalResponse {
  deviceId: string;
  clientCertificatePem: string;
  certificateFingerprint: string;
  certificateExpiry: string;
  message: string;
}

export interface RemoteWipeRequest {
  reason: string;
}

export interface SystemAuditLog {
  id: number;
  category: string;
  action: string;
  actor: string;
  targetResource?: string;
  targetId?: string;
  ipAddress?: string;
  reason?: string;
  payloadBefore?: string;
  payloadAfter?: string;
  immutableHash: string;
  createdAt: string;
}

export interface SystemAuditLogQuery {
  category?: string;
  action?: string;
  actor?: string;
  targetId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}
