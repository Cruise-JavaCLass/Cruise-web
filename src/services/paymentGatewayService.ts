import { apiClient } from './api';
import type {
  GenerateVietQrRequest,
  VietQrPaymentResponse,
  BankWebhookPayload,
  WebhookProcessingResult,
  PaymentGatewayStatus,
} from './paymentGatewayTypes';

export const paymentGatewayService = {
  async generateVietQr(request: GenerateVietQrRequest): Promise<VietQrPaymentResponse> {
    const response = await apiClient.post<{ success: boolean; data: VietQrPaymentResponse }>(
      '/pos/payments/vietqr/generate',
      request
    );
    return response.data.data;
  },

  async getPaymentStatus(reference: string): Promise<PaymentGatewayStatus> {
    const response = await apiClient.get<{ success: boolean; data: PaymentGatewayStatus }>(
      `/pos/payments/orders/${encodeURIComponent(reference)}/status`
    );
    return response.data.data;
  },

  async simulateBankWebhook(payload: BankWebhookPayload): Promise<WebhookProcessingResult> {
    const response = await apiClient.post<{ success: boolean; data: WebhookProcessingResult }>(
      '/pos/payments/webhook/bank-transfer',
      payload
    );
    return response.data.data;
  },
};
