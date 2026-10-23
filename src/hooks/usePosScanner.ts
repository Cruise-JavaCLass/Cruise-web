import { useState, useEffect, useCallback, useRef } from 'react';
import type { CredentialType, ScanResult } from '../services/posAuthTypes';

interface UsePosScannerOptions {
  onScan?: (result: ScanResult) => void;
  debounceMs?: number;
}

export function parseScannerInput(input: string): { type: CredentialType; value: string } {
  const trimmed = input.trim();
  if (trimmed.startsWith('QR:')) {
    return { type: 'QR', value: trimmed };
  }
  if (trimmed.startsWith('CARD:')) {
    return { type: 'CARD', value: trimmed };
  }
  if (trimmed.startsWith('RFID:')) {
    return { type: 'RFID', value: trimmed };
  }
  if (trimmed.startsWith('%') || trimmed.startsWith(';') || /^[0-9]{16}$/.test(trimmed)) {
    return { type: 'CARD', value: `CARD:${trimmed}` };
  }
  if (/^[0-9A-Fa-f]{8,14}$/.test(trimmed)) {
    return { type: 'RFID', value: `RFID:${trimmed.toUpperCase()}` };
  }
  return { type: 'QR', value: `QR:${trimmed}` };
}

export function usePosScanner({ onScan, debounceMs = 150 }: UsePosScannerOptions = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const handleScanComplete = useCallback(
    (rawCredential: string) => {
      const parsed = parseScannerInput(rawCredential);
      const result: ScanResult = {
        rawCredential: parsed.value,
        type: parsed.type,
        timestamp: Date.now(),
      };
      setLastScan(result);
      if (onScan) {
        onScan(result);
      }
    },
    [onScan]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is typing in regular input/textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const now = Date.now();
      // Hardware barcode / card wedge scanners send keys rapidly (< 50ms)
      if (now - lastKeyTimeRef.current > debounceMs) {
        bufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.trim().length > 0) {
          handleScanComplete(bufferRef.current.trim());
          bufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [debounceMs, handleScanComplete]);

  const simulateScan = useCallback(
    (input: string) => {
      handleScanComplete(input);
    },
    [handleScanComplete]
  );

  return {
    isScanning,
    setIsScanning,
    lastScan,
    simulateScan,
  };
}
