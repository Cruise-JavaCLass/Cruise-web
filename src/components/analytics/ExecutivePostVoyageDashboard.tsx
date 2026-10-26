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
  const [voyageNumber, setVoyageNumber] = useState('');
  const [shipId, setShipId] = useState('');
  const [itineraryName, setItineraryName] = useState('');
  const [voyageStartDate, setVoyageStartDate] = useState('');
  const [voyageEndDate, setVoyageEndDate] = useState('');
  const [closureAuditNotes, setClosureAuditNotes] = useState('');
  const [capacity, setCapacity] = useState('');
  const [attendance, setAttendance] = useState('');
  const [budgetGross, setBudgetGross] = useState('');
  const [revBars, setRevBars] = useState('');
  const [revDining, setRevDining] = useState('');
  const [revExcursions, setRevExcursions] = useState('');
  const [revSpa, setRevSpa] = useState('');
  const [revRetail, setRevRetail] = useState('');
  const [discounts, setDiscounts] = useState('');

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
        totalPassengerCapacity: Number(capacity),
        actualPassengerAttendance: Number(attendance),
        budgetedGrossRevenue: Number(budgetGross),
        revenueBeverageBars: Number(revBars),
        revenueSpecialtyDining: Number(revDining),
        revenueShoreExcursions: Number(revExcursions),
        revenueSpaWellness: Number(revSpa),
        revenueRetailBoutiques: Number(revRetail),
        totalDiscountsAndObc: Number(discounts),
        closureAuditNotes: closureAuditNotes.trim(),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#F7F4ED] text-[#102A43] rounded-xl border border-[#E5E0D7]">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#102A43]">Executive Post-Voyage Operational Analytics</h2>
            <p className="text-xs text-[#252B32]/70">
              Fleet revenue reconciliation, RevPCD index, attendance vs capacity and executive briefing booklets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadAnalytics()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#102A43] bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => {
              setInitiateError(null);
              setIsInitiateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#102A43] hover:bg-[#0B1F33] rounded-xl shadow-xs transition-colors cursor-pointer"
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
        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#252B32]/70 uppercase tracking-wider">Fleet RevPCD</span>
            <DollarSign className="w-5 h-5 text-[#397C80]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#102A43]">
            ${summary ? Number(summary.fleetAverageRevPCD).toFixed(2) : '--'}
          </div>
          <p className="text-[11px] text-[#252B32]/60 mt-1">Revenue per Passenger Cruise Day</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#252B32]/70 uppercase tracking-wider">Fleet Occupancy</span>
            <Users className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#102A43]">
            {summary ? Number(summary.fleetAverageOccupancy).toFixed(1) : '--'}%
          </div>
          <p className="text-[11px] text-[#252B32]/60 mt-1">Average capacity utilization</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#252B32]/70 uppercase tracking-wider">Latest Voyage Net</span>
            <TrendingUp className="w-5 h-5 text-[#102A43]" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            ${latest ? Number(latest.actualNetRevenue).toLocaleString() : '--'}
          </div>
          <p className="text-[11px] text-[#252B32]/60 mt-1">
            Budget Variance: <strong>{latest ? `${latest.budgetVariancePercentage}%` : '--'}</strong>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#252B32]/70 uppercase tracking-wider">Profitability Index</span>
            <FileCheck className="w-5 h-5 text-[#397C80]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#397C80]">
            {latest ? Number(latest.profitabilityIndex).toFixed(2) : '--'}
          </div>
          <p className="text-[11px] text-[#252B32]/60 mt-1">Net Yield / Capacity Multiplier</p>
        </div>
      </div>

      {/* Latest Voyage Department Breakdown Matrix */}
      {latest && (
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E0D7] gap-2">
            <div>
              <span className="text-[11px] font-bold text-[#102A43] uppercase tracking-wider bg-[#F7F4ED] border border-[#E5E0D7] px-2 py-0.5 rounded">
                Current Voyage Breakdown
              </span>
              <h3 className="text-base font-bold text-[#102A43] mt-1">
                {latest.voyageNumber} — {latest.itineraryName} ({latest.shipId})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedVoyageForModal(latest);
                  setIsBookletModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> PDF Booklet & Email
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-[#F7F4ED]/60 rounded-xl border border-[#E5E0D7]">
              <div className="flex items-center gap-1.5 text-[#252B32]/70 mb-1 font-medium">
                <Wine className="w-4 h-4 text-amber-700" /> Beverage & Bars
              </div>
              <div className="text-base font-bold text-[#102A43]">${Number(latest.revenueBeverageBars).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-[#F7F4ED]/60 rounded-xl border border-[#E5E0D7]">
              <div className="flex items-center gap-1.5 text-[#252B32]/70 mb-1 font-medium">
                <Utensils className="w-4 h-4 text-rose-700" /> Specialty Dining
              </div>
              <div className="text-base font-bold text-[#102A43]">${Number(latest.revenueSpecialtyDining).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-[#F7F4ED]/60 rounded-xl border border-[#E5E0D7]">
              <div className="flex items-center gap-1.5 text-[#252B32]/70 mb-1 font-medium">
                <MapPin className="w-4 h-4 text-[#397C80]" /> Shore Excursions
              </div>
              <div className="text-base font-bold text-[#102A43]">${Number(latest.revenueShoreExcursions).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-[#F7F4ED]/60 rounded-xl border border-[#E5E0D7]">
              <div className="flex items-center gap-1.5 text-[#252B32]/70 mb-1 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-700" /> Lotus Spa & Salon
              </div>
              <div className="text-base font-bold text-[#102A43]">${Number(latest.revenueSpaWellness).toLocaleString()}</div>
            </div>

            <div className="p-3 bg-[#F7F4ED]/60 rounded-xl border border-[#E5E0D7]">
              <div className="flex items-center gap-1.5 text-[#252B32]/70 mb-1 font-medium">
                <ShoppingBag className="w-4 h-4 text-[#C5A572]" /> Retail Boutiques
              </div>
              <div className="text-base font-bold text-[#102A43]">${Number(latest.revenueRetailBoutiques).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Trend Table */}
      <div className="bg-white rounded-2xl border border-[#E5E0D7] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
            Closed Voyages Reconciliation Archive ({summary?.historicalTrend.length || 0})
          </span>
        </div>

        <table className="min-w-full divide-y divide-[#E5E0D7] text-left text-xs">
          <thead className="bg-[#F7F4ED]/50 text-[#102A43] font-semibold">
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
          <tbody className="divide-y divide-[#E5E0D7] text-[#252B32] bg-white">
            {!summary || summary.historicalTrend.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#252B32]/40">
                  No post-voyage closure records available.
                </td>
              </tr>
            ) : (
              summary.historicalTrend.map((v) => (
                <tr key={v.id} className="hover:bg-[#F7F4ED]/40 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-[#102A43]">{v.voyageNumber}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[#102A43]">{v.shipId}</div>
                    <div className="text-[11px] text-[#252B32]/70">{v.itineraryName}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-[#252B32]">{v.actualPassengerAttendance}</span>
                    <span className="text-[#252B32]/60"> / {v.totalPassengerCapacity} ({v.occupancyPercentage}%)</span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-emerald-700">
                    ${Number(v.actualNetRevenue).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-[#102A43]">
                    ${Number(v.revenuePerPassengerCruiseDay).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F4ED] border border-[#E5E0D7] text-[#102A43]">
                      {v.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedVoyageForModal(v);
                        setIsBookletModalOpen(true);
                      }}
                      className="text-[#102A43] hover:text-[#0B1F33] font-semibold underline-offset-2 hover:underline cursor-pointer"
                    >
                      Booklet
                    </button>
                    {v.status === 'CLOSURE_IN_PROGRESS' && (
                      <button
                        onClick={() => handleFinalize(v.voyageNumber)}
                        disabled={closureSubmitPending || loading}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold underline-offset-2 hover:underline cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E5E0D7] max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-[#102A43] mb-1">Initiate Post-Voyage Financial Closure</h3>
            <p className="text-xs text-[#252B32]/70 mb-4">Reconcile department revenues, calculate RevPCD, and generate executive archive.</p>

            <form onSubmit={handleInitiateSubmit} className="space-y-3.5 text-xs">
              {initiateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold">
                  {initiateError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Voyage Number</label>
                  <input
                    type="text"
                    required
                    value={voyageNumber}
                    onChange={(e) => setVoyageNumber(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Ship Identifier</label>
                  <input
                    type="text"
                    required
                    value={shipId}
                    onChange={(e) => setShipId(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#102A43] mb-1">Itinerary Name</label>
                <input
                  type="text"
                  required
                  value={itineraryName}
                  onChange={(e) => {
                    setItineraryName(e.target.value);
                    if (initiateError) setInitiateError(null);
                  }}
                  className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Voyage Start Date</label>
                  <input
                    type="date"
                    required
                    value={voyageStartDate}
                    onChange={(e) => {
                      setVoyageStartDate(e.target.value);
                      if (initiateError) setInitiateError(null);
                    }}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Voyage End Date</label>
                  <input
                    type="date"
                    required
                    value={voyageEndDate}
                    onChange={(e) => {
                      setVoyageEndDate(e.target.value);
                      if (initiateError) setInitiateError(null);
                    }}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#102A43] mb-1">Audit Notes / Verification</label>
                <input
                  type="text"
                  required
                  value={closureAuditNotes}
                  onChange={(e) => {
                    setClosureAuditNotes(e.target.value);
                    if (initiateError) setInitiateError(null);
                  }}
                  className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Actual Attendance</label>
                  <input
                    type="number"
                    required
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#102A43] mb-1">Budgeted Gross ($)</label>
                  <input
                    type="number"
                    required
                    value={budgetGross}
                    onChange={(e) => setBudgetGross(e.target.value)}
                    className="w-full p-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#F7F4ED]/60 rounded-xl border border-[#E5E0D7] space-y-2">
                <span className="font-bold text-[#102A43] block">Department Actual Gross Breakdown ($)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[#252B32]/70">Bars</label>
                    <input type="number" required value={revBars} onChange={(e) => setRevBars(e.target.value)} className="w-full p-1.5 bg-white border border-[#E5E0D7] rounded text-xs text-[#252B32]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#252B32]/70">Dining</label>
                    <input type="number" required value={revDining} onChange={(e) => setRevDining(e.target.value)} className="w-full p-1.5 bg-white border border-[#E5E0D7] rounded text-xs text-[#252B32]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#252B32]/70">Excursions</label>
                    <input type="number" required value={revExcursions} onChange={(e) => setRevExcursions(e.target.value)} className="w-full p-1.5 bg-white border border-[#E5E0D7] rounded text-xs text-[#252B32]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#252B32]/70">Spa</label>
                    <input type="number" required value={revSpa} onChange={(e) => setRevSpa(e.target.value)} className="w-full p-1.5 bg-white border border-[#E5E0D7] rounded text-xs text-[#252B32]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#252B32]/70">Retail</label>
                    <input type="number" required value={revRetail} onChange={(e) => setRevRetail(e.target.value)} className="w-full p-1.5 bg-white border border-[#E5E0D7] rounded text-xs text-[#252B32]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#252B32]/70">Discounts/OBC</label>
                    <input type="number" required value={discounts} onChange={(e) => setDiscounts(e.target.value)} className="w-full p-1.5 bg-white border border-[#E5E0D7] rounded text-xs text-[#252B32]" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E0D7]">
                <button
                  type="button"
                  onClick={() => setIsInitiateOpen(false)}
                  className="px-4 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] text-[#102A43] rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closureSubmitPending || loading}
                  className="px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
