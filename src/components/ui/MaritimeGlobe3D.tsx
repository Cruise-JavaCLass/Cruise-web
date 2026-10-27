import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Globe, Radio, Sparkles } from 'lucide-react';

export interface WaypointPort {
  id: string;
  name: string;
  coords: string;
  status: 'COMPLETED' | 'ACTIVE' | 'NEXT' | 'SCHEDULED';
  eta: string;
}

const CRUISE_WAYPOINTS: WaypointPort[] = [
  {
    id: 'halong',
    name: 'Hạ Long (Tuần Châu)',
    coords: '20°57′N 107°04′E',
    status: 'COMPLETED',
    eta: 'Departed 16:00',
  },
  {
    id: 'danang',
    name: 'Đà Nẵng (Tiên Sa)',
    coords: '16°07′N 108°13′E',
    status: 'ACTIVE',
    eta: 'Docked • All-Aboard 19:30',
  },
  {
    id: 'nhatrang',
    name: 'Vịnh Nha Trang',
    coords: '12°14′N 109°11′E',
    status: 'NEXT',
    eta: 'ETA Tomorrow 07:30',
  },
  {
    id: 'phuquoc',
    name: 'Phú Quốc (An Thới)',
    coords: '10°01′N 104°00′E',
    status: 'SCHEDULED',
    eta: 'Day 4 • 09:00',
  },
];

export const MaritimeGlobe3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'GLOBE' | 'RADAR'>('GLOBE');
  const [selectedPort, setSelectedPort] = useState<WaypointPort>(CRUISE_WAYPOINTS[1]);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isJsdom =
      typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
    if (isJsdom) {
      setWebglSupported(false);
      return;
    }

    // Detect if WebGL is supported (gracefully skipped in jsdom unit tests)
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.4);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Holographic Inner Core Sphere
    const coreGeo = new THREE.SphereGeometry(1.22, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x041628,
      transparent: true,
      opacity: 0.72,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    // 2. Geodesic Wireframe Maritime Mesh
    const wireGeo = new THREE.IcosahedronGeometry(1.25, 3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    rootGroup.add(wireMesh);

    // 3. Outer Orbital Telemetry Rings
    const ring1Geo = new THREE.TorusGeometry(1.55, 0.008, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.45,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2.3;
    rootGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(1.74, 0.006, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.28,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 3;
    ring2.rotation.y = Math.PI / 5;
    rootGroup.add(ring2);

    // 4. 3D Nautical Route Curve & Waypoint Nodes
    const routePoints = [
      new THREE.Vector3(0.45, 0.85, 0.82).normalize().multiplyScalar(1.28),
      new THREE.Vector3(0.62, 0.42, 1.02).normalize().multiplyScalar(1.28),
      new THREE.Vector3(0.72, -0.05, 1.05).normalize().multiplyScalar(1.28),
      new THREE.Vector3(0.35, -0.45, 1.14).normalize().multiplyScalar(1.28),
    ];

    const routeCurve = new THREE.CatmullRomCurve3(routePoints);
    const tubeGeo = new THREE.TubeGeometry(routeCurve, 48, 0.018, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.85,
    });
    const routeTube = new THREE.Mesh(tubeGeo, tubeMat);
    rootGroup.add(routeTube);

    // Port markers
    routePoints.forEach((pt, idx) => {
      const markerGeo = new THREE.SphereGeometry(idx === 1 ? 0.055 : 0.038, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: idx === 1 ? 0x38bdf8 : idx === 0 ? 0x34d399 : 0xfbbf24,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(pt);
      rootGroup.add(marker);
    });

    // Moving Vessel Beacon along the curve
    const vesselGeo = new THREE.OctahedronGeometry(0.065, 0);
    const vesselMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const vesselMesh = new THREE.Mesh(vesselGeo, vesselMat);
    rootGroup.add(vesselMesh);

    // 5. Starfield / Ocean Telemetry Particles
    const particleCount = 140;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r = 1.85 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.028,
      transparent: true,
      opacity: 0.65,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particleSystem);

    let mouseX = 0;
    let mouseY = 0;
    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.1;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.8;
    };
    container.addEventListener('mousemove', handlePointerMove);

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 260;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let animId = 0;
    let clock = 0;

    const animate = () => {
      clock += 0.008;

      if (viewMode === 'RADAR') {
        rootGroup.rotation.x += (0.85 - rootGroup.rotation.x) * 0.06;
        rootGroup.rotation.y += 0.012;
      } else {
        rootGroup.rotation.y += 0.0045 + mouseX * 0.02;
        rootGroup.rotation.x += (mouseY * 0.4 - rootGroup.rotation.x) * 0.05;
      }

      ring1.rotation.z = clock * 0.7;
      ring2.rotation.z = -clock * 0.5;
      particleSystem.rotation.y = -clock * 0.2;

      const t = (Math.sin(clock * 0.9) + 1) / 2;
      const posOnCurve = routeCurve.getPointAt(t);
      vesselMesh.position.copy(posOnCurve);
      vesselMesh.rotation.y = clock * 3;

      renderer?.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer?.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      tubeGeo.dispose();
      tubeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [viewMode]);

  return (
    <div
      data-testid="maritime-globe-3d"
      className="relative rounded-2xl bg-[#0B1F33] border border-[#102A43] p-4 backdrop-blur-md shadow-xl overflow-hidden flex flex-col justify-between min-h-[320px]"
    >
      {/* Top HUD Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#397C80] animate-ping" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C5A572] font-semibold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#397C80]" />
            Three.js 3D Fleet Holodeck
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#102A43]/80 border border-[#183B5B] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('GLOBE')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
              viewMode === 'GLOBE'
                ? 'bg-[#397C80]/30 text-[#F7F4ED] border border-[#397C80]/60 font-semibold'
                : 'text-[#8C9BA5] hover:text-[#F7F4ED]'
            }`}
          >
            3D Orbit
          </button>
          <button
            type="button"
            onClick={() => setViewMode('RADAR')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
              viewMode === 'RADAR'
                ? 'bg-[#397C80]/30 text-[#F7F4ED] border border-[#397C80]/60 font-semibold'
                : 'text-[#8C9BA5] hover:text-[#F7F4ED]'
            }`}
          >
            Polar Radar
          </button>
        </div>
      </div>

      {/* 3D WebGL Viewport or Fallback SVG Radar */}
      <div className="relative my-1 flex-1 min-h-[195px] flex items-center justify-center">
        <div
          ref={mountRef}
          className="w-full h-[200px] cursor-grab active:cursor-grabbing"
          aria-label="Interactive 3D Maritime Globe"
        />
        {!webglSupported && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-32 h-32 rounded-full border border-[#397C80]/30 bg-[#397C80]/5 flex items-center justify-center relative">
              <div className="w-20 h-20 rounded-full border border-[#C5A572]/30 animate-pulse flex items-center justify-center">
                <Compass className="w-8 h-8 text-[#397C80]" />
              </div>
            </div>
          </div>
        )}

        {/* Floating Live Telemetry Overlay */}
        <div className="pointer-events-none absolute bottom-1 left-1 right-1 flex items-center justify-between text-[10px] font-mono text-[#8C9BA5] bg-[#102A43]/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#183B5B]">
          <span className="flex items-center gap-1 text-[#F7F4ED]">
            <Radio className="w-3 h-3 text-[#397C80] animate-pulse" />
            {selectedPort.name}
          </span>
          <span className="text-[#C5A572]">{selectedPort.coords}</span>
        </div>
      </div>

      {/* Interactive Port Waypoint Selector Pills */}
      <div className="relative z-10 grid grid-cols-2 gap-1.5 pt-1">
        {CRUISE_WAYPOINTS.map((wp) => {
          const isSelected = selectedPort.id === wp.id;
          return (
            <button
              key={wp.id}
              type="button"
              onClick={() => setSelectedPort(wp)}
              className={`text-left px-2.5 py-1.5 rounded-xl border text-[10px] font-mono transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-[#102A43] border-[#C5A572] text-[#F7F4ED] shadow-sm'
                  : 'bg-[#0B1F33]/60 border-[#183B5B]/50 text-[#8C9BA5] hover:text-[#F7F4ED] hover:bg-[#102A43]/50'
              }`}
            >
              <span className="truncate font-semibold">{wp.name}</span>
              <Sparkles
                className={`w-2.5 h-2.5 shrink-0 ml-1 ${
                  wp.status === 'ACTIVE'
                    ? 'text-[#C5A572]'
                    : wp.status === 'COMPLETED'
                    ? 'text-[#397C80]'
                    : 'text-[#486581]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
