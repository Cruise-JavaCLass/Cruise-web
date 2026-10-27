import React, { useRef, useState } from 'react';

export interface MagnetProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

/**
 * React Bits inspired Magnet Wrapper
 * Gently attracts interactive CTA buttons toward the user's cursor.
 */
export const Magnet: React.FC<MagnetProps> = ({
  children,
  strength = 0.22,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setOffset({
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength,
    });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate3d(${offset.x.toFixed(1)}px, ${offset.y.toFixed(1)}px, 0)`,
        transition:
          offset.x === 0 && offset.y === 0
            ? 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'transform 80ms linear',
      }}
      className={`inline-block ${className}`}
    >
      {children}
    </div>
  );
};
