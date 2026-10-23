import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Compass,
  FileCheck,
  RefreshCw,
  Plus,
  Download,
  AlertTriangle,
  Wine,
  Utensils,
  MapPin,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import type {
  VoyageFinancialClosure,
  ExecutiveVoyageAnalyticsSummary,
  InitiateVoyageClosureRequest,
  FinalizeVoyageClosureRequest,
} from '../../services/voyageAnalyticsTypes';
import { voyageAnalyticsService } from '../../services/voyageAnalyticsService';
import { ExecutivePdfBookletModal } from './ExecutivePdfBookletModal';

export const ExecutivePostVoyageDashboard: React.FC = () => {
  const [summary, setSummary] = useState<ExecutiveVoyageAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const closureSubmitRef = useRef(false);
  const [closureSubmitPending, setClosureSubmitPending] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedVoyageForModal, setSelectedVoyageForModal] = useState<VoyageFinancialClosure | null>(null);
  const [isBookletModalOpen, setIsBookletModalOpen] = useState(false);
  const [isInitiateOpen, setIsInitiateOpen] = useState(false);

  // Form State for Initiate Closure
  const [voyageNumber, setVoyageNumber] = useState('VOY-2026-MED-02');
  const [shipId, setShipId] = useState('SHIP-CELEBRATION');
  const [itineraryName, setItineraryName] = useState('Greek Isles & Turkish Coast 7-Day');
  const [voyageStartDate, setVoyageStartDate] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [voyageEndDate, setVoyageEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [closureAuditNotes, setClosureAuditNotes] = useState('Executive ledger reconciled with PMS & POS.');
  const [capacity, setCapacity] = useState(2500);
  const [attendance, setAttendance] = useState(2380);
  const [budgetGross, setBudgetGross] = useState(1500000);
  const [revBars, setRevBars] = useState(620000);
  const [revDining, setRevDining] = useState(410000);
  const [revExcursions, setRevExcursions] = useState(380000);
  const [revSpa, setRevSpa] = useState(140000);
  const [revRetail, setRevRetail] = useState(90000);
  const [discounts, setDiscounts] = useState(40000);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await voyageAnalyticsService.getExecutiveSummary();
      setSummary(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve executive post-voyage analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const handleInitiateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (closureSubmitRef.current) return;
    closureSubmitRef.current = true;
    setClosureSubmitPending(true);
    setInitiateError(null);
    try {
      setLoading(true);
      const req: InitiateVoyageClosureRequest = {
        voyageNumber,
        shipId,
        itineraryName,
        voyageStartDate: new Date(voyageStartDate).toISOString(),
        voyageEndDate: new Date(voyageEndDate).toISOString(),
        totalPassengerCapacity: capacity,
        actualPassengerAttendance: attendance,
        budgetedGrossRevenue: budgetGross,
        revenueBeverageBars: revBars,
        revenueSpecialtyDining: revDining,
        revenueShoreExcursions: revExcursions,
        revenueSpaWellness: revSpa,
        revenueRetailBoutiques: revRetail,
        totalDiscountsAndObc: discounts,
        closureAuditNotes: closureAuditNotes.trim() || 'Executive ledger reconciled with PMS & POS.',
      };
      await voyageAnalyticsService.initiateClosure(req);
      setIsInitiateOpen(false);
      await loadAnalytics();
    } catch (err: unknown) {
      setInitiateError(err instanceof Error ? err.message : 'Closure initiation failed');
    } finally {
      closureSubmitRef.current = false;
      setClosureSubmitPending(false);
      setLoading(false);
    }
  };

  const handleFinalize = async (vNumber: string) => {
    if (closureSubmitRef.current) return;
    const assertionText = 'All voyage accounts audited by Corporate Finance.';
    if (!window.confirm(`Officially finalize and audit financial closure for ${vNumber}?\n\nConfirm audit assertion: "${assertionText}"`)) return;
    closureSubmitRef.current = true;
    setClosureSubmitPending(true);
    try {
      setLoading(true);
      const req: FinalizeVoyageClosureRequest = {
        closureAuditNotes: assertionText,
      };
      await voyageAnalyticsService.finalizeClosure(vNumber, req);
      await loadAnalytics();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Finalization failed');
    } finally {
      closureSubmitRef.current = false;
      setClosureSubmitPending(false);
      setLoading(false);
    }
  };

  const latest = summary?.latestVoyage;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Executive Post-Voyage Operational Analytics</h2>
            <p className="text-xs text-slate-500">
              Fleet revenue reconciliation, RevPCD index, attendance vs capacity and executive briefing booklets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadAnalytics()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => {
              setInitiateError(null);
              setIsInitiateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Close Voyage Financials
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" /> {error}
        </div>
      )}

      {/* Corporate Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet RevPCD</span>
            <DollarSign className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ${summary ? Number(summary.fleetAverageRevPCD).toFixed(2) : '--'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Revenue per Passenger Cruise Day</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Occupancy</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {summary ? Number(summary.fleetAverageOccupancy).toFixed(1) : '--'}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Average capacity utilization</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latest Voyage Net</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            ${latest ? Number(latest.actualNetRevenue).toLocaleString() : '--'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Budget Variance: <strong>{latest ? `${latest.budgetVariancePercentage}%` : '--'}</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profitability Index</span>
            <FileCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600">
            {latest ? Number(latest.profitabilityIndex).toFixed(2) : '--'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Net Yield / Capacity Multiplier</p>
        </div>
      </div>

      {/* Latest Voyage Department Breakdown Matrix */}
      {latest && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                Current Voyage Breakdown
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {latest.voyageNumber} — {latest.itineraryName} ({latest.shipId})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedVoyageForModal(latest);
                  setIsBookletModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> PDF Booklet & Email
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Wine className="w-4 h-4 text-amber-600" /> Beverage & Bars
              </div>
              <div className="text-base font-bold text-slate-900">${Number(latest.revenueBeverageBars).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Utensils className="w-4 h-4 text-rose-600" /> Specialty Dining
              </div>
              <div className="text-base font-bold text-slate-900">${Number(latest.revenueSpecialtyDining).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <MapPin className="w-4 h-4 text-indigo-600" /> Shore Excursions
              </div>
              <div className="text-base font-bold text-slate-900">${Number(latest.revenueShoreExcursions).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Lotus Spa & Salon
              </div>
              <div className="text-base font-bold text-slate-900">${Number(latest.revenueSpaWellness).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <ShoppingBag className="w-4 h-4 text-purple-600" /> Retail Boutiques
              </div>
              <div className="text-base font-bold text-slate-900">${Number(latest.revenueRetailBoutiques).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Trend Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Closed Voyages Reconciliation Archive ({summary?.historicalTrend.length || 0})
          </span>
        </div>

        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3.5">Voyage #</th>
              <th className="px-5 py-3.5">Ship & Itinerary</th>
              <th className="px-5 py-3.5">Attendance / Capacity</th>
              <th className="px-5 py-3.5">Actual Net</th>
              <th className="px-5 py-3.5">RevPCD</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {!summary || summary.historicalTrend.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No post-voyage closure records available.
                </td>
              </tr>
            ) : (
              summary.historicalTrend.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">{v.voyageNumber}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{v.shipId}</div>
                    <div className="text-[11px] text-slate-500">{v.itineraryName}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-800">{v.actualPassengerAttendance}</span>
                    <span className="text-slate-400"> / {v.totalPassengerCapacity} ({v.occupancyPercentage}%)</span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-emerald-600">
                    ${Number(v.actualNetRevenue).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-indigo-600">
                    ${Number(v.revenuePerPassengerCruiseDay).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                      {v.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedVoyageForModal(v);
                        setIsBookletModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Booklet
                    </button>
                    {v.status === 'CLOSURE_IN_PROGRESS' && (
                      <button
                        onClick={() => handleFinalize(v.voyageNumber)}
                        disabled={closureSubmitPending || loading}
                        className="text-emerald-600 hover:text-emerald-800 font-semibold disabled:opacity-50"
                      >
                        Finalize
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Executive PDF & Email Modal */}
      <ExecutivePdfBookletModal
        isOpen={isBookletModalOpen}
        onClose={() => {
          setIsBookletModalOpen(false);
          setSelectedVoyageForModal(null);
        }}
        voyage={selectedVoyageForModal}
      />

      {/* Initiate Closure Modal */}
      {isInitiateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Initiate Post-Voyage Financial Closure</h3>
            <p className="text-xs text-slate-500 mb-4">Reconcile department revenues, calculate RevPCD, and generate executive archive.</p>

            <form onSubmit={handleInitiateSubmit} className="space-y-3.5 text-xs">
              {initiateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold">
                  {initiateError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voyage Number</label>
                  <input
                    type="text"
                    required
                    value={voyageNumber}
                    onChange={(e) => setVoyageNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ship Identifier</label>
                  <input
                    type="text"
                    required
                    value={shipId}
                    onChange={(e) => setShipId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Itinerary Name</label>
                <input
                  type="text"
                  required
                  value={itineraryName}
                  onChange={(e) => {
                    setItineraryName(e.target.value);
                    if (initiateError) setInitiateError(null);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voyage Start Date</label>
                  <input
                    type="date"
                    required
                    value={voyageStartDate}
                    onChange={(e) => {
                      setVoyageStartDate(e.target.value);
                      if (initiateError) setInitiateError(null);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Voyage End Date</label>
                  <input
                    type="date"
                    required
                    value={voyageEndDate}
                    onChange={(e) => {
                      setVoyageEndDate(e.target.value);
                      if (initiateError) setInitiateError(null);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Notes / Verification</label>
                <input
                  type="text"
                  required
                  value={closureAuditNotes}
                  onChange={(e) => {
                    setClosureAuditNotes(e.target.value);
                    if (initiateError) setInitiateError(null);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Actual Attendance</label>
                  <input
                    type="number"
                    required
                    value={attendance}
                    onChange={(e) => setAttendance(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budgeted Gross ($)</label>
                  <input
                    type="number"
                    required
                    value={budgetGross}
                    onChange={(e) => setBudgetGross(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block">Department Actual Gross Breakdown ($)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Bars</label>
                    <input type="number" value={revBars} onChange={(e) => setRevBars(Number(e.target.value))} className="w-full p-1.5 border rounded" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Dining</label>
                    <input type="number" value={revDining} onChange={(e) => setRevDining(Number(e.target.value))} className="w-full p-1.5 border rounded" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Excursions</label>
                    <input type="number" value={revExcursions} onChange={(e) => setRevExcursions(Number(e.target.value))} className="w-full p-1.5 border rounded" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Spa</label>
                    <input type="number" value={revSpa} onChange={(e) => setRevSpa(Number(e.target.value))} className="w-full p-1.5 border rounded" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Retail</label>
                    <input type="number" value={revRetail} onChange={(e) => setRevRetail(Number(e.target.value))} className="w-full p-1.5 border rounded" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Discounts/OBC</label>
                    <input type="number" value={discounts} onChange={(e) => setDiscounts(Number(e.target.value))} className="w-full p-1.5 border rounded" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInitiateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closureSubmitPending || loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  Initiate Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
