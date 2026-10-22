import api from './api';
import type {
  GenerateVietQrRequest,
  VietQrPaymentResponse,
  BankWebhookPayload,
  WebhookProcessingResult,
  PaymentGatewayStatus,
} from './paymentGatewayTypes';

export const paymentGatewayService = {
  async generateVietQr(request: GenerateVietQrRequest): Promise<VietQrPaymentResponse> {
    const response = await api.post<{ success: boolean; data: VietQrPaymentResponse }>(
      '/api/pos/payments/vietqr/generate',
      request
    );
    return response.data.data;
  },

  async getPaymentStatus(reference: string): Promise<PaymentGatewayStatus> {
    const response = await api.get<{ success: boolean; data: PaymentGatewayStatus }>(
      `/api/pos/payments/orders/${reference}/status`
    );
    return response.data.data;
  },

  async simulateBankWebhook(payload: BankWebhookPayload): Promise<WebhookProcessingResult> {
    const response = await api.post<{ success: boolean; data: WebhookProcessingResult }>(
      '/api/pos/payments/webhook/bank-transfer',
      payload
    );
    return response.data.data;
  },
};
