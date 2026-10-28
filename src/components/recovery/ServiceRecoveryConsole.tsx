import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LifeBuoy,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type {
  ServiceRecoveryCase,
  ServiceRecoveryCaseStatus,
  ServiceRecoverySeverity,
  ServiceRecoveryRootCause,
} from '../../services/serviceRecoveryTypes';
import { serviceRecoveryService } from '../../services/serviceRecoveryService';
import { GuestRelationsCaseDrawer } from './GuestRelationsCaseDrawer';

export const ServiceRecoveryConsole: React.FC = () => {
  const [cases, setCases] = useState<ServiceRecoveryCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected Drawer Case
  const [selectedCase, setSelectedCase] = useState<ServiceRecoveryCase | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const requestSeq = useRef(0);

  // New Case Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [passengerId, setPassengerId] = useState<number | ''>('');
  const [passengerName, setPassengerName] = useState<string>('');
  const [cabinNumber, setCabinNumber] = useState<string>('');
  const [rootCause, setRootCause] = useState<ServiceRecoveryRootCause>('STATEROOM_CABIN_NOISE');
  const [severity, setSeverity] = useState<ServiceRecoverySeverity>('HIGH');
  const [complaintSummary, setComplaintSummary] = useState<string>('');
  const [complaintDetails, setComplaintDetails] = useState<string>('');

  const fetchCases = useCallback(async () => {
    const seq = ++requestSeq.current;
    try {
      setLoading(true);
      setError(null);
      const res = await serviceRecoveryService.searchCases({
        status: (statusFilter || undefined) as ServiceRecoveryCaseStatus,
        severity: (severityFilter || undefined) as ServiceRecoverySeverity,
        search: searchTerm || undefined,
      });
      if (seq === requestSeq.current) setCases(res.content || []);
    } catch (err: unknown) {
      if (seq === requestSeq.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recovery cases');
      }
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [statusFilter, severityFilter, searchTerm]);

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createPending) return;
    try {
      setCreatePending(true);
      setCreateError(null);
      await serviceRecoveryService.createCase({
        passengerId: Number(passengerId) || 101,
        passengerName,
        cabinNumber,
        rootCause,
        severity,
        complaintSummary,
        complaintDetails,
      });
      setIsCreateOpen(false);
      setComplaintSummary('');
      setComplaintDetails('');
      setCreateError(null);
      void fetchCases();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setCreatePending(false);
    }
  };

  const getSeverityBadge = (sev: ServiceRecoverySeverity) => {
    switch (sev) {
      case 'CRITICAL_DIRECTOR_ESCALATION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F7F4ED] text-[#252B32]/70 border border-[#E5E0D7]">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-xl">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#102A43]">Service Recovery & Guest Escalation Console</h2>
            <p className="text-xs text-[#252B32]/70">Real-time complaint triage, SLA tracking, Director escalation & instant OBC voucher issuance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchCases()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#102A43] bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => {
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#102A43] hover:bg-[#0B1F33] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Log Complaint / Incident
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E0D7] shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#252B32]/40" />
          <input
            type="text"
            placeholder="Search case, guest, cabin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
            <option value="ESCALATED">ESCALATED</option>
            <option value="COMPENSATION_OFFERED">COMPENSATION_OFFERED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL_DIRECTOR_ESCALATION">CRITICAL (Director Escalation)</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div>
          <button
            onClick={() => void fetchCases()}
            className="w-full py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Filter Cases
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
        </div>
      )}

      {/* Case Table */}
      <div className="bg-white rounded-2xl border border-[#E5E0D7] shadow-xs overflow-hidden">
        <table className="min-w-full divide-y divide-[#E5E0D7] text-left text-xs">
          <thead className="bg-[#F7F4ED] text-[#102A43] font-semibold border-b border-[#E5E0D7]">
            <tr>
              <th className="px-5 py-3.5">Case #</th>
              <th className="px-5 py-3.5">Guest & Cabin</th>
              <th className="px-5 py-3.5">Root Cause</th>
              <th className="px-5 py-3.5">Severity</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">SLA Due</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D7] text-[#252B32] bg-white">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#252B32]/40">
                  No active service recovery cases found.
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => {
                    setSelectedCase(c);
                    setIsDrawerOpen(true);
                  }}
                  className="hover:bg-[#F7F4ED]/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-[#102A43]">{c.caseNumber}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[#102A43]">{c.passengerName}</div>
                    <div className="text-[11px] text-[#252B32]/60">{c.cabinNumber}</div>
                  </td>
                  <td className="px-5 py-3.5 font-medium">{c.rootCause}</td>
                  <td className="px-5 py-3.5">{getSeverityBadge(c.severity)}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-[#102A43]">{c.status}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-[#252B32]/70">
                    {c.slaDueAt ? (
                      <span className="flex items-center gap-1 text-amber-800 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(c.slaDueAt).toLocaleDateString()} {new Date(c.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-[#102A43] hover:text-[#0B1F33] font-semibold inline-flex items-center gap-1 cursor-pointer">
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <GuestRelationsCaseDrawer
        key={selectedCase?.id ?? 'none'}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCase(null);
        }}
        caseItem={selectedCase}
        onCaseUpdated={(updated) => {
          setSelectedCase((prev) => (prev && prev.id === updated.id ? updated : prev));
          void fetchCases();
        }}
      />

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E0D7] text-[#252B32]">
            <h3 className="text-base font-bold text-[#102A43] mb-1">Log Service Recovery Complaint</h3>
            <p className="text-xs text-[#252B32]/70 mb-4">Record guest complaint to trigger SLA timers and escalation workflows.</p>

            {createError && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl mb-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Passenger ID</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 101"
                    value={passengerId}
                    onChange={(e) => setPassengerId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Cabin Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CABIN-7012"
                    value={cabinNumber}
                    onChange={(e) => setCabinNumber(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Passenger Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander Wright"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Root Cause</label>
                  <select
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value as ServiceRecoveryRootCause)}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  >
                    <option value="STATEROOM_CABIN_NOISE">Stateroom Cabin Noise</option>
                    <option value="STATEROOM_PLUMBING_HVAC">Stateroom Plumbing / HVAC</option>
                    <option value="DINING_FOOD_QUALITY">Dining Food Quality</option>
                    <option value="DINING_SERVICE_DELAY">Dining Service Delay</option>
                    <option value="EXCURSION_DELAY_CANCELLATION">Excursion Delay / Cancellation</option>
                    <option value="POS_BILLING_DISPUTE">POS Billing Dispute</option>
                    <option value="OTHER_GUEST_DISSATISFACTION">Other Dissatisfaction</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as ServiceRecoverySeverity)}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  >
                    <option value="LOW">LOW (24h SLA)</option>
                    <option value="MEDIUM">MEDIUM (12h SLA)</option>
                    <option value="HIGH">HIGH (6h SLA)</option>
                    <option value="CRITICAL_DIRECTOR_ESCALATION">CRITICAL (Director Escalation - 2h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#102A43] mb-1">Complaint Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken stateroom air conditioning during sea day"
                  value={complaintSummary}
                  onChange={(e) => setComplaintSummary(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#102A43] mb-1">Details & Passenger Demands</label>
                <textarea
                  rows={3}
                  value={complaintDetails}
                  onChange={(e) => setComplaintDetails(e.target.value)}
                  className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D7]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setCreateError(null);
                  }}
                  className="px-4 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] text-[#102A43] rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPending || loading}
                  className="px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {createPending ? 'Creating Case...' : 'Create Recovery Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
