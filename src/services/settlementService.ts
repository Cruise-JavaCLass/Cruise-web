import { apiClient } from './api';

export type PaymentMethod = 'CASH' | 'CREDIT_CARD';
export type FolioStatus = 'ACTIVE' | 'LOCKED' | 'SETTLED' | 'CLOSED';

export interface SettlementLineItem {
  description: string;
  serviceArea: string;
  postedAt: string;
  amount: number;
  isReversal: boolean;
}

export interface SettlementPreview {
  cabinNumber: string;
  primaryGuestName: string;
  currency: string;
  subtotal: number;
  reversalsTotal: number;
  discountTotal: number;
  taxTotal: number;
  gratuityTotal: number;
  netAmountDue: number;
  heldDisputeAmount: number;
  openDisputeCount: number;
  eligibleForSettlement: boolean;
  blockingReasons: string[];
  lineItems: SettlementLineItem[];
}

export interface SettleFolioRequest {
  paymentMethod: PaymentMethod;
  amountTendered: number;
  notes?: string;
  forceWithHold: boolean;
}

export interface Settlement {
  settlementUuid: string;
  invoiceNumber: string | null;
  cabinNumber: string;
  netAmount: number;
  amountTendered: number;
  changeGiven: number;
  paymentMethod: PaymentMethod;
  currency: string;
  settledAt: string;
  folioStatus: FolioStatus;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

const parseFileName = (disposition?: string): string | undefined => {
  if (!disposition) {
    return undefined;
  }
  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ''));
  }
  const plainMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
  const fileName = plainMatch?.[1]?.trim();
  return fileName ? fileName.replace(/^"|"$/g, '') : undefined;
};

export const getSettlementPreview = async (cabinNumber: string): Promise<SettlementPreview> => {
  const res = await apiClient.get<ApiResponse<SettlementPreview>>(
    `/pos/folios/${encodeURIComponent(cabinNumber)}/settlement-preview`,
  );
  return res.data.data;
};

export const settleFolio = async (
  cabinNumber: string,
  payload: SettleFolioRequest,
  idempotencyKey: string,
): Promise<Settlement> => {
  const res = await apiClient.post<ApiResponse<Settlement>>(
    `/pos/folios/${encodeURIComponent(cabinNumber)}/settle`,
    payload,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return res.data.data;
};

export const downloadInvoice = async (cabinNumber: string): Promise<Blob> => {
  const res = await apiClient.get<Blob>(`/pos/folios/${encodeURIComponent(cabinNumber)}/invoice`, {
    responseType: 'blob',
  });
  return res.data;
};

export const downloadInvoiceWithFileName = async (
  cabinNumber: string,
): Promise<{ blob: Blob; fileName: string }> => {
  const res = await apiClient.get<Blob>(`/pos/folios/${encodeURIComponent(cabinNumber)}/invoice`, {
    responseType: 'blob',
  });
  const rawDisposition = res.headers['content-disposition'];
  const disposition = typeof rawDisposition === 'string' ? rawDisposition : undefined;
  const fileName = parseFileName(disposition) ?? `INV-${cabinNumber}.pdf`;
  return { blob: res.data, fileName };
};

export const getSettlement = async (settlementUuid: string): Promise<Settlement> => {
  const res = await apiClient.get<ApiResponse<Settlement>>(
    `/pos/settlements/${encodeURIComponent(settlementUuid)}`,
  );
  return res.data.data;
};

export const newIdempotencyKey = (): string => crypto.randomUUID();
