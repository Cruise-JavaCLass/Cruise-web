import React, { useState, useEffect } from 'react';
import {
  solasMusterService,
  type SolasMusterIncident,
  type SolasEmergencyType,
} from '../../services/solasMusterService';

export const BridgeMusterCommandConsole: React.FC = () => {
  const [activeMuster, setActiveMuster] = useState<SolasMusterIncident | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [emergencyType, setEmergencyType] = useState<SolasEmergencyType>('FIRE_ALARM');
  const [announcementText, setAnnouncementText] = useState<string>(
    'Attention all passengers and crew: General Emergency. Proceed to muster stations.'
  );
  const [broadcasting, setBroadcasting] = useState<boolean>(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const fetchActiveMuster = async () => {
    try {
      setLoading(true);
      setError(null);
      const incident = await solasMusterService.getActiveMuster();
      setActiveMuster(incident);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch active muster incident');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveMuster();
    const interval = setInterval(fetchActiveMuster, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleBroadcast = async () => {
    if (!window.confirm('WARNING: You are about to initiate a VESSEL-WIDE SOLAS EMERGENCY ALARM. Proceed?')) {
      return;
    }
    try {
      setBroadcasting(true);
      setBroadcastSuccess(null);
      setError(null);

      const incident = await solasMusterService.triggerEmergencyMuster({
        emergencyType,
        triggeredBy: 'Bridge Officer on Duty',
        announcementText
      });
      setActiveMuster(incident);
      setBroadcastSuccess('GENERAL EMERGENCY ALARM BROADCASTED SUCCESSFULLY TO ALL TERMINALS');
    } catch (err: any) {
      setError(err?.message || 'Failed to trigger SOLAS emergency broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleAllClear = async () => {
    if (!activeMuster?.id) return;
    if (!window.confirm('Confirm ALL CLEAR signal broadcast across vessel?')) {
      return;
    }
    try {
      setBroadcasting(true);
      setError(null);
      const incident = await solasMusterService.setAllClear(activeMuster.id);
      setActiveMuster(incident);
      setBroadcastSuccess('ALL-CLEAR SIGNAL TRANSMITTED. ALARMS DEACTIVATED.');
    } catch (err: any) {
      setError(err?.message || 'Failed to transmit All-Clear');
    } finally {
      setBroadcasting(false);
    }
  };

  const totalSouls = activeMuster?.totalSoulsOnBoard || 0;
  const musteredSouls = activeMuster?.musteredSoulsCount || 0;
  const completionRate =
    activeMuster?.musterCompletionRate ??
    (totalSouls > 0 ? Math.round((musteredSouls / totalSouls) * 100) : 0);

  const headCounts = activeMuster?.headCountByStation || {};
  const stationEntries = Object.entries(headCounts);

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
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Incident Status: {activeMuster?.status || 'STANDBY'} {activeMuster ? `(${activeMuster.incidentCode})` : ''}
          </p>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={fetchActiveMuster}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded border border-slate-700 text-slate-200 transition"
          >
            {loading ? 'Refreshing...' : 'Refresh Telemetry'}
          </button>
          {activeMuster && activeMuster.status !== 'ALL_CLEAR' && (
            <button
              onClick={handleAllClear}
              disabled={broadcasting}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-xs font-bold rounded text-white shadow transition"
            >
              Broadcast All-Clear
            </button>
          )}
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
              {musteredSouls} / {totalSouls} <span className="text-sm font-normal text-slate-400">souls accounted for</span>
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-cyan-400">{completionRate}%</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completionRate >= 100
                ? 'bg-emerald-500'
                : completionRate >= 70
                ? 'bg-amber-400'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Grid: Station Tallies + Emergency Broadcast Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Muster Stations Grid */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Muster Station Headcount Breakdown
          </h3>
          {stationEntries.length === 0 ? (
            <div className="p-4 bg-slate-800/40 rounded border border-slate-800 text-center text-sm text-slate-500">
              No station check-ins reported yet or standby mode.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stationEntries.map(([code, count]) => (
                <div
                  key={code}
                  className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-700 hover:border-slate-600 transition flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-white text-base">Station {code}</div>
                    <span className="text-xs text-slate-400">Headcount tally</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-emerald-400">{count}</span>
                    <span className="text-xs text-slate-400 block">souls checked in</span>
                  </div>
                </div>
              ))}
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
                <label htmlFor="muster-emergency-type" className="block text-slate-400 mb-1">Emergency Type</label>
                <select
                  id="muster-emergency-type"
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value as SolasEmergencyType)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-red-500"
                >
                  <option value="GENERAL_EMERGENCY">GENERAL EMERGENCY</option>
                  <option value="FIRE_ALARM">FIRE ALARM</option>
                  <option value="ABANDON_SHIP">ABANDON SHIP</option>
                  <option value="MAN_OVERBOARD">MAN OVERBOARD</option>
                  <option value="DRILL_PRACTICE">DRILL PRACTICE</option>
                </select>
              </div>

              <div>
                <label htmlFor="muster-announcement" className="block text-slate-400 mb-1">Announcement Broadcast Message</label>
                <textarea
                  id="muster-announcement"
                  rows={3}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
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
