export type PaymentGatewayStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface GenerateVietQrRequest {
  cabinNumber: string;
  passengerId?: number;
  amount: number;
  description?: string;
  idempotencyKey?: string;
}

export interface VietQrPaymentResponse {
  paymentReference: string;
  cabinNumber: string;
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  description: string;
  qrCodeText: string;
  qrImageUrl: string;
  status: PaymentGatewayStatus;
  expiresAt: string;
}

export interface BankWebhookPayload {
  paymentReference: string;
  transactionId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  bankCode?: string;
  description?: string;
}

export interface WebhookProcessingResult {
  paymentReference: string;
  paymentStatus: PaymentGatewayStatus;
  folioSettled: boolean;
  message: string;
  processedAt: string;
}
