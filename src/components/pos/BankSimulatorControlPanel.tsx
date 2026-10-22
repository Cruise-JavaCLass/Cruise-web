import React, { useState } from 'react';
import { paymentGatewayService } from '../../services/paymentGatewayService';

interface BankSimulatorControlPanelProps {
  currentPaymentRef?: string;
  defaultAmount?: number;
  onSimulationComplete?: () => void;
}

export const BankSimulatorControlPanel: React.FC<BankSimulatorControlPanelProps> = ({
  currentPaymentRef = '',
  defaultAmount = 1500000,
  onSimulationComplete,
}) => {
  const [paymentRef, setPaymentRef] = useState(currentPaymentRef);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [isTriggering, setIsTriggering] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleTriggerWebhook = async (status: 'SUCCESS' | 'FAILED') => {
    if (!paymentRef.trim()) {
      setResultMessage('Vui lòng nhập Payment Reference');
      return;
    }

    setIsTriggering(true);
    setResultMessage(null);

    try {
      const result = await paymentGatewayService.simulateBankWebhook({
        paymentReference: paymentRef.trim(),
        transactionId: `SIM-TX-${Date.now()}`,
        amount,
        status,
        bankCode: '970436',
        description: `SIMULATED WEBHOOK FOR ${paymentRef}`,
      });

      setResultMessage(
        `✓ Phản hồi từ cổng: ${result.message} (Folio Settled: ${result.folioSettled ? 'Có' : 'Không'})`
      );
      if (onSimulationComplete) onSimulationComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi gửi webhook giả lập';
      setResultMessage(`❌ Thất bại: ${msg}`);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <h3 className="font-bold text-gray-900 text-sm">
            Mock Bank Webhook Sandbox Simulator (VietQR)
          </h3>
        </div>
        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
          Sandbox Tool
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Payment Reference
          </label>
          <input
            type="text"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="PAY-xxxxxx"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Số Tiền Chuyển Khoản (VND)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {resultMessage && (
        <div
          className={`rounded-xl p-3 text-xs font-medium ${
            resultMessage.startsWith('✓')
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {resultMessage}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={isTriggering}
          onClick={() => void handleTriggerWebhook('FAILED')}
          className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition"
        >
          Giả Lập Giao Dịch Thất Bại
        </button>
        <button
          type="button"
          disabled={isTriggering}
          onClick={() => void handleTriggerWebhook('SUCCESS')}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {isTriggering ? 'Đang gửi...' : '⚡ Bắn Webhook Thành Công Tức Thì'}
        </button>
      </div>
    </div>
  );
};
