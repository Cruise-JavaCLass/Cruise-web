import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Anchor,
  ArrowRight,
  ShieldCheck,
  Globe2,
  RefreshCw,
  Plus,
  AlertTriangle,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import type {
  VoyageLifecycleState,
  VoyageOperationalPhase,
  CreateVoyageStateRequest,
  TransitionVoyagePhaseRequest,
} from '../../services/voyageLifecycleTypes';
import { voyageLifecycleService } from '../../services/voyageLifecycleService';
import { MaritimeTimezoneSchedulerModal, formatOffset } from './MaritimeTimezoneSchedulerModal';

export const VoyagePhaseControlCenter: React.FC = () => {
  const [voyages, setVoyages] = useState<VoyageLifecycleState[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Timezone modal state
  const [selectedVoyageForTz, setSelectedVoyageForTz] = useState<VoyageLifecycleState | null>(null);
  const [isTzModalOpen, setIsTzModalOpen] = useState(false);

  // Transition Phase modal state
  const [transitionVoyage, setTransitionVoyage] = useState<VoyageLifecycleState | null>(null);
  const [targetPhase, setTargetPhase] = useState<VoyageOperationalPhase>('AT_SEA');
  const [transitionReason, setTransitionReason] = useState('');
  const [currentPortName, setCurrentPortName] = useState('');
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);

  // Create Voyage State modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVoyageNumber, setNewVoyageNumber] = useState('VOY-2026-MED-06');
  const [newShipId, setNewShipId] = useState('SHIP-CELEBRATION');
  const [newItineraryName, setNewItineraryName] = useState('Greek Isles 7-Night Cruise');

  const fetchVoyages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await voyageLifecycleService.getActiveVoyages();
      setVoyages(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve voyage states');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    void fetchVoyages();
  }, [fetchVoyages]);

  const handleOpenTransition = (v: VoyageLifecycleState) => {
    setTransitionVoyage(v);
    // suggest logical next phase
    const nextPhase: VoyageOperationalPhase =
      v.currentPhase === 'PLANNING'
        ? 'EMBARKING'
        : v.currentPhase === 'EMBARKING'
        ? 'AT_SEA'
        : v.currentPhase === 'AT_SEA'
        ? 'PORT_VISIT'
        : v.currentPhase === 'PORT_VISIT'
        ? 'AT_SEA'
        : 'CLOSED';
    setTargetPhase(nextPhase);
    setTransitionReason(`Routine scheduled transition to ${nextPhase}`);
    setCurrentPortName(v.currentPortName || '');
    setTransitionError(null);
    setIsTransitionOpen(true);
  };

  const handleConfirmTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionVoyage) return;
    try {
      setLoading(true);
      setTransitionError(null);
      const req: TransitionVoyagePhaseRequest = {
        targetPhase,
        transitionReason,
        currentPortName: currentPortName || undefined,
      };
      await voyageLifecycleService.transitionPhase(transitionVoyage.voyageNumber, req);
      setIsTransitionOpen(false);
      setTransitionVoyage(null);
      await fetchVoyages();
    } catch (err: unknown) {
      setTransitionError(err instanceof Error ? err.message : 'Phase transition failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setCreateError(null);
      const req: CreateVoyageStateRequest = {
        voyageNumber: newVoyageNumber,
        shipId: newShipId,
        itineraryName: newItineraryName,
        initialPhase: 'PLANNING',
        initialTimezone: 'UTC',
      };
      await voyageLifecycleService.createVoyageState(req);
      setIsCreateOpen(false);
      await fetchVoyages();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Voyage creation failed');
    } finally {
      setLoading(false);
    }
  };

  const phases: VoyageOperationalPhase[] = [
    'PLANNING',
    'EMBARKING',
    'AT_SEA',
    'PORT_VISIT',
    'DEBARKING',
    'CLOSED',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner - Luxury Maritime Style */}
      <header className="rounded-xl border border-[#E5E0D7] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#397C80]/10 text-[#397C80]">
              <Anchor className="w-6 h-6" />
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-semibold tracking-wider text-[#687787] uppercase">
                Bridge &amp; Maritime Operations
              </p>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#102A43]">
                Voyage Global Lifecycle State Machine &amp; Bridge Control
              </h2>
              <p className="text-xs text-[#687787] mt-0.5">
                Control global voyage operational status and coordinate port timezones &amp; shipboard policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => void fetchVoyages()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#102A43] bg-white border border-[#E5E0D7] hover:bg-[#F7F4ED] rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#397C80]' : ''}`} /> Refresh
            </button>
            <button
              onClick={() => {
                setCreateError(null);
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#102A43] hover:bg-[#1B3A5A] rounded-lg shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Initialize New Voyage State
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Voyage Cards List */}
      <div className="space-y-6">
        {loading && !hasLoaded ? (
          <div className="bg-white rounded-xl p-12 text-center text-[#687787] border border-[#E5E0D7] shadow-xs">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#397C80] opacity-75" />
            <p className="text-xs">Loading voyage lifecycle states...</p>
          </div>
        ) : voyages.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-[#687787] border border-[#E5E0D7] shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF8F5] text-[#C5A572] mx-auto mb-3 border border-[#E5E0D7]">
              <Compass className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-[#252B32]">
              No voyage lifecycle states active. Click 'Initialize New Voyage State' to register one.
            </p>
          </div>
        ) : (
          voyages.map((v) => {
            const currentPhaseIdx = phases.indexOf(v.currentPhase);
            return (
              <div
                key={v.id}
                className="bg-white rounded-xl border border-[#E5E0D7] shadow-xs p-6 space-y-6"
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EEEAE2] gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#102A43] bg-[#F7F4ED] border border-[#E5E0D7] px-2.5 py-0.5 rounded-md">
                        {v.voyageNumber}
                      </span>
                      <span className="text-xs font-semibold text-[#5A6578] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                        {v.shipId}
                      </span>
                      {v.taxExemptionActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Duty/Tax-Free Waters
                        </span>
                      )}
                      {v.casinoOpen && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8C6D37] bg-[#FAF6F0] px-2.5 py-0.5 rounded-md border border-[#C5A572]/40">
                          <Coins className="w-3 h-3 text-[#C5A572]" /> Casino Open
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-serif font-bold text-[#102A43] mt-2">{v.itineraryName}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedVoyageForTz(v);
                        setIsTzModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] text-[#102A43] font-semibold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Globe2 className="w-3.5 h-3.5 text-[#397C80]" /> Timezone Coordinator
                    </button>
                    <button
                      disabled={v.currentPhase === 'CLOSED'}
                      onClick={() => handleOpenTransition(v)}
                      className="px-4 py-1.5 bg-[#102A43] hover:bg-[#1B3A5A] text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      Advance Phase <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Global Lifecycle Phase Stepper */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-semibold text-[#687787] uppercase tracking-wider block">
                    Global Phase Operational Stepper
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    {phases.map((phase, idx) => {
                      const isPast = idx < currentPhaseIdx;
                      const isCurrent = idx === currentPhaseIdx;
                      return (
                        <div
                          key={phase}
                          className={`p-3 rounded-xl border text-center transition ${
                            isCurrent
                              ? 'bg-[#102A43] border-[#102A43] text-white shadow-xs font-bold'
                              : isPast
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-semibold'
                              : 'bg-[#F7F4ED]/60 border-[#E5E0D7] text-[#687787]'
                          }`}
                        >
                          <div className={`text-[10px] uppercase tracking-wider ${isCurrent ? 'text-[#C5A572]' : 'opacity-75'}`}>
                            Step {idx + 1}
                          </div>
                          <div className="text-xs font-bold mt-0.5 flex items-center justify-center gap-1">
                            {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            <span>{phase}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metadata & Operating Rules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-[#F7F4ED] p-4 rounded-xl border border-[#E5E0D7]">
                  <div>
                    <span className="text-[#687787] text-[11px] font-medium block">Current Location / Port:</span>
                    <strong className="text-[#102A43] text-xs font-semibold">
                      {v.currentPortName || 'International Waters'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#687787] text-[11px] font-medium block">Ship Timezone:</span>
                    <strong className="text-[#102A43] text-xs font-semibold">
                      {v.currentTimezone} ({formatOffset(v.vesselClockOffsetMinutes)} mins)
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#687787] text-[11px] font-medium block">Last Transitioned:</span>
                    <span className="text-[#334E68] font-medium">
                      {new Date(v.phaseTransitionedAt).toLocaleString()} by {v.transitionedBy}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#687787] text-[11px] font-medium block">Reason:</span>
                    <span className="text-[#5A6578] italic">
                      {v.transitionReason || 'Scheduled transition'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Timezone Modal */}
      <MaritimeTimezoneSchedulerModal
        isOpen={isTzModalOpen}
        onClose={() => {
          setIsTzModalOpen(false);
          setSelectedVoyageForTz(null);
        }}
        voyage={selectedVoyageForTz}
        onTimezoneUpdated={(updated) => {
          setSelectedVoyageForTz(updated);
          void fetchVoyages();
        }}
      />

      {/* Transition Modal */}
      {isTransitionOpen && transitionVoyage && (
        <div className="fixed inset-0 z-50 bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E0D7] space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#102A43] mb-1">
                Advance Voyage Operational Phase
              </h3>
              <p className="text-xs text-[#687787]">
                Voyage: <strong className="text-[#102A43]">{transitionVoyage.voyageNumber}</strong> (Current Phase:{' '}
                <span className="font-bold text-[#397C80]">{transitionVoyage.currentPhase}</span>)
              </p>
            </div>

            <form onSubmit={handleConfirmTransition} className="space-y-3.5 text-xs">
              {transitionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
                  {transitionError}
                </div>
              )}
              <div>
                <label htmlFor="transition-target-phase" className="block font-semibold text-[#334E68] mb-1.5">
                  Target Next Phase
                </label>
                <select
                  id="transition-target-phase"
                  value={targetPhase}
                  onChange={(e) => setTargetPhase(e.target.value as VoyageOperationalPhase)}
                  className="w-full p-2.5 border border-[#D8D2C7] bg-white rounded-xl text-[#102A43] focus:border-[#397C80] focus:ring-2 focus:ring-[#397C80]/15 focus:outline-hidden font-bold"
                >
                  <option value="PLANNING">PLANNING</option>
                  <option value="EMBARKING">EMBARKING (Boarding Gates Open)</option>
                  <option value="AT_SEA">AT_SEA (International Waters - Tax Exempt &amp; Casino)</option>
                  <option value="PORT_VISIT">PORT_VISIT (Docked - Local Port Tax Applies)</option>
                  <option value="DEBARKING">DEBARKING (Final Luggage &amp; Offboarding)</option>
                  <option value="CLOSED">CLOSED (Terminal State)</option>
                </select>
              </div>

              <div>
                <label htmlFor="transition-current-port" className="block font-semibold text-[#334E68] mb-1.5">
                  Current Port Name (If Port Visit / Embarking)
                </label>
                <input
                  id="transition-current-port"
                  type="text"
                  placeholder="e.g. Mykonos Port, Greece"
                  value={currentPortName}
                  onChange={(e) => setCurrentPortName(e.target.value)}
                  className="w-full p-2.5 border border-[#D8D2C7] bg-white rounded-xl text-[#102A43] placeholder-[#9AA3AC] focus:border-[#397C80] focus:ring-2 focus:ring-[#397C80]/15 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="transition-reason" className="block font-semibold text-[#334E68] mb-1.5">
                  Transition Log Reason
                </label>
                <textarea
                  id="transition-reason"
                  rows={2}
                  required
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  className="w-full p-2.5 border border-[#D8D2C7] bg-white rounded-xl text-[#102A43] placeholder-[#9AA3AC] focus:border-[#397C80] focus:ring-2 focus:ring-[#397C80]/15 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D7]">
                <button
                  type="button"
                  onClick={() => setIsTransitionOpen(false)}
                  className="px-4 py-2 text-[#102A43] border border-[#E5E0D7] bg-white hover:bg-[#F7F4ED] rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#102A43] hover:bg-[#1B3A5A] text-white font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  Confirm Phase Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Initialize Voyage Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E0D7] space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#102A43] mb-1">Initialize Voyage State</h3>
              <p className="text-xs text-[#687787]">Register new voyage in the state machine.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
                  {createError}
                </div>
              )}
              <div>
                <label htmlFor="create-voyage-number" className="block font-semibold text-[#334E68] mb-1.5">
                  Voyage Number
                </label>
                <input
                  id="create-voyage-number"
                  type="text"
                  required
                  value={newVoyageNumber}
                  onChange={(e) => setNewVoyageNumber(e.target.value)}
                  className="w-full p-2.5 border border-[#D8D2C7] bg-white rounded-xl text-[#102A43] focus:border-[#397C80] focus:ring-2 focus:ring-[#397C80]/15 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label htmlFor="create-ship-id" className="block font-semibold text-[#334E68] mb-1.5">
                  Ship Identifier
                </label>
                <input
                  id="create-ship-id"
                  type="text"
                  required
                  value={newShipId}
                  onChange={(e) => setNewShipId(e.target.value)}
                  className="w-full p-2.5 border border-[#D8D2C7] bg-white rounded-xl text-[#102A43] focus:border-[#397C80] focus:ring-2 focus:ring-[#397C80]/15 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="create-itinerary-name" className="block font-semibold text-[#334E68] mb-1.5">
                  Itinerary Name
                </label>
                <input
                  id="create-itinerary-name"
                  type="text"
                  required
                  value={newItineraryName}
                  onChange={(e) => setNewItineraryName(e.target.value)}
                  className="w-full p-2.5 border border-[#D8D2C7] bg-white rounded-xl text-[#102A43] focus:border-[#397C80] focus:ring-2 focus:ring-[#397C80]/15 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E0D7]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-[#102A43] border border-[#E5E0D7] bg-white hover:bg-[#F7F4ED] rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#102A43] hover:bg-[#1B3A5A] text-white font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  Create Voyage State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
