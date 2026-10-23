import { CheckCircle, Upload, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  type BulkIngestResponse,
  rfidCardService,
} from '../../services/rfidCardService';

interface BulkBatchScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkBatchScannerModal: React.FC<BulkBatchScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [batchNumber, setBatchNumber] = useState(`BATCH-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`);
  const [cardType, setCardType] = useState('MIFARE_CLASSIC_1K');
  const [rawUids, setRawUids] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkIngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;

      const timer = setTimeout(() => {
        const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
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

        if (e.key === 'Tab' && modalRef.current) {
          const focusables = Array.from(
            modalRef.current.querySelectorAll<HTMLElement>(
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

  const handleIngest = async () => {
    const uids = rawUids
      .split(/[\n,;]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (uids.length === 0) {
      setError('Please provide at least one RFID UID (line-separated or comma-separated).');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setResult(null);

      const res = await rfidCardService.ingestBatch({
        batchNumber,
        cardType,
        cardUids: uids,
        notes: notes.trim() || undefined,
      });

      setResult(res);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to ingest batch';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-batch-scanner-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-slate-900 border-2 border-cyan-600 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl focus:outline-none"
      >
        {/* Header */}
        <div className="bg-cyan-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-white" />
            <h3 id="bulk-batch-scanner-title" className="text-base font-black uppercase tracking-wider text-white">
              Bulk RFID / NFC Card Ingestion
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close batch scanner"
            className="p-1 rounded-lg text-cyan-200 hover:text-white hover:bg-cyan-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs min-h-0 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-red-200">
              {error}
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-500 rounded-xl space-y-1 text-emerald-200">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Batch Ingested Successfully!
              </div>
              <p>Total Submitted: {result.totalSubmitted}</p>
              <p>Successfully Registered: {result.successfullyIngested}</p>
              <p>Duplicates Skipped: {result.duplicateSkipped}</p>
            </div>
          )}

          <div>
            <label htmlFor="batch-modal-batch-no" className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
              Batch Number / Identifier
            </label>
            <input
              id="batch-modal-batch-no"
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label htmlFor="batch-modal-chip-arch" className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
              Chip Architecture
            </label>
            <select
              id="batch-modal-chip-arch"
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:ring-1 focus:ring-cyan-500"
            >
              <option value="MIFARE_CLASSIC_1K">MIFARE Classic 1K (ISO 14443A)</option>
              <option value="MIFARE_DESFIRE_EV2">MIFARE DESFire EV2 (Encrypted)</option>
              <option value="NFC_NTAG213">NFC NTAG213 / Forum Type 2</option>
            </select>
          </div>

          <div>
            <label htmlFor="batch-modal-uids" className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
              Card UIDs (Scan or Paste from RFID Reader)
            </label>
            <textarea
              id="batch-modal-uids"
              rows={5}
              value={rawUids}
              onChange={(e) => setRawUids(e.target.value)}
              placeholder="04A1B2C3D4&#10;04F9E8D7C6&#10;E2003411B80..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono placeholder-slate-600 focus:ring-1 focus:ring-cyan-500"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Accepts newline or comma-separated hexadecimal card UIDs.
            </span>
          </div>

          <div>
            <label htmlFor="batch-modal-notes" className="block text-slate-400 font-bold uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="batch-modal-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional batch ingestion notes..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-600 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 px-6 py-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-white transition"
          >
            Close
          </button>
          <button
            onClick={handleIngest}
            disabled={submitting}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white shadow-lg transition disabled:opacity-50"
          >
            {submitting ? 'Ingesting Batch...' : 'Register Cards'}
          </button>
        </div>
      </div>
    </div>
  );
};
