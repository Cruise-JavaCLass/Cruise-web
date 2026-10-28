import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type Easing = 'smooth' | 'linear' | 'snappy';
type Trigger = 'loop' | 'hover' | 'view';

export interface ShinyTextProps {
  text?: string;
  children?: ReactNode;
  color?: string;
  shineColor?: string;
  speed?: number;
  delay?: number;
  angle?: number;
  shineWidth?: number;
  softness?: number;
  bands?: number;
  glow?: number;
  direction?: 'left' | 'right';
  easing?: Easing;
  trigger?: Trigger;
  yoyo?: boolean;
  followPointer?: boolean;
  pauseOnHover?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  color: string;
  shineColor: string;
  speed: number;
  delay: number;
  angle: number;
  shineWidth: number;
  softness: number;
  bands: number;
  glow: number;
  sign: number;
  ease: (t: number) => number;
  trigger: Trigger;
  yoyo: boolean;
  followPointer: boolean;
  pauseOnHover: boolean;
  disabled: boolean;
}

const EASINGS: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  smooth: (t) => 0.5 - Math.cos(Math.PI * t) / 2,
  snappy: (t) => (t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2),
};

const TRIGGERS: Trigger[] = ['loop', 'hover', 'view'];
const FALLOFF = [0, 0.2, 0.4, 0.6, 0.8, 1];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

let paint: CanvasRenderingContext2D | null = null;

const parseColor = (value: string): number[] | null => {
  if (typeof document === 'undefined') return null;
  if (!paint) paint = document.createElement('canvas').getContext('2d');
  if (!paint) return null;
  paint.fillStyle = '#000000';
  paint.fillStyle = value;
  const resolved = String(paint.fillStyle);
  if (resolved.startsWith('#')) {
    return [1, 3, 5].map((i) => parseInt(resolved.slice(i, i + 2), 16)).concat(1);
  }
  const parts = resolved.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return null;
  return [Number(parts[0]), Number(parts[1]), Number(parts[2]), parts.length > 3 ? Number(parts[3]) : 1];
};

const blend = (from: number[], to: number[], amount: number) => {
  const channel = (a: number, b: number) =>
    Math.round(Math.pow(Math.pow(a / 255, 2.2) * (1 - amount) + Math.pow(b / 255, 2.2) * amount, 1 / 2.2) * 255);
  const alpha = from[3] * (1 - amount) + to[3] * amount;
  if (alpha <= 0) return 'rgba(0, 0, 0, 0)';
  const weigh = (a: number, b: number) => (a * from[3] * (1 - amount) + b * to[3] * amount) / alpha;
  const r = from[3] === to[3] ? channel(from[0], to[0]) : Math.round(weigh(from[0], to[0]));
  const g = from[3] === to[3] ? channel(from[1], to[1]) : Math.round(weigh(from[1], to[1]));
  const b = from[3] === to[3] ? channel(from[2], to[2]) : Math.round(weigh(from[2], to[2]));
  return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`;
};

export function ShinyText({
  text,
  children,
  color = '#d4af37', // Default luxury champagne gold
  shineColor = '#ffffff',
  speed = 2,
  delay = 0.5,
  angle = 120,
  shineWidth = 40,
  softness = 0.8,
  bands = 1,
  glow = 0.2,
  direction = 'left',
  easing = 'smooth',
  trigger = 'loop',
  yoyo = false,
  followPointer = false,
  pauseOnHover = false,
  disabled = false,
  className = '',
  style,
}: ShinyTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const settingsRef = useRef<Settings | null>(null);
  const syncRef = useRef<(() => void) | null>(null);
  const content = children ?? text;

  settingsRef.current = {
    color,
    shineColor,
    speed: Math.max(0.1, speed),
    delay: Math.max(0, delay),
    angle,
    shineWidth: clamp(shineWidth, 2, 200),
    softness: clamp(softness, 0, 1),
    bands: clamp(Math.round(bands), 1, 3),
    glow: clamp(glow, 0, 1),
    sign: direction === 'right' ? 1 : -1,
    ease: EASINGS[easing] ?? EASINGS.smooth,
    trigger: TRIGGERS.includes(trigger) ? trigger : 'loop',
    yoyo,
    followPointer,
    pauseOnHover,
    disabled,
  };

  useEffect(() => {
    syncRef.current?.();
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      pos: null as number | null,
      vel: 0,
      phase: 'idle',
      from: 0,
      to: 0,
      start: 0,
      duration: 1,
      resume: 0,
      flip: false,
      inside: false,
      target: 0,
      visible: true,
      seen: false,
      colors: '',
    };
    let base: number[] | null = null;
    let shine: number[] | null = null;
    let clear: number[] | null = null;
    let raf = 0;
    let timer = 0;
    let last = 0;
    let alive = true;

    const entry = () => (settingsRef.current!.sign > 0 ? -settingsRef.current!.shineWidth : 100 + settingsRef.current!.shineWidth);
    const exit = () => (settingsRef.current!.sign > 0 ? 100 + settingsRef.current!.shineWidth : -settingsRef.current!.shineWidth);
    const nearest = () => {
      const p = state.pos ?? 50;
      return Math.abs(p - entry()) < Math.abs(p - exit()) ? entry() : exit();
    };

    const prepare = () => {
      const s = settingsRef.current!;
      base = parseColor(s.color) ?? [212, 175, 55, 1];
      shine = parseColor(s.shineColor) ?? [255, 255, 255, 1];
      clear = [shine[0], shine[1], shine[2], 0];
      state.colors = `${s.color}/${s.shineColor}`;
    };

    const palette = (pos: number) => {
      const s = settingsRef.current!;
      if (!base || !shine || !clear) prepare();
      const radius = s.shineWidth / 2;
      const left = pos - radius;
      const right = pos + radius;
      const step = s.shineWidth / (s.bands * 2);
      const stops: string[] = [];

      stops.push(`${blend(base!, clear!, 0)} 0%`);
      stops.push(`${blend(base!, clear!, 0)} ${Math.max(0, left).toFixed(2)}%`);

      for (let b = 0; b < s.bands; b++) {
        const center = left + step * (2 * b + 1);
        for (let i = 0; i < FALLOFF.length; i++) {
          const t = FALLOFF[i];
          const x = center - step * (1 - t * s.softness);
          stops.push(`${blend(base!, shine!, t)} ${x.toFixed(2)}%`);
        }
        for (let i = FALLOFF.length - 1; i >= 0; i--) {
          const t = FALLOFF[i];
          const x = center + step * (1 - t * s.softness);
          stops.push(`${blend(base!, shine!, t)} ${x.toFixed(2)}%`);
        }
      }

      stops.push(`${blend(base!, clear!, 0)} ${Math.min(100, right).toFixed(2)}%`);
      stops.push(`${blend(base!, clear!, 0)} 100%`);
      return stops.join(', ');
    };

    const draw = () => {
      if (!root) return;
      const s = settingsRef.current!;
      if (s.disabled || state.pos === null) {
        root.style.backgroundImage = `linear-gradient(${s.color}, ${s.color})`;
        if (glowRef.current) glowRef.current.style.opacity = '0';
        return;
      }
      const stops = palette(state.pos);
      root.style.backgroundImage = `linear-gradient(${s.angle}deg, ${stops})`;
      if (glowRef.current && s.glow > 0) {
        glowRef.current.style.backgroundImage = `linear-gradient(${s.angle}deg, ${stops})`;
        glowRef.current.style.opacity = `${s.glow}`;
      }
    };

    const sweep = (from: number, to: number, now: number) => {
      state.phase = 'sweep';
      state.from = from;
      state.to = to;
      state.start = now;
      state.duration = (settingsRef.current!.speed * 1000 * Math.abs(to - from)) / (100 + settingsRef.current!.shineWidth * 2);
    };

    const wake = () => {
      if (raf || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const s = settingsRef.current!;

      if (state.pos === null && s.followPointer && state.inside) {
        state.pos = state.target;
        draw();
      }

      if (s.followPointer && state.inside) {
        const diff = state.target - (state.pos ?? state.target);
        state.vel += diff * 15 * dt;
        state.vel *= Math.exp(-8 * dt);
        state.pos = (state.pos ?? state.target) + state.vel * dt;
        state.phase = 'follow';
        draw();
        raf = requestAnimationFrame(tick);
        return;
      }

      if (state.phase === 'follow') {
        state.vel = 0;
        sweep(state.pos ?? nearest(), nearest(), now);
      }

      if (state.phase === 'sweep') {
        if (s.pauseOnHover && state.inside) {
          state.start += dt * 1000;
          raf = requestAnimationFrame(tick);
          return;
        }
        const t = clamp((now - state.start) / state.duration, 0, 1);
        state.pos = state.from + (state.to - state.from) * s.ease(t);
        draw();
        if (t < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        if (s.trigger !== 'loop' || reduce) {
          state.phase = 'idle';
          state.pos = null;
          draw();
          return;
        }
        state.phase = 'wait';
        state.resume = now + s.delay * 1000;
      }

      if (state.phase === 'wait') {
        if (!state.visible) return;
        if (now < state.resume) {
          window.clearTimeout(timer);
          timer = window.setTimeout(wake, state.resume - now);
          return;
        }
        if (s.yoyo) {
          state.flip = !state.flip;
          sweep(state.flip ? exit() : entry(), state.flip ? entry() : exit(), now);
        } else {
          sweep(entry(), exit(), now);
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      if (state.phase === 'idle' && s.trigger === 'loop' && !reduce && state.visible) {
        state.flip = false;
        sweep(entry(), exit(), now);
        raf = requestAnimationFrame(tick);
      }
    };

    const locate = (event: PointerEvent) => {
      const s = settingsRef.current!;
      const rect = root.getBoundingClientRect();
      const radians = (s.angle * Math.PI) / 180;
      const dx = Math.sin(radians);
      const dy = -Math.cos(radians);
      const length = Math.abs(rect.width * dx) + Math.abs(rect.height * dy) || 1;
      const along = (event.clientX - rect.left - rect.width / 2) * dx + (event.clientY - rect.top - rect.height / 2) * dy;
      return 50 + (along / length) * 100;
    };

    const onEnter = (event: PointerEvent) => {
      const s = settingsRef.current!;
      state.inside = true;
      state.target = locate(event);
      if (s.disabled) return;
      if (s.followPointer) {
        if (state.pos === null) state.pos = nearest();
      } else if (s.trigger === 'hover' && state.phase === 'idle' && !reduce) {
        sweep(entry(), exit(), performance.now());
      }
      wake();
    };

    const onMove = (event: PointerEvent) => {
      state.target = locate(event);
      if (settingsRef.current?.followPointer) wake();
    };

    const onLeave = () => {
      state.inside = false;
      wake();
    };

    let observer: IntersectionObserver | null = null;
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        const visible = entries.some((item) => item.isIntersecting);
        state.visible = visible;
        const s = settingsRef.current;
        if (!visible || !s) return;
        if (s.trigger === 'view' && !state.seen && !reduce && !s.disabled) {
          state.seen = true;
          sweep(entry(), exit(), performance.now());
        }
        wake();
      });
      observer.observe(root);
    }

    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);

    syncRef.current = () => {
      const s = settingsRef.current;
      if (!s) return;
      if (s.disabled) {
        state.pos = null;
        state.phase = 'idle';
      } else if (s.trigger !== 'loop' && state.phase === 'wait') {
        state.phase = 'idle';
        state.pos = null;
      }
      draw();
      wake();
    };
    draw();
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer?.disconnect();
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      syncRef.current = null;
    };
  }, []);

  return (
    <span
      ref={rootRef}
      className={`relative inline-block bg-no-repeat [background-size:100%_100%] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] ${className}`}
      style={{ backgroundImage: `linear-gradient(${color}, ${color})`, ...style }}
    >
      {content}
      {glow > 0 ? (
        <span
          ref={glowRef}
          className="absolute inset-0 bg-no-repeat [background-size:100%_100%] bg-clip-text [-webkit-background-clip:text] [filter:blur(0.14em)] pointer-events-none select-none"
          aria-hidden="true"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

export default ShinyText;
