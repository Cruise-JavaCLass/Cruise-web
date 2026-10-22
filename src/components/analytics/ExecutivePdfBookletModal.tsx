import React, { useState } from 'react';
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

  if (!isOpen || !voyage) return null;

  const handleDownloadPdf = () => {
    const url = voyageAnalyticsService.getPdfBookletUrl(voyage.voyageNumber);
    window.open(url, '_blank');
  };

  const handleDispatchEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await voyageAnalyticsService.dispatchEmail(voyage.voyageNumber, {
        recipientEmail,
        executiveNote: executiveNote || undefined,
      });
      setSuccessMsg(`Executive booklet successfully sent to ${recipientEmail}`);
      setRecipientEmail('');
      setExecutiveNote('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Executive Audit Booklet & Dispatch
              </h3>
              <p className="text-slate-500 text-[11px]">
                Voyage: <strong>{voyage.voyageNumber}</strong> ({voyage.itineraryName})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Summary Card */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400">Actual Net Revenue:</span>
            <div className="font-bold text-emerald-600 text-sm">
              ${Number(voyage.actualNetRevenue).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-slate-400">RevPCD / Occupancy:</span>
            <div className="font-bold text-indigo-600 text-sm">
              ${Number(voyage.revenuePerPassengerCruiseDay).toFixed(2)} ({voyage.occupancyPercentage}%)
            </div>
          </div>
        </div>

        {/* Action 1: Direct Download */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">1. Direct PDF Booklet Download</label>
          <button
            onClick={handleDownloadPdf}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Download Post-Voyage Audit Booklet (.PDF)
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Action 2: Email Dispatch */}
        <form onSubmit={handleDispatchEmail} className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block font-semibold text-slate-700 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-indigo-600" /> 2. Dispatch to Corporate Executive Board
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
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <textarea
              rows={2}
              placeholder="Optional executive memorandum or briefing note..."
              value={executiveNote}
              onChange={(e) => setExecutiveNote(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Dispatching...' : 'Send Executive Briefing Email'}
          </button>
        </form>
      </div>
    </div>
  );
};
