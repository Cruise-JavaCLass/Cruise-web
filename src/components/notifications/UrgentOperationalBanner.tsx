import { AlertTriangle, Bell, CheckCircle2, Megaphone, Volume2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  type OperationalNotificationEvent,
  operationalNotificationService,
} from '../../services/operationalNotificationService';

export const UrgentOperationalBanner: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<OperationalNotificationEvent | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = operationalNotificationService.createAlertEventSource();

      eventSource.addEventListener('OPERATIONAL_ALERT', (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data) as OperationalNotificationEvent;
          setActiveAlert(parsed);

          // Web Audio API or beep fallback if sound enabled
          if (parsed.playAlertSound && typeof window !== 'undefined' && 'AudioContext' in window) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 tone
              gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.6);
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
    };
  }, []);

  if (!activeAlert) return null;

  const isCritical = activeAlert.category === 'CRITICAL';

  return (
    <div
      role="alert"
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
          </div>
          <p className="text-xs opacity-95 mt-0.5 line-clamp-2">{activeAlert.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeAlert.requireAcknowledgment && (
          <button
            onClick={() => setActiveAlert(null)}
            className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors shrink-0"
          >
            Đã Nhận Tin
          </button>
        )}
        <button
          onClick={() => setActiveAlert(null)}
          className="p-1 rounded-md hover:bg-white/20 transition-colors text-white shrink-0"
          title="Đóng banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
