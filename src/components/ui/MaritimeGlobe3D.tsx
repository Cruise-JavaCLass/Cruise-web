import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import WORLD_DOTS from './worldDots.json';

// Major destinations with luxurious labels & coordinates
const HUBS = [
  { name: 'ĐÀ NẴNG', sub: '16°07′N 108°13′E', lat: 16.12, lng: 108.22, primary: true },
  { name: 'HẠ LONG', sub: 'Tuần Châu Port', lat: 20.95, lng: 107.07, primary: true },
  { name: 'NHA TRANG', sub: 'Heritage Bay', lat: 12.23, lng: 109.19, primary: true },
  { name: 'PHÚ QUỐC', sub: 'An Thới Terminal', lat: 10.02, lng: 104.0, primary: true },
  { name: 'TOKYO', sub: 'Pacific Gateway', lat: 35.68, lng: 139.76 },
  { name: 'SINGAPORE', sub: 'Marina Bay Cruise', lat: 1.35, lng: 103.82 },
  { name: 'SYDNEY', sub: 'Port Jackson', lat: -33.87, lng: 151.21 },
  { name: 'DUBAI', sub: 'Mina Rashid', lat: 25.2, lng: 55.27 },
  { name: 'LONDON', sub: 'Thames Gateway', lat: 51.5, lng: -0.12 },
  { name: 'NEW YORK', sub: 'Manhattan Pier', lat: 40.71, lng: -74.0 },
  { name: 'SAN FRANCISCO', sub: 'Bay Terminal', lat: 37.77, lng: -122.42 },
  { name: 'RIO DE JANEIRO', sub: 'Guanabara Pier', lat: -22.9, lng: -43.17 },
  { name: 'CAPE TOWN', sub: 'Table Bay', lat: -33.92, lng: 18.42 },
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

function createCurvedArc(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  radius: number,
  maxElevation = 0.32
): THREE.CatmullRomCurve3 {
  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  const distance = p1.distanceTo(p2);
  const elevation = radius + Math.min(distance * 0.22, maxElevation);
  mid.normalize().multiplyScalar(elevation);

  const p1Mid = p1.clone().lerp(mid, 0.5).normalize().multiplyScalar(radius + (elevation - radius) * 0.7);
  const p2Mid = p2.clone().lerp(mid, 0.5).normalize().multiplyScalar(radius + (elevation - radius) * 0.7);

  return new THREE.CatmullRomCurve3([p1, p1Mid, mid, p2Mid, p2]);
}

// Generate luxury typographic labels onto a Three.js Sprite
function createTextSprite(text: string, subText?: string, isPrimary = false): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle luxury badge background
    ctx.fillStyle = isPrimary ? 'rgba(7, 24, 43, 0.82)' : 'rgba(10, 20, 34, 0.65)';
    const x = 10, y = 10, w = 492, h = 140, r = 16;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.lineWidth = 3;
    ctx.strokeStyle = isPrimary ? 'rgba(197, 165, 114, 0.85)' : 'rgba(100, 181, 246, 0.45)';
    ctx.stroke();

    // Primary Port Icon / Dot
    ctx.fillStyle = isPrimary ? '#C5A572' : '#64B5F6';
    ctx.beginPath();
    ctx.arc(42, 60, 10, 0, Math.PI * 2);
    ctx.fill();

    // Main Destination Title (Serif Luxury)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Cinzel", "Playfair Display", "Times New Roman", serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(text, 68, 70);

    // Subtitle / Coordinates (Technical Monospace)
    if (subText) {
      ctx.fillStyle = isPrimary ? '#FDE047' : '#90CAF9';
      ctx.font = '500 22px "SF Mono", "Fira Code", monospace';
      ctx.letterSpacing = '1px';
      ctx.fillText(subText, 68, 112);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    opacity: 0.95,
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.65, 0.2, 1);
  return sprite;
}

export const MaritimeGlobe3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isJsdom =
      typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
    if (isJsdom) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 420;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Initial orientation: Center on Vietnam & East Asia
    rootGroup.rotation.y = -Math.PI / 1.7;
    rootGroup.rotation.x = 0.22;

    const globeRadius = 1.44;

    // 1. Deep Midnight Ocean Sphere with Subtle Inner Glow
    const oceanGeo = new THREE.SphereGeometry(globeRadius * 0.994, 50, 50);
    const oceanMat = new THREE.MeshBasicMaterial({
      color: 0x091424,
      transparent: true,
      opacity: 0.97,
    });
    const oceanSphere = new THREE.Mesh(oceanGeo, oceanMat);
    rootGroup.add(oceanSphere);

    // Subtle atmospheric rim
    const atmGeo = new THREE.SphereGeometry(globeRadius * 1.018, 40, 40);
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x1d3557,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const atmSphere = new THREE.Mesh(atmGeo, atmMat);
    rootGroup.add(atmSphere);

    // 2. Continents represented by Dot-Matrix Grid
    const dotCount = WORLD_DOTS.length;
    const dotPositions = new Float32Array(dotCount * 3);

    for (let i = 0; i < dotCount; i++) {
      const [lat, lng] = WORLD_DOTS[i];
      const vec = latLngToVector3(lat, lng, globeRadius);
      dotPositions[i * 3] = vec.x;
      dotPositions[i * 3 + 1] = vec.y;
      dotPositions[i * 3 + 2] = vec.z;
    }

    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
      color: 0x41658a, // Crisp elegant dot matrix
      size: 0.027,
      transparent: true,
      opacity: 0.9,
    });
    const dotPoints = new THREE.Points(dotGeo, dotMat);
    rootGroup.add(dotPoints);

    // 3. Elevated Arcs
    const arcDisposables: { dispose: () => void }[] = [];

    const arcPairs = [
      { from: HUBS[1], to: HUBS[0], highlight: true }, // Ha Long -> Da Nang
      { from: HUBS[0], to: HUBS[2], highlight: true }, // Da Nang -> Nha Trang
      { from: HUBS[2], to: HUBS[3], highlight: true }, // Nha Trang -> Phu Quoc
      { from: HUBS[0], to: HUBS[5], highlight: false }, // Da Nang -> Singapore
      { from: HUBS[1], to: HUBS[4], highlight: false }, // Ha Long -> Tokyo
      { from: HUBS[5], to: HUBS[12], highlight: false }, // Singapore -> Cape Town
      { from: HUBS[5], to: HUBS[6], highlight: false }, // Singapore -> Sydney
      { from: HUBS[5], to: HUBS[7], highlight: false }, // Singapore -> Dubai
      { from: HUBS[7], to: HUBS[8], highlight: false }, // Dubai -> London
      { from: HUBS[8], to: HUBS[9], highlight: false }, // London -> New York
      { from: HUBS[9], to: HUBS[10], highlight: false }, // New York -> SF
      { from: HUBS[10], to: HUBS[4], highlight: false }, // SF -> Tokyo
      { from: HUBS[9], to: HUBS[11], highlight: false }, // NY -> Rio
      { from: HUBS[11], to: HUBS[12], highlight: false }, // Rio -> Cape Town
    ];

    arcPairs.forEach(({ from, to, highlight }) => {
      const p1 = latLngToVector3(from.lat, from.lng, globeRadius);
      const p2 = latLngToVector3(to.lat, to.lng, globeRadius);
      const curve = createCurvedArc(p1, p2, globeRadius, highlight ? 0.18 : 0.38);

      const points = curve.getPoints(60);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: highlight ? 0x90caf9 : 0x607d8b,
        transparent: true,
        opacity: highlight ? 0.95 : 0.45,
      });
      const arcLine = new THREE.Line(lineGeo, lineMat);
      rootGroup.add(arcLine);

      arcDisposables.push(lineGeo, lineMat);
    });

    // 4. Elegant Markers & Typography Text Sprites
    const labelSprites: { sprite: THREE.Sprite; pos: THREE.Vector3 }[] = [];

    HUBS.forEach((hub) => {
      const pos = latLngToVector3(hub.lat, hub.lng, globeRadius * 1.002);

      // Outer Ring
      const ringGeo = new THREE.RingGeometry(0.026, 0.042, 20);
      const ringMat = new THREE.MeshBasicMaterial({
        color: hub.primary ? 0xc5a572 : 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      rootGroup.add(ringMesh);

      // Inner Center Pin
      const pinGeo = new THREE.SphereGeometry(0.02, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({
        color: hub.primary ? 0xfef08a : 0xffffff,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      rootGroup.add(pinMesh);

      // Luxury Floating Text Label Sprite
      const sprite = createTextSprite(hub.name, hub.sub, hub.primary);
      const labelOffset = pos.clone().normalize().multiplyScalar(globeRadius * 1.07);
      labelOffset.y += 0.06;
      sprite.position.copy(labelOffset);
      rootGroup.add(sprite);

      labelSprites.push({ sprite, pos });
      arcDisposables.push(ringGeo, ringMat, pinGeo, pinMat, sprite.material);
    });

    // 5. Active Vessel beacon gliding along the Vietnam route
    const vietnamCurve = createCurvedArc(
      latLngToVector3(HUBS[1].lat, HUBS[1].lng, globeRadius),
      latLngToVector3(HUBS[3].lat, HUBS[3].lng, globeRadius),
      globeRadius,
      0.18
    );

    const vesselGeo = new THREE.SphereGeometry(0.038, 16, 16);
    const vesselMat = new THREE.MeshBasicMaterial({
      color: 0xffd54f, // Gold vessel beacon
    });
    const vessel = new THREE.Mesh(vesselGeo, vesselMat);
    rootGroup.add(vessel);
    arcDisposables.push(vesselGeo, vesselMat);

    // Interactive Drag / Parallax
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      rootGroup.rotation.y += deltaX * 0.005;
      rootGroup.rotation.x += deltaY * 0.005;
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        autoRotate = true;
      }, 2500);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 440;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let animId = 0;
    let clock = 0;

    const animate = () => {
      clock += 0.008;

      if (autoRotate) {
        rootGroup.rotation.y += 0.002;
      }

      // Hide or fade labels that are on the back side of the sphere to keep it super clean!
      const cameraDir = new THREE.Vector3(0, 0, 1);
      labelSprites.forEach(({ sprite, pos }) => {
        const worldPos = pos.clone().applyEuler(rootGroup.rotation);
        const dot = worldPos.dot(cameraDir);
        // Only visible when facing towards camera
        if (dot > 0.15) {
          sprite.visible = true;
          sprite.material.opacity = Math.min(1, (dot - 0.15) * 2.5);
        } else {
          sprite.visible = false;
        }
      });

      // Vessel movement
      const t = (Math.sin(clock * 0.6) * 0.5 + 0.5);
      const vPos = vietnamCurve.getPointAt(t);
      vessel.position.copy(vPos);

      renderer?.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer?.dispose();

      oceanGeo.dispose();
      oceanMat.dispose();
      atmGeo.dispose();
      atmMat.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      arcDisposables.forEach((d) => d.dispose());
    };
  }, []);

  return (
    <div
      data-testid="maritime-globe-3d"
      className="relative w-full h-[380px] sm:h-[440px] flex items-center justify-center overflow-hidden select-none"
    >
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label="Luxury 3D Maritime Globe with Typography Labels"
      />
    </div>
  );
};
