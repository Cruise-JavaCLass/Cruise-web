import { AlertTriangle, Megaphone, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  type OperationalNotificationEvent,
  operationalNotificationService,
} from '../../services/operationalNotificationService';

export const UrgentOperationalBanner: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<OperationalNotificationEvent | null>(null);
  const [alertQueue, setAlertQueue] = useState<OperationalNotificationEvent[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleDismiss = () => {
    setAlertQueue((prevQueue) => {
      if (prevQueue.length > 0) {
        const [nextAlert, ...rest] = prevQueue;
        setActiveAlert(nextAlert);
        return rest;
      }
      setActiveAlert(null);
      return [];
    });
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = operationalNotificationService.createAlertEventSource();

      eventSource.addEventListener('OPERATIONAL_ALERT', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data) as OperationalNotificationEvent;
          
          setActiveAlert((current) => {
            if (current && current.requireAcknowledgment) {
              // Current alert requires acknowledgment, queue incoming alert
              setAlertQueue((q) => [...q, parsed]);
              return current;
            }
            return parsed;
          });

          // Web Audio API or beep fallback if sound enabled
          if (parsed.playAlertSound && typeof window !== 'undefined' && 'AudioContext' in window) {
            try {
              if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
              }
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              audioContextRef.current = audioCtx;
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
              gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.6);
              osc.onended = () => {
                audioCtx.close().catch(() => {});
                if (audioContextRef.current === audioCtx) {
                  audioContextRef.current = null;
                }
              };
            } catch {
              // audio context blocked or unsupported
            }
          }
        } catch (err) {
          console.error('Failed to parse SSE operational alert:', err);
        }
      });
    } catch (e) {
      console.warn('Could not establish operational alert SSE connection:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  if (!activeAlert) return null;

  const isCritical = activeAlert.category === 'CRITICAL';

  return (
    <div
      role={isCritical ? 'alert' : 'status'}
      aria-live={isCritical ? 'assertive' : 'polite'}
      className={`w-full px-4 py-3 flex items-center justify-between text-white shadow-lg animate-in slide-in-from-top duration-300 z-40 ${
        isCritical
          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700'
          : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700'
      }`}
    >
      <div className="flex items-center gap-3 max-w-4xl">
        <div className="p-2 bg-white/20 rounded-lg shrink-0">
          {isCritical ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <Megaphone className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded">
              {activeAlert.category}
            </span>
            <span className="font-bold text-sm leading-tight">{activeAlert.title}</span>
            {alertQueue.length > 0 && (
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono">
                +{alertQueue.length} tin chờ
              </span>
            )}
          </div>
          <p className="text-xs opacity-95 mt-0.5 line-clamp-2">{activeAlert.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeAlert.requireAcknowledgment && (
          <button
            onClick={handleDismiss}
            className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors shrink-0"
          >
            Đã Nhận Tin
          </button>
        )}
        {!activeAlert.requireAcknowledgment && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-white/20 transition-colors text-white shrink-0"
            title="Đóng banner"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
