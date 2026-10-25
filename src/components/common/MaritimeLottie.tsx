import React, { useEffect, useState, type ComponentType } from 'react';
import { Compass, Ship, Waves } from 'lucide-react';

export type MaritimeVariant = 'ship' | 'radar' | 'waves';

export interface MaritimeLottieProps {
  variant: MaritimeVariant;
  className?: string;
  loop?: boolean;
  title?: string;
}

const variantPaths: Record<MaritimeVariant, string> = {
  ship: '/animations/maritime/cruise-ship.json',
  radar: '/animations/maritime/radar-beacon.json',
  waves: '/animations/maritime/ocean-waves.json',
};

// Safe type for dynamic Lottie component
interface LottieComponentProps {
  animationData: unknown;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const MaritimeLottie: React.FC<MaritimeLottieProps> = ({
  variant,
  className = 'w-24 h-24',
  loop = true,
  title,
}) => {
  const [LottieComp, setLottieComp] = useState<ComponentType<LottieComponentProps> | null>(null);
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener?.('change', handleChange);
        return () => mediaQuery.removeEventListener?.('change', handleChange);
      } catch {
        // Fallback for mock environments
      }
    }
  }, []);

  useEffect(() => {
    // Check if canvas 2D context is supported before importing lottie-web
    // This prevents JSDOM / headless test environments from crashing on lottie-web initialization
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      typeof document.createElement !== 'function'
    ) {
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const has2DContext = Boolean(canvas.getContext && canvas.getContext('2d'));
      if (!has2DContext) {
        return;
      }
    } catch {
      return;
    }

    let isMounted = true;

    // Dynamically load lottie-react
    import('lottie-react')
      .then((mod) => {
        const rawComp = (mod as { default?: ComponentType<LottieComponentProps> }).default || (mod as unknown as ComponentType<LottieComponentProps>);
        if (isMounted && rawComp) {
          setLottieComp(() => rawComp);
        }
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const path = variantPaths[variant];

    if (typeof window === 'undefined' || !window.fetch) {
      return;
    }

    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) setAnimationData(data);
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [variant]);

  // Static Accessible Vector Fallback
  const renderFallback = () => {
    switch (variant) {
      case 'radar':
        return (
          <div className="flex flex-col items-center justify-center w-full h-full text-[#42E8F5]" role="img" aria-label={title || 'Nautical Radar Diagnostic'}>
            <Compass className="w-full h-full animate-pulse opacity-90" />
          </div>
        );
      case 'waves':
        return (
          <div className="flex flex-col items-center justify-center w-full h-full text-[#42E8F5]" role="img" aria-label={title || 'Ocean Waves'}>
            <Waves className="w-full h-full opacity-80" />
          </div>
        );
      case 'ship':
      default:
        return (
          <div className="flex flex-col items-center justify-center w-full h-full text-[#42E8F5]" role="img" aria-label={title || 'Maritime Cruise Ship'}>
            <Ship className="w-full h-full opacity-90" />
          </div>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center aspect-square overflow-hidden ${className}`}
      data-testid={`maritime-lottie-${variant}`}
    >
      {prefersReducedMotion || hasError || !animationData || !LottieComp ? (
        renderFallback()
      ) : (
        <LottieComp
          animationData={animationData}
          loop={loop}
          autoplay={!prefersReducedMotion}
          className="w-full h-full"
          aria-label={title || `Maritime animation: ${variant}`}
        />
      )}
    </div>
  );
};

export default MaritimeLottie;
