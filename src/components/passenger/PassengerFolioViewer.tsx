import React, { useState } from 'react';
import { CreditCard, Receipt, Clock, FileQuestion } from 'lucide-react';
import type { FolioStatus } from '../../services/settlementService';
import { type GuestFolioItem, type DisputeCase } from '../../services/reconciliationService';
import { InvoiceDownloadButton } from './InvoiceDownloadButton';
import { PassengerDisputeModal } from './PassengerDisputeModal';

interface PassengerFolioViewerProps {
  cabinNumber: string;
  passengerName?: string;
  primaryGuestName?: string;
  invoiceNumber?: string;
  folioStatus?: FolioStatus;
}

export const PassengerFolioViewer: React.FC<PassengerFolioViewerProps> = ({
  cabinNumber,
  passengerName,
  primaryGuestName,
  invoiceNumber,
  folioStatus = 'ACTIVE',
}) => {
  const isSettled = folioStatus === 'SETTLED' || folioStatus === 'CLOSED';
  const effectivePassengerName = passengerName || primaryGuestName || 'Hành khách';

  const [selectedItemForDispute, setSelectedItemForDispute] = useState<GuestFolioItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [disputedTransactions, setDisputedTransactions] = useState<Record<string, DisputeCase>>({
    'TX-9842': {
      id: 1,
      disputeNumber: 'DISP-8812',
      transactionId: 'TX-9842',
      folioId: 'FOLIO-402',
      cabinNumber,
      passengerName: effectivePassengerName,
      reason: 'DUPLICATE_BILLING',
      disputeAmount: 45.0,
      passengerNote: 'Quét thẻ 2 lần tại Sky Bar',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    },
  });

  const [folioItems] = useState<GuestFolioItem[]>([
    {
      id: '1',
      transactionId: 'TX-9842',
      folioId: 'FOLIO-402',
      cabinNumber,
      passengerName: effectivePassengerName,
      description: 'Sky Bar & Cocktail Lounge - 2x Mojito & Snacks',
      serviceArea: 'Sky Bar',
      amount: 45.0,
      isReversal: false,
      postedAt: '19:15 - Hôm nay',
    },
    {
      id: '2',
      transactionId: 'TX-9841',
      folioId: 'FOLIO-402',
      cabinNumber,
      passengerName: effectivePassengerName,
      description: 'Lotus Wellness Spa - Massage Trị Liệu Thụy Điển',
      serviceArea: 'Lotus Spa',
      amount: 120.0,
      isReversal: false,
      postedAt: '18:50 - Hôm nay',
    },
    {
      id: '3',
      transactionId: 'TX-9839',
      folioId: 'FOLIO-402',
      cabinNumber,
      passengerName: effectivePassengerName,
      description: 'Cửa Hàng Miễn Thuế Duty-Free - Nước Hoa & Kính Mát',
      serviceArea: 'Duty-Free',
      amount: 210.0,
      isReversal: false,
      postedAt: '17:40 - Hôm nay',
    },
    {
      id: '4',
      transactionId: 'TX-9820',
      folioId: 'FOLIO-402',
      cabinNumber,
      passengerName: effectivePassengerName,
      description: 'Nhà Hàng Đại Dương Le Gourmet - Rượu Vang Bordeaux',
      serviceArea: 'Le Gourmet',
      amount: 85.0,
      isReversal: false,
      postedAt: '12:30 - Hôm nay',
    },
  ]);

  const totalSpent = folioItems.reduce((acc, item) => acc + item.amount, 0);

  const handleOpenDispute = (item: GuestFolioItem) => {
    setSelectedItemForDispute(item);
    setIsModalOpen(true);
  };

  const handleDisputeSuccess = (createdDispute: DisputeCase) => {
    setDisputedTransactions((prev) => ({
      ...prev,
      [createdDispute.transactionId]: createdDispute,
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Folio Summary Top Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0c1427]/80 via-[#030712] to-[#040817] border border-cyan-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Sao Kê Chi Tiêu Phòng (Guest Folio)
            </h3>
            <p className="text-xs text-slate-400">
              {cabinNumber} • Khách hàng:{' '}
              <span className="text-cyan-300">{effectivePassengerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-baseline gap-2 bg-white/[0.03] border border-white/5 px-4 py-2.5 rounded-2xl">
            <span className="text-xs text-slate-400">Tổng dư nợ tạm tính:</span>
            <span className="text-lg font-black font-mono text-emerald-400">
              ${totalSpent.toFixed(2)} USD
            </span>
          </div>

          <div className="bg-white/[0.03] border border-white/5 px-4 py-2.5 rounded-2xl">
            <span className="text-xs text-slate-400 mr-2">Trạng thái:</span>
            <span className="font-mono text-xs font-semibold text-slate-200">
              {isSettled ? 'Đã tất toán' : folioStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Download section */}
      <div className="bg-[#030303]/60 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-semibold text-white">Hoá đơn của tôi</h4>
          <p className="text-xs text-slate-400">
            {isSettled
              ? 'Tải hoá đơn điện tử PDF lưu thông tin quyết toán chi tiêu.'
              : 'Chưa tất toán — vui lòng thanh toán tại quầy lễ tân để xuất hoá đơn.'}
          </p>
        </div>
        {isSettled ? (
          <InvoiceDownloadButton
            key={cabinNumber}
            cabinNumber={cabinNumber}
            invoiceNumber={invoiceNumber}
          />
        ) : null}
      </div>

      {/* Transaction List */}
      <div className="bg-[#030303]/60 border border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" /> Chi Tiết Các Khoản Quẹt Thẻ Trên Tàu
          </span>
          <span className="text-[11px] text-slate-500">{folioItems.length} Giao dịch ghi nhận</span>
        </div>

        <div className="divide-y divide-white/5">
          {folioItems.map((item) => {
            const dispute = disputedTransactions[item.transactionId];
            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.description}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                      {item.transactionId}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>{item.serviceArea}</span>
                    <span>•</span>
                    <span>{item.postedAt}</span>
                  </div>

                  {dispute && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300 mt-1">
                      <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                      <span>
                        Đang khiếu nại #{dispute.disputeNumber} (
                        {dispute.status === 'SUBMITTED' ? 'Chờ Purser duyệt' : 'Đã duyệt hoàn tiền'}
                        )
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="text-sm font-bold font-mono text-white">
                    ${item.amount.toFixed(2)} USD
                  </span>

                  {dispute ? (
                    <span className="text-[11px] font-medium text-amber-400/90 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      Đang xử lý
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenDispute(item)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 px-3 py-1.5 rounded-xl border border-white/10 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all cursor-pointer"
                    >
                      <FileQuestion className="w-3.5 h-3.5" />
                      Khiếu nại
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PassengerDisputeModal
        key={selectedItemForDispute?.transactionId ?? 'no-item'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItemForDispute}
        onSuccess={handleDisputeSuccess}
      />
    </div>
  );
};
