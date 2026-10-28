import React, { useEffect, useRef } from 'react';

export type SpotlightShape = 'circle' | 'beam';

export type SpotlightCardProps = React.HTMLAttributes<HTMLDivElement> & {
  spotlightColor?: string;
  intensity?: number;
  spotlightSize?: number;
  softness?: number;
  shape?: SpotlightShape;
  borderGlow?: number;
  proximity?: number;
  smoothing?: number;
  ambient?: boolean;
  flare?: boolean;
  grain?: number;
  theme?: 'dark' | 'light';
};

type Palette = { surface: string; border: string; shadow: string; light: string; fill: number; edge: number };

type Settings = {
  shape: SpotlightShape;
  fill: string;
  edge: string;
  size: number;
  intensity: number;
  borderGlow: number;
  proximity: number;
  smoothing: number;
  ambient: boolean;
  flare: boolean;
  grain: number;
};

const THEMES: Record<'dark' | 'light', Palette> = {
  dark: {
    surface: '#0f172a', // Nautical deep navy surface
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: '0 24px 48px -24px rgba(0, 0, 0, 0.6)',
    light: '#38bdf8', // Ocean sky blue highlight
    fill: 1,
    edge: 1,
  },
  light: {
    surface: '#ffffff',
    border: 'rgba(15, 23, 42, 0.08)',
    shadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 18px 40px -20px rgba(15, 23, 42, 0.12)',
    light: '#0284c7', // Ocean cyan highlight
    fill: 0.35,
    edge: 0.8,
  },
};

const SHAPES: SpotlightShape[] = ['circle', 'beam'];

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const falloff = (color: string, softness: number) => {
  const soft = clamp(softness, 0, 1);
  const core = (1 - soft) ** 1.5 * 0.85;
  const stop = (alpha: number, at: number) =>
    `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(2)}%, transparent) ${(at * 100).toFixed(2)}%`;
  const list = [stop(1, 0)];
  for (let i = 0; i <= 14; i++) {
    const t = core + ((1 - core) * i) / 14;
    const g = (t - core) / (1 - core);
    const smooth = 1 - g * g * (3 - 2 * g);
    const glow = Math.exp(-4.6 * g * g) * (1 - g ** 6);
    list.push(stop(smooth + (glow - smooth) * soft, t));
  }
  return list.join(', ');
};

const CARD =
  'relative isolate overflow-hidden rounded-2xl p-6 transition-all [background-color:var(--spotlight-card-surface)] [box-shadow:var(--spotlight-card-shadow)]';

export function SpotlightCard({
  children,
  className = '',
  style,
  spotlightColor,
  intensity = 0.18,
  spotlightSize = 260,
  softness = 0.7,
  shape = 'circle',
  borderGlow = 0.7,
  proximity = 80,
  smoothing = 0.3,
  ambient = false,
  flare = true,
  grain = 0.05,
  theme = 'dark',
  ...rest
}: SpotlightCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLSpanElement>(null);
  const grainRef = useRef<HTMLSpanElement>(null);
  const edgeRef = useRef<HTMLSpanElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const palette = THEMES[theme] ?? THEMES.dark;
  const color = spotlightColor ?? palette.light;
  const form = SHAPES.includes(shape) ? shape : 'circle';
  const settings: Settings = {
    shape: form,
    fill: falloff(color, softness),
    edge: falloff(color, 1),
    size: Math.max(20, spotlightSize),
    intensity: clamp(intensity, 0, 1) * palette.fill,
    borderGlow: clamp(borderGlow, 0, 1) * palette.edge,
    proximity: Math.max(0, proximity),
    smoothing: clamp(smoothing, 0, 1),
    ambient,
    flare,
    grain: clamp(grain, 0, 1),
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    wakeRef.current?.();
  });

  useEffect(() => {
    const root = rootRef.current;
    const light = lightRef.current;
    const noise = grainRef.current;
    const edge = edgeRef.current;
    if (!root || !light || !noise || !edge) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = { x: 0, y: 0, presence: 0, flare: 0, time: Math.random() * 60, pressed: false, visible: true };
    const pointer = { x: 0, y: 0, active: false };
    const drawn = { light: '', edge: '', noise: '' };
    let focus: Element | null = null;
    let raf = 0;
    let last = 0;
    let alive = true;

    const gradient = (s: Settings, size: number, x: number, y: number, stops: string) => {
      if (s.shape === 'beam') {
        const reach = Math.max(size * 0.6, y + size * 0.55);
        return `radial-gradient(${(size * 0.55).toFixed(1)}px ${reach.toFixed(1)}px at ${x.toFixed(1)}px 0px, ${stops})`;
      }
      return `radial-gradient(${size.toFixed(1)}px ${size.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, ${stops})`;
    };

    const paint = (s: Settings) => {
      const alpha = state.presence * (0.85 + 0.15 * state.flare);
      const glow = s.intensity * alpha;
      const border = s.borderGlow * alpha;
      const x = state.x;
      const y = s.shape === 'beam' ? 0 : state.y;
      const size = s.size * (1 + 0.12 * state.flare);

      if (glow > 0.001) {
        const bg = gradient(s, size, x, y, s.fill);
        if (bg !== drawn.light) {
          light.style.backgroundImage = bg;
          drawn.light = bg;
        }
        light.style.opacity = glow.toFixed(3);
      } else {
        light.style.opacity = '0';
      }

      if (border > 0.001) {
        const bg = gradient(s, size, x, y, s.edge);
        if (bg !== drawn.edge) {
          edge.style.backgroundImage = bg;
          drawn.edge = bg;
        }
        edge.style.opacity = border.toFixed(3);
      } else {
        edge.style.opacity = '0';
      }

      if (s.grain > 0 && glow > 0.001) {
        noise.style.opacity = (s.grain * alpha).toFixed(3);
      } else {
        noise.style.opacity = '0';
      }
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = settingsRef.current;
      const rect = root.getBoundingClientRect();
      state.time += dt;

      let tx = state.x;
      let ty = state.y;
      let target = 0;

      if (focus && root.contains(focus)) {
        const fb = focus.getBoundingClientRect();
        tx = fb.left + fb.width / 2 - rect.left;
        ty = fb.top + fb.height / 2 - rect.top;
        target = 1;
      } else if (pointer.active) {
        const px = pointer.x - rect.left;
        const py = pointer.y - rect.top;
        const bounded = px >= 0 && px <= rect.width && py >= 0 && py <= rect.height;
        const dist = Math.hypot(Math.max(0, -px, px - rect.width), Math.max(0, -py, py - rect.height));
        if (bounded) {
          tx = px;
          ty = py;
          target = 1;
        } else if (dist <= s.proximity && s.proximity > 0) {
          tx = clamp(px, 0, rect.width);
          ty = clamp(py, 0, rect.height);
          target = (1 - dist / s.proximity) ** 2;
        }
      }

      if (target === 0 && s.ambient && state.visible && !reduce) {
        const speed = 0.6;
        tx = rect.width / 2 + (Math.sin(state.time * speed) * rect.width) / 3;
        ty = rect.height / 2 + (Math.cos(state.time * speed * 0.8) * rect.height) / 3;
        target = 0.45;
      }

      const ease = 1 - Math.exp(-dt / (s.smoothing * 0.18 + 0.02));
      state.x += (tx - state.x) * ease;
      state.y += (ty - state.y) * ease;
      state.presence += (target - state.presence) * (1 - Math.exp(-dt / 0.12));
      if (Math.abs(target - state.presence) < 0.002) state.presence = target;
      const press = state.pressed && s.flare && !reduce ? 1 : 0;
      state.flare += (press - state.flare) * (1 - Math.exp(-dt / (press ? 0.05 : 0.28)));
      if (Math.abs(press - state.flare) < 0.002) state.flare = press;
      paint(s);
      const moving = Math.abs(tx - state.x) > 0.1 || Math.abs(ty - state.y) > 0.1;
      const settled = !moving && state.presence === target && state.flare === press;
      if (!settled || (s.ambient && state.visible && !reduce)) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      if (state.presence > 0 || settingsRef.current.proximity > 0 || root.contains(event.target as Node | null)) wake();
    };

    const onOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.active = false;
      wake();
    };

    const onDown = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      state.pressed = true;
      wake();
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') pointer.active = false;
      if (!state.pressed && event.pointerType === 'mouse') return;
      state.pressed = false;
      wake();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof Element) || !event.target.matches(':focus-visible')) return;
      focus = event.target;
      wake();
    };

    const onFocusOut = (event: FocusEvent) => {
      if (root.contains(event.relatedTarget as Node | null)) return;
      focus = null;
      wake();
    };

    const onScroll = () => {
      if (pointer.active || state.presence > 0) wake();
    };

    let observer: IntersectionObserver | null = null;
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        state.visible = entries.some((entry) => entry.isIntersecting);
        if (state.visible) wake();
      });
      observer.observe(root);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    document.addEventListener('pointerout', onOut);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('pointerout', onOut);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      wakeRef.current = null;
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${CARD}${className ? ` ${className}` : ''}`}
      style={
        {
          '--spotlight-card-surface': palette.surface,
          '--spotlight-card-border': palette.border,
          '--spotlight-card-shadow': palette.shadow,
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    >
      <span
        ref={lightRef}
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0"
        aria-hidden="true"
      />
      <span
        ref={grainRef}
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[length:160px_160px] opacity-0 mix-blend-overlay"
        style={{ backgroundImage: NOISE }}
        aria-hidden="true"
      />
      {children}
      <span
        className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] p-px [background:var(--spotlight-card-border)] [-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [-webkit-mask-composite:xor] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]"
        aria-hidden="true"
      />
      <span
        ref={edgeRef}
        className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] p-px opacity-0 [-webkit-mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [-webkit-mask-composite:xor] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]"
        aria-hidden="true"
      />
    </div>
  );
}

export default SpotlightCard;
