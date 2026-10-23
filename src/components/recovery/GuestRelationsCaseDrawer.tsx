import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Gift,
  Clock,
  Send,
} from 'lucide-react';
import type {
  ServiceRecoveryCase,
  ServiceRecoveryObcVoucher,
  IssueObcVoucherRequest,
  EscalateCaseRequest,
  ResolveCaseRequest,
} from '../../services/serviceRecoveryTypes';
import { serviceRecoveryService } from '../../services/serviceRecoveryService';

interface GuestRelationsCaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: ServiceRecoveryCase | null;
  onCaseUpdated: (updated: ServiceRecoveryCase) => void;
}

export const GuestRelationsCaseDrawer: React.FC<GuestRelationsCaseDrawerProps> = ({
  isOpen,
  onClose,
  caseItem,
  onCaseUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ESCALATE' | 'COMPENSATION' | 'RESOLVE'>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Compensation Form State
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [apologyTitle, setApologyTitle] = useState('Sincere Apologies from Guest Relations Director');
  const [apologyBody, setApologyBody] = useState(
    'We deeply regret the disruption experienced during your voyage. Please accept this instant Onboard Credit (OBC) as our gesture of goodwill toward your onboard dining or spa experiences.'
  );

  // Escalate & Resolve Form State
  const [escalateReason, setEscalateReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [issuedVoucher, setIssuedVoucher] = useState<ServiceRecoveryObcVoucher | null>(null);

  if (!isOpen || !caseItem) return null;

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const req: EscalateCaseRequest = { escalationReason: escalateReason };
      const updated = await serviceRecoveryService.escalateCase(caseItem.id, req);
      onCaseUpdated(updated);
      setSuccessMsg('Case successfully escalated to Director level.');
      setEscalateReason('');
      setActiveTab('OVERVIEW');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Escalation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCompensation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const req: IssueObcVoucherRequest = {
        creditAmount,
        apologyTitle,
        apologyLetterBody: apologyBody,
        validityHours: 72,
      };
      const voucher = await serviceRecoveryService.issueVoucher(caseItem.id, req);
      setIssuedVoucher(voucher);
      setSuccessMsg(`${creditAmount} OBC Voucher issued successfully! Code: ${voucher.voucherCode}`);
      try {
        const updated = await serviceRecoveryService.getCase(caseItem.id);
        onCaseUpdated(updated);
      } catch {
        setError('Voucher issued, but the case could not be refreshed. Use Refresh before issuing another voucher.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to issue compensation');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const req: ResolveCaseRequest = { resolutionNotes };
      const updated = await serviceRecoveryService.resolveCase(caseItem.id, req);
      onCaseUpdated(updated);
      setSuccessMsg('Service recovery case has been marked as RESOLVED.');
      setActiveTab('OVERVIEW');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resolve case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {caseItem.caseNumber}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {caseItem.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">{caseItem.complaintSummary}</h2>
            <p className="text-xs text-slate-500">
              Guest: <strong>{caseItem.passengerName}</strong> (Cabin {caseItem.cabinNumber})
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'OVERVIEW'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview & SLA
          </button>
          <button
            onClick={() => setActiveTab('COMPENSATION')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'COMPENSATION'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Issue OBC Compensation
          </button>
          <button
            onClick={() => setActiveTab('ESCALATE')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'ESCALATE'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Escalate to Director
          </button>
          <button
            onClick={() => setActiveTab('RESOLVE')}
            className={`py-3 px-3 border-b-2 transition ${
              activeTab === 'RESOLVE'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Resolve Case
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              {error}
            </div>
          )}

          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Root Cause:</span>
                  <span className="font-semibold text-slate-800">{caseItem.rootCause}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Severity:</span>
                  <span className="font-bold text-rose-600">{caseItem.severity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Handler:</span>
                  <span className="font-medium text-slate-800">{caseItem.assignedHandler || 'Unassigned'}</span>
                </div>
                {caseItem.slaDueAt && (
                  <div className="flex justify-between items-center text-amber-700 font-medium">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Resolution SLA Due:</span>
                    <span>{new Date(caseItem.slaDueAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1">Complaint Details</h4>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 leading-relaxed">
                  {caseItem.complaintDetails || caseItem.complaintSummary}
                </div>
              </div>

              {caseItem.escalationReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                  <strong>Director Escalation Note:</strong> {caseItem.escalationReason}
                </div>
              )}

              {caseItem.resolutionNotes && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                  <strong>Resolution Outcome:</strong> {caseItem.resolutionNotes}
                </div>
              )}
            </div>
          )}

          {activeTab === 'COMPENSATION' && (
            <form onSubmit={handleIssueCompensation} className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-xs">
                Issue an automated <strong>Onboard Credit (OBC) Voucher</strong>. Once passenger accepts the apology in their portal, credit will automatically reduce their Cabin Folio balance.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Compensation OBC Amount (USD)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    step="5"
                    required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full pl-7 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Apology Letter Title</label>
                <input
                  type="text"
                  required
                  value={apologyTitle}
                  onChange={(e) => setApologyTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Personalized Apology Message</label>
                <textarea
                  rows={4}
                  required
                  value={apologyBody}
                  onChange={(e) => setApologyBody(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {issuedVoucher && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-emerald-600" /> Active Voucher: {issuedVoucher.voucherCode}
                  </div>
                  <div className="text-xs text-emerald-700">
                    Status: <strong>{issuedVoucher.status}</strong> | Amount: <strong>${issuedVoucher.creditAmount}</strong>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Issue Instant OBC Voucher
              </button>
            </form>
          )}

          {activeTab === 'ESCALATE' && (
            <form onSubmit={handleEscalate} className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>
                  Escalating triggers Director level notification and raises severity to <strong>CRITICAL_DIRECTOR_ESCALATION</strong> with a 2-hour SLA.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Director Escalation</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the severity or guest escalation demands..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-rose-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow"
              >
                Confirm Director Escalation
              </button>
            </form>
          )}

          {activeTab === 'RESOLVE' && (
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resolution Summary & Closing Notes</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Compensated $150 OBC and provided VIP bridge tour pass. Guest satisfied."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow"
              >
                Close & Resolve Case
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
