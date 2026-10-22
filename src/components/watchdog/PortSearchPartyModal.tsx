import {
  AlertCircle,
  CheckCircle,
  Megaphone,
  MessageSquare,
  PhoneCall,
  Search,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  type MissingPassengerDto,
  allAboardWatchdogService,
} from '../../services/allAboardWatchdogService';

interface PortSearchPartyModalProps {
  passenger: MissingPassengerDto | null;
  tourId: number;
  portCallId: number;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const PortSearchPartyModal: React.FC<PortSearchPartyModalProps> = ({
  passenger,
  tourId,
  portCallId,
  onClose,
  onActionComplete,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [customMsg, setCustomMsg] = useState(
    'FINAL CALL: All-Aboard countdown closing. Please return to the gangway now!'
  );

  if (!passenger) return null;

  const handleSendDirectAlert = async (type: 'SMS' | 'IN_APP' | 'PA') => {
    try {
      setSubmitting(true);
      setFeedback(null);
      await allAboardWatchdogService.dispatchAlert({
        tourId,
        portCallId,
        passengerIds: [passenger.passengerId],
        sendSms: type === 'SMS',
        sendInAppNotification: type === 'IN_APP',
        broadcastPaSystem: type === 'PA',
        customUrgentMessage: customMsg,
        dispatchedBy: 'Port Search Party Coordinator',
      });
      setFeedback(`Direct ${type} alert successfully dispatched to ${passenger.fullName}`);
      onActionComplete?.();
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to dispatch alert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallEmergencyContact = () => {
    if (passenger.emergencyContact) {
      window.open(`tel:${passenger.emergencyContact}`);
    } else {
      alert('No emergency ICE contact registered for this passenger.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl w-full max-w-lg overflow-hidden text-slate-100 shadow-2xl">
        {/* Modal Header */}
        <div className="bg-amber-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-white" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              Port Search Party Coordinator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Passenger Brief Card */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-white">{passenger.fullName}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  Cabin: <strong className="text-amber-300">{passenger.cabinNumber}</strong> | RFID: {passenger.rfidTag || 'None'}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded text-xs font-mono">
                DISEMBARKED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60 font-mono">
              <div>
                <span className="text-slate-500 block">Phone:</span>
                <span className="text-slate-200 font-medium">{passenger.phoneNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">ICE Contact:</span>
                <span className="text-slate-200 font-medium">{passenger.emergencyContact || 'N/A'}</span>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="p-3 bg-amber-950/80 border border-amber-500 rounded-lg text-amber-200 text-xs">
              {feedback}
            </div>
          )}

          {/* Quick Action Triggers */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Direct Contact & Alert Protocols:
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSendDirectAlert('SMS')}
                disabled={submitting || !passenger.phoneNumber}
                className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-xs font-bold text-slate-200 transition"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Dispatch Direct SMS
              </button>

              <button
                onClick={() => handleSendDirectAlert('IN_APP')}
                disabled={submitting}
                className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-xs font-bold text-slate-200 transition"
              >
                <Megaphone className="w-4 h-4 text-amber-400" />
                Push Urgent App Alert
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCallEmergencyContact}
                className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-xs font-bold text-emerald-400 transition"
              >
                <PhoneCall className="w-4 h-4" />
                Call ICE Emergency
              </button>

              <button
                onClick={() => handleSendDirectAlert('PA')}
                disabled={submitting}
                className="flex items-center justify-center gap-2 p-3 bg-red-950/40 hover:bg-red-900/50 rounded-xl border border-red-800 text-xs font-bold text-red-300 transition"
              >
                <ShieldAlert className="w-4 h-4" />
                Terminal PA Page
              </button>
            </div>
          </div>

          {/* Search Party Dispatch Directive */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Search Party Dispatch Notes:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dispatched local port security team to Marina shopping district..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-800/80 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white transition"
          >
            Close Coordinator
          </button>
        </div>
      </div>
    </div>
  );
};
