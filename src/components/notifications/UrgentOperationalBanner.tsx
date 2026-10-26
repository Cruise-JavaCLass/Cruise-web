import { AlertTriangle, Megaphone, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  type OperationalNotificationEvent,
  operationalNotificationService,
} from '../../services/operationalNotificationService';

export const UrgentOperationalBanner: React.FC = () => {
  const [alertState, setAlertState] = useState<{
    active: OperationalNotificationEvent | null;
    queue: OperationalNotificationEvent[];
  }>({ active: null, queue: [] });
  const { active: activeAlert, queue: alertQueue } = alertState;
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleDismiss = () => {
    setAlertState((prev) => {
      if (prev.queue.length > 0) {
        const [nextAlert, ...rest] = prev.queue;
        return { active: nextAlert, queue: rest };
      }
      return { active: null, queue: [] };
    });
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = operationalNotificationService.createAlertEventSource();

      eventSource.addEventListener('OPERATIONAL_ALERT', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data) as OperationalNotificationEvent;
          
          setAlertState((prev) => {
            if (prev.active && prev.active.requireAcknowledgment) {
              // Current alert requires acknowledgment, queue incoming alert
              return { ...prev, queue: [...prev.queue, parsed] };
            }
            return { ...prev, active: parsed };
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
      className={`w-full px-4 py-3 flex items-center justify-between text-white shadow-md animate-in slide-in-from-top duration-300 z-40 ${
        isCritical
          ? 'bg-rose-800 border-b border-rose-900'
          : 'bg-[#102A43] border-b border-[#0B1F33]'
      }`}
    >
      <div className="flex items-center gap-3 max-w-4xl">
        <div className="p-2 bg-white/20 rounded-lg shrink-0">
          {isCritical ? <AlertTriangle className="w-5 h-5 animate-pulse text-rose-200" /> : <Megaphone className="w-5 h-5 text-[#C5A572]" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded">
              {activeAlert.category}
            </span>
            <span className="font-bold text-sm leading-tight text-white">{activeAlert.title}</span>
            {alertQueue.length > 0 && (
              <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono text-white/90">
                +{alertQueue.length} tin chờ
              </span>
            )}
          </div>
          <p className="text-xs text-white/90 mt-0.5 line-clamp-2">{activeAlert.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeAlert.requireAcknowledgment && (
          <button
            onClick={handleDismiss}
            className="px-3 py-1 bg-white hover:bg-[#F7F4ED] text-[#102A43] rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Đã Nhận Tin
          </button>
        )}
        {!activeAlert.requireAcknowledgment && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-white/20 transition-colors text-white shrink-0 cursor-pointer"
            title="Đóng banner"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
