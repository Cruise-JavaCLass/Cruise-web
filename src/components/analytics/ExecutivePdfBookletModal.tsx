import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Mail,
  Download,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { VoyageFinancialClosure } from '../../services/voyageAnalyticsTypes';
import { voyageAnalyticsService } from '../../services/voyageAnalyticsService';

interface ExecutivePdfBookletModalProps {
  isOpen: boolean;
  onClose: () => void;
  voyage: VoyageFinancialClosure | null;
}

export const ExecutivePdfBookletModal: React.FC<ExecutivePdfBookletModalProps> = ({
  isOpen,
  onClose,
  voyage,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [executiveNote, setExecutiveNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionGeneration = useRef(0);
  const requestGeneration = useRef(0);

  useEffect(() => {
    sessionGeneration.current += 1;
    requestGeneration.current += 1;
    setLoading(false);
    setSuccessMsg(null);
    setError(null);
  }, [isOpen, voyage?.voyageNumber]);

  if (!isOpen || !voyage) return null;

  const handleDownloadPdf = () => {
    const url = voyageAnalyticsService.getPdfBookletUrl(voyage.voyageNumber);
    window.open(url, '_blank');
  };

  const handleDispatchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const dispatchSession = sessionGeneration.current;
    const dispatchRequest = ++requestGeneration.current;
    try {
      setLoading(true);
      setError(null);
      await voyageAnalyticsService.dispatchEmail(voyage.voyageNumber, {
        recipientEmail,
        executiveNote: executiveNote || undefined,
      });
      if (
        sessionGeneration.current !== dispatchSession ||
        requestGeneration.current !== dispatchRequest
      ) return;
      setSuccessMsg(`Executive booklet successfully sent to ${recipientEmail}`);
      setRecipientEmail('');
      setExecutiveNote('');
    } catch (err: unknown) {
      if (
        sessionGeneration.current !== dispatchSession ||
        requestGeneration.current !== dispatchRequest
      ) return;
      setError(err instanceof Error ? err.message : 'Failed to dispatch email');
    } finally {
      if (
        sessionGeneration.current === dispatchSession &&
        requestGeneration.current === dispatchRequest
      ) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E0D7] flex flex-col space-y-4 text-xs text-[#252B32]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D7]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102A43]">
                Executive Audit Booklet & Dispatch
              </h3>
              <p className="text-[#252B32]/70 text-[11px]">
                Voyage: <strong>{voyage.voyageNumber}</strong> ({voyage.itineraryName})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#F7F4ED] rounded-lg text-[#252B32]/60 hover:text-[#102A43] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Summary Card */}
        <div className="bg-[#F7F4ED]/60 p-3.5 rounded-xl border border-[#E5E0D7] grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-[#252B32]/60">Actual Net Revenue:</span>
            <div className="font-bold text-emerald-700 text-sm">
              ${Number(voyage.actualNetRevenue).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-[#252B32]/60">RevPCD / Occupancy:</span>
            <div className="font-bold text-[#102A43] text-sm">
              ${Number(voyage.revenuePerPassengerCruiseDay).toFixed(2)} ({voyage.occupancyPercentage}%)
            </div>
          </div>
        </div>

        {/* Action 1: Direct Download */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-[#102A43]">1. Direct PDF Booklet Download</label>
          <button
            onClick={handleDownloadPdf}
            className="w-full py-2.5 px-4 bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] text-[#102A43] font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#102A43]" />
            Download Post-Voyage Audit Booklet (.PDF)
            <ExternalLink className="w-3.5 h-3.5 text-[#252B32]/60" />
          </button>
        </div>

        {/* Action 2: Email Dispatch */}
        <form onSubmit={handleDispatchEmail} className="space-y-3 pt-2 border-t border-[#E5E0D7]">
          <label className="block font-semibold text-[#102A43] flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-[#397C80]" /> 2. Dispatch to Corporate Executive Board
          </label>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <input
              type="email"
              required
              placeholder="e.g. cfo@cruiseline.com, vp_ops@cruiseline.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full p-2.5 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>

          <div>
            <textarea
              rows={2}
              placeholder="Optional executive memorandum or briefing note..."
              value={executiveNote}
              onChange={(e) => setExecutiveNote(e.target.value)}
              className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Dispatching...' : 'Send Executive Briefing Email'}
          </button>
        </form>
      </div>
    </div>
  );
};
