import React, { useState, useEffect } from 'react';
import {
  solasMusterService,
  MusterStationTallyDto,
  BroadcastTriggerRequest
} from '../../services/solasMusterService';

interface BridgeMusterCommandConsoleProps {
  voyageId: string;
}

export const BridgeMusterCommandConsole: React.FC<BridgeMusterCommandConsoleProps> = ({ voyageId }) => {
  const [tally, setTally] = useState<MusterStationTallyDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState<string>('FIRE_OUTBREAK');
  const [affectedDeck, setAffectedDeck] = useState<string>('Deck 4 Midship');
  const [customInstructions, setCustomInstructions] = useState<string>(
    'Prepare to proceed to your designated Muster Station immediately with warm clothing and lifejackets.'
  );
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const fetchTally = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await solasMusterService.getMusterStationTally(voyageId);
      setTally(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch muster station tallies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTally();
    const interval = setInterval(fetchTally, 10000);
    return () => clearInterval(interval);
  }, [voyageId]);

  const handleBroadcast = async () => {
    if (!window.confirm('WARNING: You are about to initiate a VESSEL-WIDE SOLAS EMERGENCY ALARM. Proceed?')) {
      return;
    }
    try {
      setBroadcasting(true);
      setBroadcastSuccess(null);
      setError(null);

      const payload: BroadcastTriggerRequest = {
        voyageId,
        incidentType,
        affectedDeckZone: affectedDeck,
        customInstructions,
        soundGeneralAlarm: true,
        triggeredBy: 'Bridge Officer on Duty'
      };

      await solasMusterService.triggerEmergencyBroadcast(payload);
      setBroadcastSuccess('GENERAL EMERGENCY ALARM BROADCASTED SUCCESSFULLY TO ALL TERMINALS');
      await fetchTally();
    } catch (err: any) {
      setError(err?.message || 'Failed to trigger SOLAS emergency broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleAllClear = async () => {
    if (!window.confirm('Confirm ALL CLEAR signal broadcast across vessel?')) {
      return;
    }
    try {
      setBroadcasting(true);
      setError(null);
      await solasMusterService.cancelEmergencyAlert(voyageId, 'Drill complete or situation neutralized by Bridge');
      setBroadcastSuccess('ALL-CLEAR SIGNAL TRANSMITTED. ALARMS DEACTIVATED.');
      await fetchTally();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel emergency');
    } finally {
      setBroadcasting(false);
    }
  };

  const totalAssigned = tally.reduce((acc, curr) => acc + curr.assignedPassengerCount, 0);
  const totalCheckedIn = tally.reduce((acc, curr) => acc + curr.checkedInCount, 0);
  const overallPercentage = totalAssigned > 0 ? Math.round((totalCheckedIn / totalAssigned) * 100) : 0;

  return (
    <div className="bg-slate-900 border-2 border-red-700/60 rounded-xl p-6 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-red-800/40 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <h2 className="text-xl font-bold tracking-wider text-red-400 uppercase font-mono">
              Bridge SOLAS Command & Muster Telemetry Console
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Voyage Ref: {voyageId}</p>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={fetchTally}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded border border-slate-700 text-slate-200 transition"
          >
            {loading ? 'Refreshing...' : 'Refresh Telemetry'}
          </button>
          <button
            onClick={handleAllClear}
            disabled={broadcasting}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-xs font-bold rounded text-white shadow transition"
          >
            Broadcast All-Clear
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/60 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
      {broadcastSuccess && (
        <div className="mb-4 p-3 bg-emerald-900/60 border border-emerald-500 rounded text-emerald-200 text-sm">
          {broadcastSuccess}
        </div>
      )}

      {/* Overall Muster Progress Gauge */}
      <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 mb-6">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Total Vessel Muster Progress
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {totalCheckedIn} / {totalAssigned} <span className="text-sm font-normal text-slate-400">souls accounted for</span>
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-cyan-400">{overallPercentage}%</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              overallPercentage >= 100
                ? 'bg-emerald-500'
                : overallPercentage >= 70
                ? 'bg-amber-400'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Grid: Station Tallies + Emergency Broadcast Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Muster Stations Grid */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Muster Station Headcount Stations
          </h3>
          {tally.length === 0 ? (
            <div className="p-4 bg-slate-800/40 rounded border border-slate-800 text-center text-sm text-slate-500">
              No active muster station tallies reporting.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tally.map((st) => {
                const pct = st.assignedPassengerCount > 0
                  ? Math.round((st.checkedInCount / st.assignedPassengerCount) * 100)
                  : 0;
                return (
                  <div
                    key={st.stationCode}
                    className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-700 hover:border-slate-600 transition"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-white text-base">Station {st.stationCode}</div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                          st.allAccountedFor
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : 'bg-amber-950 text-amber-400 border border-amber-700'
                        }`}
                      >
                        {st.allAccountedFor ? '100% ACCOUNTED' : `${pct}% TALLY`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                      Deck: {st.deckZone} | Lifeboat #{st.lifeboatNumber}
                    </div>
                    <div className="flex justify-between text-xs font-mono text-slate-300">
                      <span>Checked-In: <strong>{st.checkedInCount}</strong></span>
                      <span>Missing: <strong className="text-red-400">{st.missingCount}</strong></span>
                      <span>Assigned: <strong>{st.assignedPassengerCount}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Emergency Trigger Controls */}
        <div className="bg-red-950/20 border border-red-800/60 p-4 rounded-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-300 font-mono mb-3">
              Bridge Emergency Override
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Incident Type</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-red-500"
                >
                  <option value="FIRE_OUTBREAK">FIRE OUTBREAK</option>
                  <option value="HULL_BREACH">HULL BREACH / FLOODING</option>
                  <option value="COLLISION_HAZARD">COLLISION HAZARD</option>
                  <option value="MUSTER_DRILL">SCHEDULED MUSTER DRILL</option>
                  <option value="ABANDON_SHIP">ABANDON SHIP PREPARATION</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Affected Deck / Sector</label>
                <input
                  type="text"
                  value={affectedDeck}
                  onChange={(e) => setAffectedDeck(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Custom Broadcast Directive</label>
                <textarea
                  rows={3}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-red-900/40">
            <button
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black tracking-widest text-xs uppercase rounded shadow-lg border border-red-400/50 transition"
            >
              {broadcasting ? 'TRANSMITTING...' : 'TRIGGER VESSEL-WIDE ALARM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
