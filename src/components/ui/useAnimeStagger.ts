import { useEffect, type RefObject } from 'react';
import { animate, stagger } from 'animejs';

/**
 * Anime.js v4 staggered entrance animation hook.
 * Smoothly animates child elements matching `selector` inside `containerRef`
 * while keeping opacity visible in headless test / reduced-motion environments.
 */
export function useAnimeStagger(
  containerRef: RefObject<HTMLElement | null>,
  selector = '[data-anime-item]',
  delayMs = 70
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isTestEnv =
      typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTestEnv || prefersReducedMotion) return;

    const targets = container.querySelectorAll(selector);
    if (!targets.length) return;

    try {
      const anim = animate(targets, {
        translateY: [14, 0],
        opacity: [0.35, 1],
        scale: [0.985, 1],
        delay: stagger(delayMs),
        duration: 620,
        ease: 'outQuart',
      });
      return () => {
        anim.pause();
      };
    } catch {
      // Fallback if animation engine is interrupted
    }
  }, [containerRef, selector, delayMs]);
}
