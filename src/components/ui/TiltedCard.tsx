import React, { useRef, useState } from 'react';

export interface TiltedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  scaleOnHover?: number;
  glareColor?: string;
  className?: string;
}

/**
 * React Bits inspired TiltedCard with 3D perspective & holographic glare reflection.
 */
export const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  maxTilt = 6,
  scaleOnHover = 1.012,
  glareColor = 'rgba(103, 232, 249, 0.18)',
  className = '',
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState(
    'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  );
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    const rotateY = (relX - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - relY) * maxTilt * 2;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, 1)`
    );
    setGlarePos({
      x: Math.round(relX * 100),
      y: Math.round(relY * 100),
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition:
          glarePos.opacity > 0
            ? 'transform 120ms cubic-bezier(0.03, 0.98, 0.52, 0.99)'
            : 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
      }}
      className={`relative overflow-hidden ${className}`}
      {...rest}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          opacity: glarePos.opacity,
          background: `radial-gradient(380px circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
};
