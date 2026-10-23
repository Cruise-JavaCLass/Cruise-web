import { CheckCircle, ShieldAlert, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  type BlacklistResponse,
  type RfidCardInventoryDto,
  rfidCardService,
} from '../../services/rfidCardService';

interface LostCardQuarantineDrawerProps {
  card: RfidCardInventoryDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LostCardQuarantineDrawer: React.FC<LostCardQuarantineDrawerProps> = ({
  card,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [cardUid, setCardUid] = useState(card?.cardUid || '');
  const [reason, setReason] = useState('GUEST_REPORTED_LOST');
  const [replacementUid, setReplacementUid] = useState('');
  const [reportedBy, setReportedBy] = useState('Front Desk Duty Officer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlacklistResponse | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;

      const timer = setTimeout(() => {
        const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables && focusables.length > 0) {
          focusables[0].focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCloseRef.current();
          return;
        }

        if (e.key === 'Tab' && drawerRef.current) {
          const focusables = Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          );
          if (focusables.length === 0) return;

          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        const prev = previousActiveElement.current;
        if (prev && typeof prev.focus === 'function') {
          requestAnimationFrame(() => prev.focus());
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuarantineAndPair = async () => {
    const targetUid = (card ? card.cardUid : cardUid).trim().toUpperCase();
    if (!targetUid) {
      setError('Card UID is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setResult(null);

      const res = await rfidCardService.blacklistCard({
        cardUid: targetUid,
        reason,
        reportedBy,
        replacementCardUid: replacementUid.trim() || undefined,
      });

      setResult(res);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to blacklist card';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quarantine-drawer-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-xs animate-in fade-in"
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="bg-slate-900 border-l border-red-700/60 w-full max-w-md h-full p-6 text-slate-100 shadow-2xl flex flex-col justify-between overflow-y-auto focus:outline-none"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-red-800/40 pb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
              <h3 id="quarantine-drawer-title" className="text-base font-black uppercase tracking-wider text-red-400 font-mono">
                Card Quarantine & Replacement
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close quarantine drawer"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs">
              {error}
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl space-y-1.5 text-xs text-emerald-200">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                {result.posBlacklistBroadcasted
                  ? 'Card Quarantined & Broadcasted!'
                  : 'Card Quarantined - POS Broadcast Pending'}
              </div>
              <p>Blacklisted UID: <strong className="font-mono text-white">{result.cardUid}</strong></p>
              <p>
                POS Network Broadcast:{' '}
                {result.posBlacklistBroadcasted ? (
                  <span className="text-emerald-400 font-bold">PUSHED</span>
                ) : (
                  <span className="text-amber-400 font-bold">NOT CONFIRMED</span>
                )}
              </p>
              <p>{result.message}</p>
              {result.replacementCardUid && (
                <p>New Paired UID: <strong className="font-mono text-cyan-300">{result.replacementCardUid}</strong></p>
              )}
            </div>
          )}

          {/* Card Info or Input */}
          <div className="space-y-4 text-xs">
            {card ? (
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-1 font-mono">
                <span className="text-slate-400 text-[10px] uppercase block font-sans">Quarantining Card:</span>
                <div className="text-base font-bold text-white">{card.cardUid}</div>
                <div className="text-slate-400 text-xs">
                  Assigned: {card.assignedPassengerName || 'Unassigned'} ({card.assignedCabinNumber || 'No Cabin'})
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="quarantine-card-uid" className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Card UID to Blacklist
                </label>
                <input
                  id="quarantine-card-uid"
                  type="text"
                  placeholder="Scan or type card UID..."
                  value={cardUid}
                  onChange={(e) => setCardUid(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:ring-1 focus:ring-red-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="quarantine-reason" className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                Quarantine Reason
              </label>
              <select
                id="quarantine-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:ring-1 focus:ring-red-500"
              >
                <option value="GUEST_REPORTED_LOST">GUEST REPORTED LOST</option>
                <option value="STOLEN_OR_MISAPPROPRIATED">STOLEN / MISAPPROPRIATED</option>
                <option value="SECURITY_BREACH_SUSPECTED">SECURITY BREACH SUSPECTED</option>
                <option value="PHYSICAL_CHIP_CORRUPTED">PHYSICAL CHIP CORRUPTED</option>
                <option value="VOYAGE_DISEMBARKATION_EXPIRY">VOYAGE DISEMBARKATION EXPIRY</option>
              </select>
            </div>

            <div>
              <label htmlFor="quarantine-replacement-uid" className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                New Replacement Card UID (Optional Pairing)
              </label>
              <input
                id="quarantine-replacement-uid"
                type="text"
                placeholder="Scan blank card UID to pair immediately..."
                value={replacementUid}
                onChange={(e) => setReplacementUid(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-cyan-300 font-mono focus:ring-1 focus:ring-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                If provided, guest Folio and Cabin permissions will be instantly migrated to this new card.
              </span>
            </div>

            <div>
              <label htmlFor="quarantine-reported-by" className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
                Reported By (Officer / Terminal)
              </label>
              <input
                id="quarantine-reported-by"
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 flex justify-end gap-3 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition"
          >
            Close
          </button>
          <button
            onClick={handleQuarantineAndPair}
            disabled={submitting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white shadow-lg transition disabled:opacity-50"
          >
            {submitting ? 'Broadcasting...' : 'Enforce Quarantine & Blacklist'}
          </button>
        </div>
      </div>
    </div>
  );
};
