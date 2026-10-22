import React, { useState, useEffect, useCallback } from 'react';
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

  // New Case Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [passengerId] = useState<number>(101);
  const [passengerName, setPassengerName] = useState<string>('Alexander Wright');
  const [cabinNumber, setCabinNumber] = useState<string>('CABIN-7012');
  const [rootCause, setRootCause] = useState<ServiceRecoveryRootCause>('STATEROOM_CABIN_NOISE');
  const [severity, setSeverity] = useState<ServiceRecoverySeverity>('HIGH');
  const [complaintSummary, setComplaintSummary] = useState<string>('');
  const [complaintDetails, setComplaintDetails] = useState<string>('');

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceRecoveryService.searchCases({
        status: (statusFilter || undefined) as ServiceRecoveryCaseStatus,
        severity: (severityFilter || undefined) as ServiceRecoverySeverity,
        search: searchTerm || undefined,
      });
      setCases(res.content || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recovery cases');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, searchTerm]);

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await serviceRecoveryService.createCase({
        passengerId,
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
      void fetchCases();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (sev: ServiceRecoverySeverity) => {
    switch (sev) {
      case 'CRITICAL_DIRECTOR_ESCALATION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Service Recovery & Guest Escalation Console</h2>
            <p className="text-xs text-slate-500">Real-time complaint triage, SLA tracking, Director escalation & instant OBC voucher issuance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchCases()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Log Complaint / Incident
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search case, guest, cabin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 p-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
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
            className="w-full p-2 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
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
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-500 font-semibold">
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
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
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
                  className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">{c.caseNumber}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{c.passengerName}</div>
                    <div className="text-[11px] text-slate-500">{c.cabinNumber}</div>
                  </td>
                  <td className="px-5 py-3.5 font-medium">{c.rootCause}</td>
                  <td className="px-5 py-3.5">{getSeverityBadge(c.severity)}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-700">{c.status}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-500">
                    {c.slaDueAt ? (
                      <span className="flex items-center gap-1 text-amber-700 font-medium">
                        <Clock className="w-3 h-3" /> {new Date(c.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1">
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
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCase(null);
        }}
        caseItem={selectedCase}
        onCaseUpdated={(updated) => {
          setSelectedCase(updated);
          void fetchCases();
        }}
      />

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Log Service Recovery Complaint</h3>
            <p className="text-xs text-slate-500 mb-4">Record guest complaint to trigger SLA timers and escalation workflows.</p>

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cabin Number</label>
                  <input
                    type="text"
                    required
                    value={cabinNumber}
                    onChange={(e) => setCabinNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passenger Name</label>
                  <input
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Root Cause</label>
                  <select
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value as ServiceRecoveryRootCause)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
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
                  <label className="block font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as ServiceRecoverySeverity)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  >
                    <option value="LOW">LOW (24h SLA)</option>
                    <option value="MEDIUM">MEDIUM (12h SLA)</option>
                    <option value="HIGH">HIGH (6h SLA)</option>
                    <option value="CRITICAL_DIRECTOR_ESCALATION">CRITICAL (Director Escalation - 2h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Complaint Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken stateroom air conditioning during sea day"
                  value={complaintSummary}
                  onChange={(e) => setComplaintSummary(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Details & Passenger Demands</label>
                <textarea
                  rows={3}
                  value={complaintDetails}
                  onChange={(e) => setComplaintDetails(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
                >
                  Create Recovery Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
