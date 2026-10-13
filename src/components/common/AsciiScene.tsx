import { useEffect, useRef, useCallback } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

const ASCII_CHARS = " .:-=+*#%@";

export function AsciiScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const timeRef = useRef(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    window.addEventListener('mousemove', handleMouseMove);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement?.getBoundingClientRect();
      const w = rect?.width || canvas.offsetWidth;
      const h = rect?.height || canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    // Generate nautical Torus Knot coordinates
    const generateTorusKnot = (
      p: number,
      q: number,
      segments: number,
      tubeSegments: number
    ): Point3D[] => {
      const points: Point3D[] = [];
      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < tubeSegments; j++) {
          const u = (i / segments) * Math.PI * 2;
          const v = (j / tubeSegments) * Math.PI * 2;

          const r = 2 + Math.cos(q * u);
          const x = r * Math.cos(p * u);
          const y = r * Math.sin(p * u);
          const z = -Math.sin(q * u);

          const tubeRadius = 0.45;
          const nx = Math.cos(p * u) * Math.cos(v);
          const ny = Math.sin(p * u) * Math.cos(v);
          const nz = Math.sin(v);

          points.push({
            x: x + tubeRadius * nx,
            y: y + tubeRadius * ny,
            z: z + tubeRadius * nz,
          });
        }
      }
      return points;
    };

    const torusKnot = generateTorusKnot(2, 3, 96, 12);

    const rotatePoint = (
      point: Point3D,
      angleX: number,
      angleY: number,
      angleZ: number
    ): Point3D => {
      let { x, y, z } = point;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const newY = y * cosX - z * sinX;
      const newZ = y * sinX + z * cosX;
      y = newY;
      z = newZ;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const newX = x * cosY + z * sinY;
      const newZ2 = -x * sinY + z * cosY;
      x = newX;
      z = newZ2;

      const cosZ = Math.cos(angleZ);
      const sinZ = Math.sin(angleZ);
      const finalX = x * cosZ - y * sinZ;
      const finalY = x * sinZ + y * cosZ;

      return { x: finalX, y: finalY, z };
    };

    let animationFrameId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      timeRef.current += 0.007;
      const t = timeRef.current;

      const angleX = t * 0.4 + (mouseRef.current.y - 0.5) * 0.8;
      const angleY = t * 0.6 + (mouseRef.current.x - 0.5) * 0.8;
      const angleZ = t * 0.2;

      const fov = 340;
      const scale = Math.min(w, h) * 0.22;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const projectedPoints: { x: number; y: number; z: number; char: string; alpha: number }[] = [];

      for (let i = 0; i < torusKnot.length; i++) {
        const rotated = rotatePoint(torusKnot[i], angleX, angleY, angleZ);
        const zDist = rotated.z + 4.8;
        if (zDist <= 0.1) continue;

        const projX = centerX + (rotated.x / zDist) * scale * (fov / 280);
        const projY = centerY + (rotated.y / zDist) * scale * (fov / 280);

        const depthNorm = Math.max(0, Math.min(1, (rotated.z + 3) / 6));
        const charIndex = Math.floor(depthNorm * (ASCII_CHARS.length - 1));
        const char = ASCII_CHARS[charIndex];
        const alpha = Math.max(0.12, depthNorm * 0.7);

        projectedPoints.push({ x: projX, y: projY, z: rotated.z, char, alpha });
      }

      projectedPoints.sort((a, b) => a.z - b.z);

      for (let i = 0; i < projectedPoints.length; i++) {
        const p = projectedPoints[i];
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.fillText(p.char, p.x, p.y);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [handleMouseMove]);

  return <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />;
}
