import React, { useState } from 'react';
import {
  Clock,
  Globe2,
  Calendar,
  X,
  CheckCircle,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import type {
  VoyageLifecycleState,
  TimezoneShiftScheduleResponse,
  SyncPortTimezoneRequest,
} from '../../services/voyageLifecycleTypes';
import { voyageLifecycleService } from '../../services/voyageLifecycleService';

export const formatOffset = (m: number) => `${m >= 0 ? '+' : ''}${m}`;

interface MaritimeTimezoneSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  voyage: VoyageLifecycleState | null;
  onTimezoneUpdated: (updated: VoyageLifecycleState) => void;
}

export const MaritimeTimezoneSchedulerModal: React.FC<MaritimeTimezoneSchedulerModalProps> = ({
  isOpen,
  onClose,
  voyage,
  onTimezoneUpdated,
}) => {
  const [schedule, setSchedule] = useState<TimezoneShiftScheduleResponse | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [portName, setPortName] = useState(voyage?.currentPortName || 'Piraeus Port (Athens)');
  const [timezone, setTimezone] = useState(voyage?.currentTimezone || 'Europe/Athens');
  const [clockOffsetMinutes, setClockOffsetMinutes] = useState(voyage?.vesselClockOffsetMinutes || 120);
  const [adjustmentReason, setAdjustmentReason] = useState('Port approach vessel clock synchronization');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && voyage) {
      setPortName(voyage.currentPortName || 'Piraeus Port (Athens)');
      setTimezone(voyage.currentTimezone || 'Europe/Athens');
      setClockOffsetMinutes(voyage.vesselClockOffsetMinutes || 0);
      setSuccessMsg(null);
      setError(null);
      setSchedule(null);
      setScheduleError(null);

      let cancelled = false;
      const fetchSchedule = async () => {
        try {
          setLoadingSchedule(true);
          const res = await voyageLifecycleService.getTimezoneSchedule(voyage.voyageNumber);
          if (!cancelled && res) setSchedule(res);
        } catch {
          if (!cancelled) setScheduleError('Failed to load timezone schedule');
        } finally {
          if (!cancelled) setLoadingSchedule(false);
        }
      };
      void fetchSchedule();
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [isOpen, voyage?.voyageNumber]);

  if (!isOpen || !voyage) return null;

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const req: SyncPortTimezoneRequest = {
        portName,
        timezone,
        clockOffsetMinutes,
        adjustmentReason,
      };
      const updated = await voyageLifecycleService.syncPortTimezone(voyage.voyageNumber, req);
      onTimezoneUpdated(updated);
      setSuccessMsg(`Ship master clock synchronized to ${timezone} (Offset: ${formatOffset(clockOffsetMinutes)}m)`);
      try {
        const res = await voyageLifecycleService.getTimezoneSchedule(voyage.voyageNumber);
        if (res) setSchedule(res);
      } catch {
        // ignore background schedule refresh failure
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Timezone synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Maritime Port Timezone Coordinator & Master Clock
              </h3>
              <p className="text-slate-500 text-[11px]">
                Voyage: <strong>{voyage.voyageNumber}</strong> ({voyage.shipId})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {scheduleError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{scheduleError}</span>
          </div>
        )}

        {/* Master Clock Preview Card */}
        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Vessel Master Operating Clock
            </span>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
              {loadingSchedule
                ? 'Synchronizing Clock...'
                : schedule
                ? new Date(schedule.currentShipClockTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : '--:--:--'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Timezone</span>
            <div className="font-semibold text-slate-200 text-xs mt-1">{voyage.currentTimezone}</div>
            <div className="text-[10px] text-indigo-300 font-mono">Offset: {formatOffset(voyage.vesselClockOffsetMinutes)} mins</div>
          </div>
        </div>

        {/* Form: Shift Master Timezone */}
        <form onSubmit={handleSyncSubmit} className="space-y-3 pt-2">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" /> Coordinated Port Timezone Override
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sync-port-name" className="block text-[11px] font-semibold text-slate-600 mb-1">Target Port Name</label>
              <input
                id="sync-port-name"
                type="text"
                required
                value={portName}
                onChange={(e) => setPortName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="sync-timezone" className="block text-[11px] font-semibold text-slate-600 mb-1">Standard IANA Timezone</label>
              <select
                id="sync-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl"
              >
                {voyage.currentTimezone &&
                  ![
                    'Europe/Athens',
                    'Europe/Rome',
                    'Europe/Istanbul',
                    'America/New_York',
                    'America/Halifax',
                    'UTC',
                  ].includes(voyage.currentTimezone) && (
                    <option value={voyage.currentTimezone}>{voyage.currentTimezone}</option>
                  )}
                <option value="Europe/Athens">Europe/Athens (UTC+02:00 / UTC+03:00)</option>
                <option value="Europe/Rome">Europe/Rome (UTC+01:00 / UTC+02:00)</option>
                <option value="Europe/Istanbul">Europe/Istanbul (UTC+03:00)</option>
                <option value="America/New_York">America/New_York (EST / EDT)</option>
                <option value="America/Halifax">America/Halifax (AST)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sync-clock-offset" className="block text-[11px] font-semibold text-slate-600 mb-1">Clock Offset Minutes (+/-)</label>
              <input
                id="sync-clock-offset"
                type="number"
                step="30"
                value={clockOffsetMinutes}
                onChange={(e) => setClockOffsetMinutes(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label htmlFor="sync-adjustment-reason" className="block text-[11px] font-semibold text-slate-600 mb-1">Log Shift Reason</label>
              <input
                id="sync-adjustment-reason"
                type="text"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            {loading ? 'Coordinating Ship Clock...' : 'Broadcast Master Clock Timezone Shift'}
          </button>
        </form>

        {/* Planned Timezone Shifts */}
        {schedule && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Planned Itinerary Timezone Shifts
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {schedule.plannedPortShifts.map((shift, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px]"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{shift.portName}</span>
                    <span className="text-slate-400 ml-1.5">({shift.timezone})</span>
                  </div>
                  <span className="font-mono text-indigo-600 font-bold">
                    {formatOffset(shift.clockOffsetMinutes)}m offset
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
