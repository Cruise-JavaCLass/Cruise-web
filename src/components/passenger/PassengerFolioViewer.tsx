import React from 'react';
import { Receipt } from 'lucide-react';
import type { FolioStatus } from '../../services/settlementService';
import { InvoiceDownloadButton } from './InvoiceDownloadButton';

interface PassengerFolioViewerProps {
  cabinNumber: string;
  primaryGuestName?: string;
  invoiceNumber?: string;
  folioStatus?: FolioStatus;
}

export const PassengerFolioViewer: React.FC<PassengerFolioViewerProps> = ({
  cabinNumber,
  primaryGuestName,
  invoiceNumber,
  folioStatus = 'ACTIVE',
}) => {
  const isSettled = folioStatus === 'SETTLED' || folioStatus === 'CLOSED';

  return (
    <section
      aria-label={`Folio của cabin ${cabinNumber}`}
      className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Receipt className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Folio của tôi</h3>
      </div>

      <div className="text-xs text-slate-400 space-y-1">
        <p>
          Cabin: <span className="font-mono text-slate-200">{cabinNumber}</span>
        </p>
        {primaryGuestName && (
          <p>
            Khách chính: <span className="text-slate-200">{primaryGuestName}</span>
          </p>
        )}
        <p>
          Trạng thái:{' '}
          <span className="font-mono text-slate-200">
            {isSettled ? 'Đã tất toán' : folioStatus}
          </span>
        </p>
      </div>

      <div className="border-t border-white/5 pt-4 space-y-2">
        <h4 className="text-xs font-semibold text-white">Hoá đơn của tôi</h4>
        {isSettled ? (
          <InvoiceDownloadButton
            cabinNumber={cabinNumber}
            invoiceNumber={invoiceNumber}
          />
        ) : (
          <p className="text-xs text-slate-400">
            Chưa tất toán — vui lòng thanh toán tại quầy lễ tân.
          </p>
        )}
      </div>
    </section>
  );
};
