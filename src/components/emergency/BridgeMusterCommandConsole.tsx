import React, { useState, useEffect, useRef } from 'react';
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

  const fetchTokenRef = useRef(0);

  const fetchActiveMuster = async () => {
    const token = ++fetchTokenRef.current;
    try {
      setLoading(true);
      setError(null);
      const incident = await solasMusterService.getActiveMuster();
      if (token === fetchTokenRef.current) {
        setActiveMuster(incident);
      }
    } catch (err: any) {
      if (token === fetchTokenRef.current) {
        setError(err?.message || 'Failed to fetch active muster incident');
      }
    } finally {
      if (token === fetchTokenRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchActiveMuster();
    const interval = setInterval(() => {
      void fetchActiveMuster();
    }, 8000);
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

      fetchTokenRef.current += 1;
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
      fetchTokenRef.current += 1;
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
    <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 text-[#252B32] shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#E5E0D7] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
            <h2 className="text-xl font-bold tracking-wider text-[#102A43] uppercase font-mono">
              Bridge SOLAS Command & Muster Telemetry Console
            </h2>
          </div>
          <p className="text-xs text-[#252B32]/60 mt-1 font-mono">
            Incident Status: {activeMuster?.status || 'STANDBY'} {activeMuster ? `(${activeMuster.incidentCode})` : ''}
          </p>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={fetchActiveMuster}
            disabled={loading}
            className="px-3.5 py-1.5 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-xs font-semibold rounded-xl border border-[#E5E0D7] text-[#102A43] transition-colors cursor-pointer"
          >
            {loading ? 'Refreshing...' : 'Refresh Telemetry'}
          </button>
          {activeMuster && activeMuster.status !== 'ALL_CLEAR' && (
            <button
              onClick={handleAllClear}
              disabled={broadcasting}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-xs font-bold rounded-xl text-white shadow-xs transition-colors cursor-pointer"
            >
              Broadcast All-Clear
            </button>
          )}
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}
      {broadcastSuccess && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
          {broadcastSuccess}
        </div>
      )}

      {/* Overall Muster Progress Gauge */}
      <div className="bg-[#F7F4ED] p-5 rounded-xl border border-[#E5E0D7] mb-6">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#252B32]/70 font-semibold">
              Total Vessel Muster Progress
            </span>
            <div className="text-2xl font-black text-[#102A43] mt-1">
              {musteredSouls} / {totalSouls} <span className="text-sm font-normal text-[#252B32]/70">souls accounted for</span>
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-[#102A43]">{completionRate}%</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E5E0D7] h-3.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completionRate >= 100
                ? 'bg-emerald-600'
                : completionRate >= 70
                ? 'bg-amber-500'
                : 'bg-rose-600'
            }`}
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Grid: Station Tallies + Emergency Broadcast Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Muster Stations Grid */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#102A43] font-mono">
            Muster Station Headcount Breakdown
          </h3>
          {stationEntries.length === 0 ? (
            <div className="p-4 bg-[#F7F4ED]/50 rounded-xl border border-[#E5E0D7] text-center text-xs text-[#252B32]/60">
              No station check-ins reported yet or standby mode.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stationEntries.map(([code, count]) => (
                <div
                  key={code}
                  className="p-3.5 bg-white rounded-xl border border-[#E5E0D7] hover:border-[#102A43]/30 transition-colors flex justify-between items-center shadow-2xs"
                >
                  <div>
                    <div className="font-bold text-[#102A43] text-sm">Station {code}</div>
                    <span className="text-xs text-[#252B32]/60">Headcount tally</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-emerald-700">{count}</span>
                    <span className="text-xs text-[#252B32]/60 block">souls checked in</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Trigger Controls */}
        <div className="bg-rose-50/60 border border-rose-200 p-5 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-800 font-mono mb-3">
              Bridge Emergency Override
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor="muster-emergency-type" className="block text-xs font-semibold text-rose-900 mb-1">Emergency Type</label>
                <select
                  id="muster-emergency-type"
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value as SolasEmergencyType)}
                  className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-[#252B32] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                >
                  <option value="GENERAL_EMERGENCY">GENERAL EMERGENCY</option>
                  <option value="FIRE_ALARM">FIRE ALARM</option>
                  <option value="ABANDON_SHIP">ABANDON SHIP</option>
                  <option value="MAN_OVERBOARD">MAN OVERBOARD</option>
                  <option value="DRILL_PRACTICE">DRILL PRACTICE</option>
                </select>
              </div>

              <div>
                <label htmlFor="muster-announcement" className="block text-xs font-semibold text-rose-900 mb-1">Announcement Broadcast Message</label>
                <textarea
                  id="muster-announcement"
                  rows={3}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-[#252B32] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-rose-200">
            <button
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="w-full py-3 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white font-bold tracking-widest text-xs uppercase rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {broadcasting ? 'TRANSMITTING...' : 'TRIGGER VESSEL-WIDE ALARM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
