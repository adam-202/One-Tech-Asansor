import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Activity,
  ShieldCheck,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Wrench,
  Gauge,
  X,
} from 'lucide-react';
import { Language } from '../utils/translations';

interface Elevator3DExperienceProps {
  language?: Language;
  onClose?: () => void;
  isFloating?: boolean;
}

export const Elevator3DExperience: React.FC<Elevator3DExperienceProps> = ({
  language = 'en',
  onClose,
  isFloating = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(3);
  const [targetFloor, setTargetFloor] = useState<number>(3);
  const [cabinStatus, setCabinStatus] = useState<'idle' | 'moving_up' | 'moving_down' | 'leveling'>('idle');
  const [doorOpen, setDoorOpen] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(0);
  const [selectedBrand, setSelectedBrand] = useState<'KONE' | 'Otis' | 'Schindler' | 'Mitsubishi'>('KONE');
  const [isInspectionMode, setIsInspectionMode] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(!isFloating);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const carMeshRef = useRef<THREE.Group | null>(null);
  const cablesRef = useRef<THREE.LineSegments | null>(null);
  const counterweightRef = useRef<THREE.Mesh | null>(null);
  const doorsRef = useRef<{ left: THREE.Mesh; right: THREE.Mesh } | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Height per floor in 3D units
  const FLOOR_HEIGHT = 2.4;
  const TOTAL_FLOORS = 6; // 1 to 6

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 340;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 7.5, 9.5);
    camera.lookAt(0, 6.0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.replaceChildren(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x60a5fa, 1.8);
    dirLight.position.set(5, 15, 7);
    scene.add(dirLight);

    const bottomLight = new THREE.PointLight(0x38bdf8, 1.2, 15);
    bottomLight.position.set(0, 1, 0);
    scene.add(bottomLight);

    // 5. Shaft Skeleton Frame
    const shaftGeo = new THREE.BoxGeometry(2.4, TOTAL_FLOORS * FLOOR_HEIGHT, 2.4);
    const shaftEdges = new THREE.EdgesGeometry(shaftGeo);
    const shaftLine = new THREE.LineSegments(
      shaftEdges,
      new THREE.LineBasicMaterial({ color: 0x1e293b, linewidth: 2 })
    );
    shaftLine.position.y = (TOTAL_FLOORS * FLOOR_HEIGHT) / 2;
    scene.add(shaftLine);

    // Floor dividers
    for (let f = 1; f <= TOTAL_FLOORS; f++) {
      const ringGeo = new THREE.BoxGeometry(2.42, 0.08, 2.42);
      const ringEdges = new THREE.EdgesGeometry(ringGeo);
      const ringMat = new THREE.LineBasicMaterial({ color: 0x334155 });
      const ring = new THREE.LineSegments(ringEdges, ringMat);
      ring.position.y = f * FLOOR_HEIGHT;
      scene.add(ring);
    }

    // Guide Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, TOTAL_FLOORS * FLOOR_HEIGHT, 0.08), railMat);
    leftRail.position.set(-1.15, (TOTAL_FLOORS * FLOOR_HEIGHT) / 2, 0);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, TOTAL_FLOORS * FLOOR_HEIGHT, 0.08), railMat);
    rightRail.position.set(1.15, (TOTAL_FLOORS * FLOOR_HEIGHT) / 2, 0);
    scene.add(rightRail);

    // 6. Elevator Cabin (Car)
    const carGroup = new THREE.Group();
    carMeshRef.current = carGroup;

    // Glass body
    const carBodyGeo = new THREE.BoxGeometry(1.8, 2.0, 1.8);
    const carBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.5,
    });
    const carBody = new THREE.Mesh(carBodyGeo, carBodyMat);
    carGroup.add(carBody);

    // Metal frame borders
    const carEdges = new THREE.EdgesGeometry(carBodyGeo);
    const carBorders = new THREE.LineSegments(
      carEdges,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 })
    );
    carGroup.add(carBorders);

    // Cabin Floor & Ceiling plates
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.3 });
    const carFloorPlate = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.12, 1.82), plateMat);
    carFloorPlate.position.y = -0.96;
    carGroup.add(carFloorPlate);

    const carCeilingPlate = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.12, 1.82), plateMat);
    carCeilingPlate.position.y = 0.96;
    carGroup.add(carCeilingPlate);

    // Cabin interior point light
    const cabinLight = new THREE.PointLight(0x60a5fa, 2.2, 3.5);
    cabinLight.position.set(0, 0.5, 0);
    carGroup.add(cabinLight);

    // Sliding Doors
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2 });
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.8, 0.05), doorMat);
    leftDoor.position.set(-0.43, 0, 0.92);
    carGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.8, 0.05), doorMat);
    rightDoor.position.set(0.43, 0, 0.92);
    carGroup.add(rightDoor);

    doorsRef.current = { left: leftDoor, right: rightDoor };

    carGroup.position.set(0, currentFloor * FLOOR_HEIGHT - 1.0, 0);
    scene.add(carGroup);

    // 7. Counterweight (moves opposite to car)
    const cwMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
    const cwMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.2), cwMat);
    cwMesh.position.set(0, TOTAL_FLOORS * FLOOR_HEIGHT - carGroup.position.y, -1.1);
    counterweightRef.current = cwMesh;
    scene.add(cwMesh);

    // 8. Animation Loop
    let lastTime = performance.now();
    let currentY = currentFloor * FLOOR_HEIGHT - 1.0;

    const animate = (time: number) => {
      animFrameId.current = requestAnimationFrame(animate);
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const targetY = targetFloor * FLOOR_HEIGHT - 1.0;
      const dy = targetY - currentY;

      if (Math.abs(dy) > 0.02) {
        const moveSpeed = 2.4;
        const step = Math.sign(dy) * Math.min(Math.abs(dy), moveSpeed * dt);
        currentY += step;
        carGroup.position.y = currentY;
        if (counterweightRef.current) {
          counterweightRef.current.position.y = TOTAL_FLOORS * FLOOR_HEIGHT - currentY;
        }

        setCabinStatus(dy > 0 ? 'moving_up' : 'moving_down');
        setSpeed(Number((moveSpeed * 0.75).toFixed(1)));
        setCurrentFloor(Math.round((currentY + 1.0) / FLOOR_HEIGHT));
      } else {
        currentY = targetY;
        carGroup.position.y = targetY;
        setCabinStatus('idle');
        setSpeed(0);
        setCurrentFloor(targetFloor);
      }

      // Smooth idle camera drift
      camera.position.x = 4.5 + Math.sin(time * 0.0006) * 0.4;
      camera.lookAt(0, currentY + 0.5, 0);

      renderer.render(scene, camera);
    };

    animFrameId.current = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update target floor when user clicks a floor
  const callFloor = (floorNum: number) => {
    setTargetFloor(floorNum);
    setDoorOpen(false);
  };

  const toggleDoors = () => {
    setDoorOpen(!doorOpen);
  };

  const content = (
    <div
      className={`relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all ${
        isExpanded ? 'w-full' : 'w-full max-w-sm'
      }`}
    >
      {/* 3D Header Bar */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-lg">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-white">
                3D Live Telematics
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-400/30">
                {selectedBrand}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Shaft #1 • High-Rise Traction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Brand Switcher */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-xl p-0.5 text-[10px] font-bold">
            {(['KONE', 'Otis', 'Schindler', 'Mitsubishi'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-1.5 sm:px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedBrand === b ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close 3D View"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-80 sm:h-96 md:h-[420px] relative cursor-grab active:cursor-grabbing" />

      {/* Bottom Live Telemetry & Control Panel */}
      <div className="p-4 bg-slate-950/95 border-t border-slate-800 text-slate-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Floor</span>
            <div className="text-lg font-bold text-blue-400 flex items-center gap-1">
              <span>F{currentFloor}</span>
              {cabinStatus === 'moving_up' && <ArrowUp className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />}
              {cabinStatus === 'moving_down' && <ArrowDown className="w-3.5 h-3.5 text-amber-400 animate-bounce" />}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Speed</span>
            <div className="text-lg font-bold text-white flex items-center gap-1">
              <span>{speed}</span>
              <span className="text-xs text-slate-400">m/s</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Status</span>
            <div className="text-xs font-bold text-emerald-400 truncate mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{cabinStatus === 'idle' ? 'STANDBY' : 'RUNNING'}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Drive System</span>
            <div className="text-xs font-bold text-cyan-300 truncate mt-1">
              {selectedBrand === 'KONE' ? 'EcoDisc® MX' : 'Geared Traction'}
            </div>
          </div>
        </div>

        {/* Floor Call Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Call Elevator:
          </span>
          <div className="flex items-center gap-1.5 flex-1 justify-center sm:justify-start">
            {[1, 2, 3, 4, 5, 6].map((fl) => (
              <button
                key={fl}
                onClick={() => callFloor(fl)}
                className={`w-9 h-9 rounded-xl font-bold font-mono text-xs transition-all active:scale-95 cursor-pointer ${
                  targetFloor === fl
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {fl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsInspectionMode(!isInspectionMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isInspectionMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Safety Test</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isFloating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
        <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
