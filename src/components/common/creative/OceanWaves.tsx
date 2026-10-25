import { useEffect, useRef, type CSSProperties } from 'react';

export interface OceanWavesProps {
  className?: string;
  style?: CSSProperties;
  waveColor?: string;
  crestColor?: string;
  waveCount?: number;
  speed?: number;
  amplitude?: number;
  paused?: boolean;
}

export function OceanWaves({
  className = '',
  style,
  waveColor = 'rgba(14, 165, 233, 0.12)', // Ocean sky/cyan
  crestColor = 'rgba(56, 189, 248, 0.25)',
  waveCount = 3,
  speed = 0.0015,
  amplitude = 24,
  paused = false,
}: OceanWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;
    let isAlive = true;

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!isAlive || !canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      if (!paused) {
        step += speed * 16;
      }

      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        const baseOffset = height * 0.65 + i * 16;
        const currentAmp = amplitude * (1 - i * 0.18);
        const freq = 0.0035 + i * 0.001;
        const phase = step + i * 1.8;

        ctx.moveTo(0, height);
        ctx.lineTo(0, baseOffset);

        for (let x = 0; x <= width; x += 8) {
          const y = baseOffset + Math.sin(x * freq + phase) * currentAmp + Math.cos(x * 0.002 + phase * 0.8) * 8;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseOffset - currentAmp, 0, height);
        grad.addColorStop(0, crestColor);
        grad.addColorStop(1, waveColor);

        ctx.fillStyle = grad;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isAlive = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [waveColor, crestColor, waveCount, speed, amplitude, paused]);

  return (
    <div className={`relative overflow-hidden pointer-events-none ${className}`} style={style}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}

export default OceanWaves;
