import {
  Clock,
  Radio,
  RefreshCw,
  Search,
  UserCheck,
  UserX,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AllAboardStatusDto,
  type MissingPassengerDto,
  allAboardWatchdogService,
} from '../../services/allAboardWatchdogService';

interface BridgeAllAboardBoardProps {
  tourId: number;
  portCallId: number;
  onOpenSearchPartyCoordinator?: (passenger: MissingPassengerDto) => void;
}

export const BridgeAllAboardBoard: React.FC<BridgeAllAboardBoardProps> = ({
  tourId,
  portCallId,
  onOpenSearchPartyCoordinator,
}) => {
  const [status, setStatus] = useState<AllAboardStatusDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const activePortCallRef = useRef({ tourId, portCallId });
  const inFlightRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const [receivedAt, setReceivedAt] = useState(() => Date.now());
  const requestSeq = useRef(0);

  const fetchStatus = useCallback(async () => {
    const seq = ++requestSeq.current;
    inFlightRef.current = true;
    try {
      setLoading(true);
      setError(null);
      const data = await allAboardWatchdogService.getStatus(tourId, portCallId);
      if (seq === requestSeq.current) {
        setStatus(data);
        setReceivedAt(Date.now());
      }
    } catch (err: unknown) {
      if (seq === requestSeq.current) {
        const message = err instanceof Error ? err.message : 'Failed to fetch All-Aboard status';
        setError(message);
      }
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        inFlightRef.current = false;
      }
    }
  }, [tourId, portCallId]);

  useEffect(() => {
    activePortCallRef.current = { tourId, portCallId };
    setStatus(null);
    setError(null);
    setDispatchError(null);
    inFlightRef.current = false;
    void fetchStatus();
    const interval = setInterval(() => {
      if (!inFlightRef.current) {
        void fetchStatus();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [tourId, portCallId, fetchStatus]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBroadcastAllAshore = async () => {
    if (!window.confirm('Broadcast urgent All-Aboard recall alarm to ALL un-boarded passengers?')) {
      return;
    }
    const capturedTourId = tourId;
    const capturedPortCallId = portCallId;
    try {
      setDispatching(true);
      setDispatchSuccess(null);
      setDispatchError(null);
      const res = await allAboardWatchdogService.dispatchAlert({
        tourId,
        portCallId,
        sendSms: true,
        sendInAppNotification: true,
        broadcastPaSystem: true,
        customUrgentMessage: `ALL-ABOARD CALL: The gangway is closing shortly. Return to the ship immediately!`,
      });
      const deliveredCount = (res.smsSentCount || 0) + (res.inAppSentCount || 0);
      const hasDelivery = deliveredCount > 0 || Boolean(res.paBroadcastTriggered);
      if (hasDelivery) {
        setDispatchSuccess(`Alert sent to ${res.targetedPassengersCount} missing guests (${res.alertBatchId})`);
      } else {
        setDispatchError(`Unsuccessful recall attempt: no messages were delivered (${res.alertBatchId})`);
      }
      if (
        activePortCallRef.current.tourId === capturedTourId &&
        activePortCallRef.current.portCallId === capturedPortCallId
      ) {
        await fetchStatus();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch alert';
      setDispatchError(message);
    } finally {
      setDispatching(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return '00:00:00 (ALL-ABOARD EXPIRED)';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const effectiveSecondsRemaining = status
    ? Math.max(0, status.secondsRemaining - Math.floor((now - receivedAt) / 1000))
    : 0;
  const isExpired = status ? (status.countdownExpired || effectiveSecondsRemaining <= 0) : false;

  const missingList = status?.missingPassengers || [];
  const filteredMissing = missingList.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cabinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phoneNumber && p.phoneNumber.includes(searchQuery))
  );

  return (
    <div className="bg-slate-900 border-2 border-amber-600/60 rounded-2xl p-6 text-slate-100 shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-amber-600/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
            <h2 className="text-xl font-black text-amber-400 uppercase tracking-wider font-mono">
              Port All-Aboard Countdown & Gangway Watchdog
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Port of Call: <strong className="text-slate-200">{status?.portName || 'Port Radar'}</strong> | Tour #{tourId} | Port Call #{portCallId}
          </p>
        </div>

        <div className="flex gap-2 mt-3 sm:mt-0">
          <button
            onClick={() => void fetchStatus()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Radar
          </button>
          <button
            onClick={handleBroadcastAllAshore}
            disabled={dispatching || !status || status.missingAshoreCount === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-xs font-bold rounded-lg text-white shadow-lg transition disabled:opacity-50"
          >
            <Radio className="w-4 h-4 animate-ping" />
            Recall All Ashore
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs">
          {error}
        </div>
      )}
      {dispatchError && (
        <div role="alert" className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs font-semibold">
          {dispatchError}
        </div>
      )}
      {dispatchSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs font-semibold">
          {dispatchSuccess}
        </div>
      )}

      {/* Main Countdown Gauge Banner */}
      <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Timer Box */}
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0 pr-0 md:pr-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Time Until All-Aboard Deadline
          </span>
          <div
            className={`text-2xl lg:text-3xl font-black font-mono tracking-tight ${
              isExpired
                ? 'text-red-500 animate-bounce'
                : effectiveSecondsRemaining < 1800
                ? 'text-red-400'
                : 'text-amber-300'
            }`}
          >
            {status ? formatCountdown(effectiveSecondsRemaining) : '--:--:--'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Gangway Closing: {status ? new Date(status.allAboardTime).toLocaleTimeString() : '--'}
          </span>
        </div>

        {/* Boarding Headcount Progress */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Embarkation Telemetry
              </span>
              <div className="text-xl font-bold text-white mt-0.5">
                {status?.passengersOnBoard ?? 0} / {status?.totalEmbarkedPassengers ?? 0}{' '}
                <span className="text-xs text-slate-400 font-normal">onboard</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-red-400 font-bold block">
                {status?.missingAshoreCount ?? 0} Missing Ashore
              </span>
              <span className="text-2xl font-black font-mono text-cyan-400">
                {status?.aboardPercentage ?? 0}%
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-700 h-3.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (status?.aboardPercentage ?? 0) >= 100
                  ? 'bg-emerald-500'
                  : (status?.aboardPercentage ?? 0) >= 90
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(status?.aboardPercentage ?? 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Missing Passenger Watchdog Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <UserX className="w-4 h-4 text-red-400" />
            Missing Ashore Passengers ({status ? filteredMissing.length : 0})
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search cabin, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {!status ? (
          <div className="p-8 bg-slate-800/40 rounded-xl border border-slate-800 text-center space-y-2">
            <Clock className="w-10 h-10 text-slate-500 animate-spin mx-auto" />
            <p className="text-sm text-slate-400 font-bold font-mono">LOADING ALL-ABOARD TELEMETRY...</p>
          </div>
        ) : missingList.length === 0 ? (
          <div className="p-8 bg-slate-800/40 rounded-xl border border-slate-800 text-center space-y-2">
            <UserCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm text-emerald-400 font-bold">ALL PASSENGERS ACCOUNTED FOR ONBOARD</p>
            <p className="text-xs text-slate-500">No missing or delayed shore party guests detected.</p>
          </div>
        ) : filteredMissing.length === 0 ? (
          <div className="p-8 bg-slate-800/40 rounded-xl border border-slate-800 text-center space-y-2">
            <Search className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-300 font-bold">NO MATCHING PASSENGERS FOUND</p>
            <p className="text-xs text-slate-500">No ashore guests matched your search filter "{searchQuery}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/90 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="p-3">Cabin</th>
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Disembarked At</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMissing.map((p) => (
                  <tr key={p.passengerId} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-mono font-bold text-amber-300">{p.cabinNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{p.fullName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{p.rfidTag || 'No RFID'}</span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(p.disembarkedAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3">
                      <div className="text-slate-300">{p.phoneNumber || 'N/A'}</div>
                      <span className="text-[10px] text-slate-500">ICE: {p.emergencyContact || 'None'}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          p.alertSent
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}
                      >
                        {p.alertSent ? 'ALERTED' : 'UNCONTACTED'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onOpenSearchPartyCoordinator?.(p)}
                        className="px-2.5 py-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded font-medium text-[11px] transition"
                      >
                        Search Party
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
