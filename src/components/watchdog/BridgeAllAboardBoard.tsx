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
    <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 text-[#252B32] shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#E5E0D7] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
            <h2 className="text-xl font-bold text-[#102A43] uppercase tracking-wider font-mono">
              Port All-Aboard Countdown & Gangway Watchdog
            </h2>
          </div>
          <p className="text-xs text-[#252B32]/60 mt-1 font-mono">
            Port of Call: <strong className="text-[#102A43]">{status?.portName || 'Port Radar'}</strong> | Tour #{tourId} | Port Call #{portCallId}
          </p>
        </div>

        <div className="flex gap-2 mt-3 sm:mt-0">
          <button
            onClick={() => void fetchStatus()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-xs font-semibold rounded-xl border border-[#E5E0D7] text-[#102A43] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Radar
          </button>
          <button
            onClick={handleBroadcastAllAshore}
            disabled={dispatching || !status || status.missingAshoreCount === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-xs font-bold rounded-xl text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Radio className="w-4 h-4 animate-ping" />
            Recall All Ashore
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}
      {dispatchError && (
        <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
          {dispatchError}
        </div>
      )}
      {dispatchSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
          {dispatchSuccess}
        </div>
      )}

      {/* Main Countdown Gauge Banner */}
      <div className="bg-[#F7F4ED] rounded-xl p-5 border border-[#E5E0D7] grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Timer Box */}
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-[#E5E0D7] pb-4 md:pb-0 pr-0 md:pr-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#252B32]/70 block mb-1">
            Time Until All-Aboard Deadline
          </span>
          <div
            className={`text-2xl lg:text-3xl font-black font-mono tracking-tight ${
              isExpired
                ? 'text-rose-600 animate-bounce'
                : effectiveSecondsRemaining < 1800
                ? 'text-rose-600'
                : 'text-[#102A43]'
            }`}
          >
            {status ? formatCountdown(effectiveSecondsRemaining) : '--:--:--'}
          </div>
          <span className="text-[11px] text-[#252B32]/60 mt-1 block">
            Gangway Closing: {status ? new Date(status.allAboardTime).toLocaleTimeString() : '--'}
          </span>
        </div>

        {/* Boarding Headcount Progress */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#252B32]/70 font-semibold">
                Embarkation Telemetry
              </span>
              <div className="text-xl font-bold text-[#102A43] mt-0.5">
                {status?.passengersOnBoard ?? 0} / {status?.totalEmbarkedPassengers ?? 0}{' '}
                <span className="text-xs text-[#252B32]/60 font-normal">onboard</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-rose-700 font-bold block">
                {status?.missingAshoreCount ?? 0} Missing Ashore
              </span>
              <span className="text-2xl font-black font-mono text-[#397C80]">
                {status?.aboardPercentage ?? 0}%
              </span>
            </div>
          </div>

          <div className="w-full bg-[#E5E0D7] h-3.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (status?.aboardPercentage ?? 0) >= 100
                  ? 'bg-emerald-600'
                  : (status?.aboardPercentage ?? 0) >= 90
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${Math.min(status?.aboardPercentage ?? 0, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Missing Passenger Watchdog Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#102A43] font-mono flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-600" />
            Missing Ashore Passengers ({status ? filteredMissing.length : 0})
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#252B32]/40" />
            <input
              type="text"
              placeholder="Search cabin, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-[#E5E0D7] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>
        </div>

        {!status ? (
          <div className="p-8 bg-[#F7F4ED]/50 rounded-xl border border-[#E5E0D7] text-center space-y-2">
            <Clock className="w-10 h-10 text-[#252B32]/40 animate-spin mx-auto" />
            <p className="text-sm text-[#252B32]/60 font-bold font-mono">LOADING ALL-ABOARD TELEMETRY...</p>
          </div>
        ) : missingList.length === 0 ? (
          <div className="p-8 bg-emerald-50/50 rounded-xl border border-emerald-200 text-center space-y-2">
            <UserCheck className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm text-emerald-800 font-bold">ALL PASSENGERS ACCOUNTED FOR ONBOARD</p>
            <p className="text-xs text-[#252B32]/60">No missing or delayed shore party guests detected.</p>
          </div>
        ) : filteredMissing.length === 0 ? (
          <div className="p-8 bg-[#F7F4ED]/50 rounded-xl border border-[#E5E0D7] text-center space-y-2">
            <Search className="w-10 h-10 text-[#252B32]/40 mx-auto" />
            <p className="text-sm text-[#102A43] font-bold">NO MATCHING PASSENGERS FOUND</p>
            <p className="text-xs text-[#252B32]/60">No ashore guests matched your search filter "{searchQuery}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E0D7]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] text-[#102A43] uppercase font-mono text-[11px] border-b border-[#E5E0D7]">
                <tr>
                  <th className="p-3">Cabin</th>
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Disembarked At</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D7] bg-white">
                {filteredMissing.map((p) => (
                  <tr key={p.passengerId} className="hover:bg-[#F7F4ED]/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#102A43]">{p.cabinNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-[#102A43]">{p.fullName}</div>
                      <span className="text-[10px] text-[#252B32]/60 font-mono">{p.rfidTag || 'No RFID'}</span>
                    </td>
                    <td className="p-3 text-[#252B32]/70">
                      {new Date(p.disembarkedAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3">
                      <div className="text-[#252B32]">{p.phoneNumber || 'N/A'}</div>
                      <span className="text-[10px] text-[#252B32]/60">ICE: {p.emergencyContact || 'None'}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          p.alertSent
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {p.alertSent ? 'ALERTED' : 'UNCONTACTED'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onOpenSearchPartyCoordinator?.(p)}
                        className="px-2.5 py-1 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
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
