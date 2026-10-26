import {
  Megaphone,
  MessageSquare,
  PhoneCall,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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
  initialNotes?: string;
  onSaveNotes?: (passengerId: number, notes: string) => void;
}

export const PortSearchPartyModal: React.FC<PortSearchPartyModalProps> = ({
  passenger,
  tourId,
  portCallId,
  onClose,
  onActionComplete,
  initialNotes,
  onSaveNotes,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const customMsg =
    'FINAL CALL: All-Aboard countdown closing. Please return to the gangway now!';

  const storageKey = passenger
    ? `watchdog_notes_${tourId}_${portCallId}_${passenger.passengerId}`
    : '';

  // Load notes on passenger change
  useEffect(() => {
    setFeedback(null);
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      setNotes(initialNotes ?? saved ?? '');
    } else {
      setNotes('');
    }
  }, [passenger?.passengerId, storageKey, initialNotes]);

  // Focus trap and Escape key listener
  useEffect(() => {
    if (!passenger) return;

    previousActiveElement.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Initial focus into modal
    const focusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, [passenger, onClose]);

  if (!passenger) return null;

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (storageKey) {
      localStorage.setItem(storageKey, val);
    }
    if (passenger) {
      onSaveNotes?.(passenger.passengerId, val);
    }
  };

  const handleSendDirectAlert = async (type: 'SMS' | 'IN_APP' | 'PA') => {
    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await allAboardWatchdogService.dispatchAlert({
        tourId,
        portCallId,
        passengerIds: [passenger.passengerId],
        sendSms: type === 'SMS',
        sendInAppNotification: type === 'IN_APP',
        broadcastPaSystem: type === 'PA',
        customUrgentMessage: customMsg,
        dispatchedBy: 'Port Search Party Coordinator',
      });

      const isDelivered =
        type === 'SMS'
          ? (res.smsSentCount || 0) > 0
          : type === 'IN_APP'
          ? (res.inAppSentCount || 0) > 0
          : Boolean(res.paBroadcastTriggered);

      if (isDelivered) {
        setFeedback(`Direct ${type} alert successfully dispatched to ${passenger.fullName}`);
        onActionComplete?.();
      } else {
        setFeedback(`Recall attempt made but ${type} alert was not delivered (0 sent)`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch alert';
      setFeedback(message);
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
      aria-labelledby="search-party-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-lg overflow-hidden text-[#252B32] shadow-2xl focus:outline-none"
      >
        {/* Modal Header */}
        <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#102A43]" />
            <h3 id="search-party-title" className="text-base font-bold uppercase tracking-wider text-[#102A43]">
              Port Search Party Coordinator
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close coordinator"
            className="p-1 rounded-lg text-[#252B32]/60 hover:text-[#102A43] hover:bg-[#ECE7DC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 bg-white">
          {/* Passenger Brief Card */}
          <div className="bg-[#F7F4ED]/60 p-4 rounded-xl border border-[#E5E0D7] space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-[#102A43]">{passenger.fullName}</h4>
                <p className="text-xs text-[#252B32]/60 font-mono">
                  Cabin: <strong className="text-[#102A43]">{passenger.cabinNumber}</strong> | RFID: {passenger.rfidTag || 'None'}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-mono font-semibold">
                DISEMBARKED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#E5E0D7] font-mono">
              <div>
                <span className="text-[#252B32]/60 block">Phone:</span>
                <span className="text-[#252B32] font-medium">{passenger.phoneNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#252B32]/60 block">ICE Contact:</span>
                <span className="text-[#252B32] font-medium">{passenger.emergencyContact || 'N/A'}</span>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
              {feedback}
            </div>
          )}

          {/* Quick Action Triggers */}
          <div className="space-y-3">
            <label htmlFor="search-party-notes" className="text-xs font-bold uppercase tracking-wider text-[#102A43] block">
              Direct Contact & Alert Protocols:
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => void handleSendDirectAlert('SMS')}
                disabled={submitting || !passenger.phoneNumber}
                className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-[#F7F4ED] rounded-xl border border-[#E5E0D7] text-xs font-bold text-[#102A43] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4 text-[#397C80]" />
                Dispatch Direct SMS
              </button>

              <button
                onClick={() => void handleSendDirectAlert('IN_APP')}
                disabled={submitting}
                className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-[#F7F4ED] rounded-xl border border-[#E5E0D7] text-xs font-bold text-[#102A43] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Megaphone className="w-4 h-4 text-amber-600" />
                Push Urgent App Alert
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCallEmergencyContact}
                className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-[#F7F4ED] rounded-xl border border-[#E5E0D7] text-xs font-bold text-emerald-700 transition-colors shadow-2xs cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                Call ICE Emergency
              </button>

              <button
                onClick={() => void handleSendDirectAlert('PA')}
                disabled={submitting}
                className="flex items-center justify-center gap-2 p-3 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4" />
                Terminal PA Page
              </button>
            </div>
          </div>

          {/* Search Party Dispatch Directive */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#102A43] block">
                Search Party Dispatch Notes:
              </label>
              <span className="text-[10px] text-[#252B32]/60 font-mono">Auto-saved to coordination log</span>
            </div>
            <textarea
              id="search-party-notes"
              rows={2}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="e.g. Dispatched local port security team to Marina shopping district..."
              className="w-full bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl p-3 text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F7F4ED] px-6 py-3 border-t border-[#E5E0D7] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Coordinator
          </button>
        </div>
      </div>
    </div>
  );
};
