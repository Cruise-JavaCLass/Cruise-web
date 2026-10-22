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
import { MaritimeTimezoneSchedulerModal } from './MaritimeTimezoneSchedulerModal';

export const VoyagePhaseControlCenter: React.FC = () => {
  const [voyages, setVoyages] = useState<VoyageLifecycleState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        : v.currentPhase === 'DEBARKING'
        ? 'CLOSED'
        : 'CLOSED';
    setTargetPhase(nextPhase);
    setTransitionReason(`Routine scheduled transition to ${nextPhase}`);
    setCurrentPortName(v.currentPortName || '');
    setIsTransitionOpen(true);
  };

  const handleConfirmTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionVoyage) return;
    try {
      setLoading(true);
      setError(null);
      const req: TransitionVoyagePhaseRequest = {
        targetPhase,
        transitionReason,
        currentPortName: currentPortName || undefined,
      };
      await voyageLifecycleService.transitionPhase(transitionVoyage.voyageNumber, req);
      setIsTransitionOpen(false);
      setTransitionVoyage(null);
      void fetchVoyages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Phase transition failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const req: CreateVoyageStateRequest = {
        voyageNumber: newVoyageNumber,
        shipId: newShipId,
        itineraryName: newItineraryName,
        initialPhase: 'PLANNING',
        initialTimezone: 'UTC',
      };
      await voyageLifecycleService.createVoyageState(req);
      setIsCreateOpen(false);
      void fetchVoyages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Voyage creation failed');
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Voyage Global Lifecycle State Machine & Bridge Control
            </h2>
            <p className="text-xs text-slate-500">
              Control global voyage operational status and coordinate port timezones & shipboard policies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchVoyages()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Initialize New Voyage State
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" /> {error}
        </div>
      )}

      {/* Voyage Cards List */}
      <div className="space-y-6">
        {voyages.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
            <Compass className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-600" />
            No voyage lifecycle states active. Click 'Initialize New Voyage State' to register one.
          </div>
        ) : (
          voyages.map((v) => {
            const currentPhaseIdx = phases.indexOf(v.currentPhase);
            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                        {v.voyageNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {v.shipId}
                      </span>
                      {v.taxExemptionActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Duty/Tax-Free Waters
                        </span>
                      )}
                      {v.casinoOpen && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          <Coins className="w-3 h-3" /> Casino Open
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{v.itineraryName}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedVoyageForTz(v);
                        setIsTzModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                    >
                      <Globe2 className="w-3.5 h-3.5 text-indigo-600" /> Timezone Coordinator
                    </button>
                    <button
                      disabled={v.currentPhase === 'CLOSED'}
                      onClick={() => handleOpenTransition(v)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-40"
                    >
                      Advance Phase <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Global Lifecycle Phase Stepper */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Global Phase Operational Stepper
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {phases.map((phase, idx) => {
                      const isPast = idx < currentPhaseIdx;
                      const isCurrent = idx === currentPhaseIdx;
                      return (
                        <div
                          key={phase}
                          className={`p-3 rounded-xl border text-center transition ${
                            isCurrent
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md font-bold'
                              : isPast
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-wider opacity-75">
                            Step {idx + 1}
                          </div>
                          <div className="text-xs font-bold mt-0.5 flex items-center justify-center gap-1">
                            {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {phase}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metadata & Operating Rules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Current Location / Port:</span>
                    <strong className="text-slate-800 text-xs">
                      {v.currentPortName || 'International Waters'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Ship Timezone:</span>
                    <strong className="text-slate-800 text-xs">
                      {v.currentTimezone} (+{v.vesselClockOffsetMinutes} mins)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Last Transitioned:</span>
                    <span className="text-slate-600 font-medium">
                      {new Date(v.phaseTransitionedAt).toLocaleString()} by {v.transitionedBy}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Reason:</span>
                    <span className="text-slate-600 italic">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Advance Voyage Operational Phase
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Voyage: <strong>{transitionVoyage.voyageNumber}</strong> (Current Phase:{' '}
              <span className="font-bold text-indigo-600">{transitionVoyage.currentPhase}</span>)
            </p>

            <form onSubmit={handleConfirmTransition} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Next Phase</label>
                <select
                  value={targetPhase}
                  onChange={(e) => setTargetPhase(e.target.value as VoyageOperationalPhase)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none font-bold"
                >
                  <option value="PLANNING">PLANNING</option>
                  <option value="EMBARKING">EMBARKING (Boarding Gates Open)</option>
                  <option value="AT_SEA">AT_SEA (International Waters - Tax Exempt & Casino)</option>
                  <option value="PORT_VISIT">PORT_VISIT (Docked - Local Port Tax Applies)</option>
                  <option value="DEBARKING">DEBARKING (Final Luggage & Offboarding)</option>
                  <option value="CLOSED">CLOSED (Terminal State)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Port Name (If Port Visit / Embarking)</label>
                <input
                  type="text"
                  placeholder="e.g. Mykonos Port, Greece"
                  value={currentPortName}
                  onChange={(e) => setCurrentPortName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transition Log Reason</label>
                <textarea
                  rows={2}
                  required
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransitionOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Initialize Voyage State</h3>
            <p className="text-xs text-slate-500 mb-4">Register new voyage in the state machine.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Voyage Number</label>
                <input
                  type="text"
                  required
                  value={newVoyageNumber}
                  onChange={(e) => setNewVoyageNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ship Identifier</label>
                <input
                  type="text"
                  required
                  value={newShipId}
                  onChange={(e) => setNewShipId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Itinerary Name</label>
                <input
                  type="text"
                  required
                  value={newItineraryName}
                  onChange={(e) => setNewItineraryName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
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
