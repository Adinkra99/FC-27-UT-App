import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SquadPosition } from './SquadTrackerView';
import {
  Maximize2,
  Minimize2,
  Camera,
  Sun,
  Moon,
  Eye,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  User,
} from 'lucide-react';

interface ThreePitchVisualizerProps {
  squad: SquadPosition[];
  onSelectPlayer?: (slot: string) => void;
  selectedSlot?: string | null;
  weakestSlot?: string | null;
  onRunTacticalAdvice?: (playerName: string) => void;
}

type CameraPreset = 'BROADCAST' | 'OVERHEAD' | 'BEHIND_GOAL' | 'CLOSE_UP';
type LightingMood = 'NIGHT_FLOODLIGHTS' | 'GOLDEN_DUSK' | 'TACTICAL_NEON';

// 4-2-1-3 Normalized Pitch Coordinates (X: -28 to 28, Z: -45 to 45)
// Goal 1 is at Z = -45 (Attacking Top), Goal 2 is at Z = 45 (Defending GK Bottom)
const FORMATION_COORDS_4213: Record<string, { x: number; z: number }> = {
  GK: { x: 0, z: 38 },
  LB: { x: -22, z: 24 },
  LCB: { x: -8, z: 26 },
  RCB: { x: 8, z: 26 },
  RB: { x: 22, z: 24 },
  LDM: { x: -10, z: 10 },
  RDM: { x: 10, z: 10 },
  CAM: { x: 0, z: -8 },
  LW: { x: -22, z: -28 },
  ST: { x: 0, z: -32 },
  RW: { x: 22, z: -28 },
};

/**
 * Procedural generation of regulation football pitch texture with mowing stripes & lines.
 * Uses pure HTML5 2D canvas with zero external image / 404 dependencies.
 */
function createProceduralTurfTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  // 1. Base alternating mowing stripe lawn
  const stripeCount = 18;
  const stripeHeight = canvas.height / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1b4a28' : '#225e34';
    ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight);
  }

  // 2. Subtle organic grass speckle noise
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 15000; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    ctx.fillRect(rx, ry, 2, 2);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let i = 0; i < 15000; i++) {
    const rx = Math.random() * canvas.width;
    const ry = Math.random() * canvas.height;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // 3. Crisp Regulation Pitch Markings
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const marginX = 140;
  const marginY = 120;
  const pWidth = canvas.width - marginX * 2;
  const pHeight = canvas.height - marginY * 2;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Outer touchlines
  ctx.strokeRect(marginX, marginY, pWidth, pHeight);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(marginX, centerY);
  ctx.lineTo(canvas.width - marginX, centerY);
  ctx.stroke();

  // Center circle (radius ~180px)
  ctx.beginPath();
  ctx.arc(centerX, centerY, 180, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Top Penalty Box (18-yard)
  const boxWidth = pWidth * 0.58;
  const boxHeight = pHeight * 0.17;
  const boxX = centerX - boxWidth / 2;
  ctx.strokeRect(boxX, marginY, boxWidth, boxHeight);

  // Top Goal Area (6-yard)
  const smallBoxWidth = pWidth * 0.28;
  const smallBoxHeight = pHeight * 0.065;
  ctx.strokeRect(centerX - smallBoxWidth / 2, marginY, smallBoxWidth, smallBoxHeight);

  // Top Penalty Spot & Arc
  ctx.beginPath();
  ctx.arc(centerX, marginY + boxHeight * 0.68, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX, marginY + boxHeight * 0.68, 140, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();

  // Bottom Penalty Box (18-yard)
  ctx.strokeRect(boxX, canvas.height - marginY - boxHeight, boxWidth, boxHeight);

  // Bottom Goal Area (6-yard)
  ctx.strokeRect(
    centerX - smallBoxWidth / 2,
    canvas.height - marginY - smallBoxHeight,
    smallBoxWidth,
    smallBoxHeight
  );

  // Bottom Penalty Spot & Arc
  ctx.beginPath();
  ctx.arc(centerX, canvas.height - marginY - boxHeight * 0.68, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    centerX,
    canvas.height - marginY - boxHeight * 0.68,
    140,
    1.25 * Math.PI,
    1.75 * Math.PI
  );
  ctx.stroke();

  // Corner arcs
  const cornerR = 35;
  ctx.beginPath();
  ctx.arc(marginX, marginY, cornerR, 0, Math.PI * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(canvas.width - marginX, marginY, cornerR, Math.PI * 0.5, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(canvas.width - marginX, canvas.height - marginY, cornerR, Math.PI, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(marginX, canvas.height - marginY, cornerR, Math.PI * 1.5, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural generation of a soft contact shadow disc texture.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural card front face texture with player name, rating, position, and rarity sheen.
 */
function createPlayerCardTexture(
  player: SquadPosition['player'],
  isWeakest: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Background gradient based on rarity
  const isHolo = player.rarity.includes('Holographic');
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 768);
  if (isWeakest) {
    bgGrad.addColorStop(0, '#3f1515');
    bgGrad.addColorStop(0.5, '#1e1115');
    bgGrad.addColorStop(1, '#0f0a0d');
  } else if (isHolo) {
    bgGrad.addColorStop(0, '#1a365d');
    bgGrad.addColorStop(0.4, '#234e52');
    bgGrad.addColorStop(0.7, '#744210');
    bgGrad.addColorStop(1, '#1a202c');
  } else {
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 768);

  // Holographic shimmer lines
  if (isHolo) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 4;
    for (let y = 30; y < 768; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + 80);
      ctx.stroke();
    }
  }

  // Border frame
  ctx.strokeStyle = isWeakest ? '#f87171' : isHolo ? '#facc15' : '#00ff87';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 492, 748);

  // Inner hairline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, 468, 724);

  // Top Section: OVR Rating & Position
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 96px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(String(player.rating), 45, 125);

  ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = isWeakest ? '#fca5a5' : '#00ff87';
  ctx.fillText(player.position, 48, 185);

  // Center crest badge silhouette
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(256, 360, 120, 0, Math.PI * 2);
  ctx.fill();

  // Player Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(player.name.toUpperCase(), 256, 530);

  // Club & Nation
  ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`${player.club} · ${player.nation}`, 256, 575);

  // Role / Value badge at bottom
  ctx.fillStyle = isWeakest ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 255, 135, 0.15)';
  ctx.fillRect(40, 620, 432, 80);
  ctx.strokeStyle = isWeakest ? '#ef4444' : '#00ff87';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 620, 432, 80);

  ctx.fillStyle = isWeakest ? '#fca5a5' : '#00ff87';
  ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(isWeakest ? 'PRIORITY UPGRADE' : `${player.consolePrice.toLocaleString()} COINS`, 256, 670);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const ThreePitchVisualizer: React.FC<ThreePitchVisualizerProps> = ({
  squad,
  onSelectPlayer,
  selectedSlot,
  weakestSlot,
  onRunTacticalAdvice,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('BROADCAST');
  const [lightingMood, setLightingMood] = useState<LightingMood>('NIGHT_FLOODLIGHTS');
  const [isHoveringPlayer, setIsHoveringPlayer] = useState<string | null>(null);
  const [inspectedPosition, setInspectedPosition] = useState<SquadPosition | null>(null);

  // Store mutable Three.js objects in refs to avoid React teardowns
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const playerGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const lightsRef = useRef<{
    keyLight?: THREE.DirectionalLight;
    hemiLight?: THREE.HemisphereLight;
    cornerSpots?: THREE.SpotLight[];
  }>({});
  const animFrameIdRef = useRef<number>(0);

  // Pre-allocated reusable math vectors (Zero GC in loop)
  const targetCamPos = useRef(new THREE.Vector3(0, 48, 62));
  const targetCamLook = useRef(new THREE.Vector3(0, 0, 5));

  // Find inspected position data
  useEffect(() => {
    if (selectedSlot) {
      const pos = squad.find((p) => p.slot === selectedSlot);
      if (pos) setInspectedPosition(pos);
    }
  }, [selectedSlot, squad]);

  // Camera presets coordinates
  const PRESET_COORDS = useMemo(
    () => ({
      BROADCAST: { pos: new THREE.Vector3(0, 46, 60), look: new THREE.Vector3(0, 0, 4) },
      OVERHEAD: { pos: new THREE.Vector3(0, 85, 0.1), look: new THREE.Vector3(0, 0, 0) },
      BEHIND_GOAL: { pos: new THREE.Vector3(0, 18, 55), look: new THREE.Vector3(0, 4, -10) },
      CLOSE_UP: { pos: new THREE.Vector3(0, 12, 16), look: new THREE.Vector3(0, 2, 0) },
    }),
    []
  );

  const applyCameraPreset = (preset: CameraPreset, customSlotTarget?: string) => {
    setCameraPreset(preset);
    if (customSlotTarget && FORMATION_COORDS_4213[customSlotTarget]) {
      const coord = FORMATION_COORDS_4213[customSlotTarget];
      targetCamPos.current.set(coord.x, 14, coord.z + 18);
      targetCamLook.current.set(coord.x, 3, coord.z);
    } else {
      const p = PRESET_COORDS[preset];
      targetCamPos.current.copy(p.pos);
      targetCamLook.current.copy(p.look);
    }
  };

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Renderer Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#070b12');
    scene.fog = new THREE.FogExp2('#070b12', 0.009);

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 560;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(0, 46, 60);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. OrbitControls with smooth exponential damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below pitch floor
    controls.minDistance = 10;
    controls.maxDistance = 140;
    controls.target.set(0, 0, 4);

    // 4. Lighting Rig (Studio PBR with Warm Key + Cool Hemisphere + 4 Floodlights)
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    keyLight.position.set(35, 55, 30);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 160;
    keyLight.shadow.camera.left = -45;
    keyLight.shadow.camera.right = 45;
    keyLight.shadow.camera.top = 55;
    keyLight.shadow.camera.bottom = -55;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x052e16, 1.1);
    scene.add(hemiLight);

    // 4 Corner Stadium Floodlight Towers
    const cornerSpots: THREE.SpotLight[] = [];
    const cornerPositions = [
      { x: -38, z: -55 },
      { x: 38, z: -55 },
      { x: -38, z: 55 },
      { x: 38, z: 55 },
    ];

    cornerPositions.forEach((pos) => {
      const spot = new THREE.SpotLight(0xe0f2fe, 1.8, 120, Math.PI / 4, 0.45);
      spot.position.set(pos.x, 32, pos.z);
      spot.target.position.set(pos.x * 0.2, 0, pos.z * 0.2);
      scene.add(spot);
      scene.add(spot.target);
      cornerSpots.push(spot);

      // Procedural 3-part floodlight pylon
      const pylonGroup = new THREE.Group();
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.85,
        roughness: 0.3,
      });
      const towerMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.6, 32, 8),
        towerMat
      );
      towerMesh.position.set(pos.x, 16, pos.z);
      pylonGroup.add(towerMesh);

      // Light head panel
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0xe0f2fe,
        emissiveIntensity: 1.5,
      });
      const panel = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.8), panelMat);
      panel.position.set(pos.x, 32, pos.z);
      panel.lookAt(0, 0, 0);
      pylonGroup.add(panel);
      scene.add(pylonGroup);
    });

    lightsRef.current = { keyLight, hemiLight, cornerSpots };

    // 5. Regulation Pitch Floor (Procedural Mown Turf with Markings)
    const turfTexture = createProceduralTurfTexture();
    turfTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const pitchGeo = new THREE.PlaneGeometry(68, 105);
    const pitchMat = new THREE.MeshStandardMaterial({
      map: turfTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.position.y = 0;
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    // Stadium surrounding apron
    const apronGeo = new THREE.PlaneGeometry(120, 160);
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.95,
      metalness: 0.1,
    });
    const apronMesh = new THREE.Mesh(apronGeo, apronMat);
    apronMesh.rotation.x = -Math.PI / 2;
    apronMesh.position.y = -0.05;
    scene.add(apronMesh);

    // 6. Regulation Goal Posts (North & South ends)
    const createGoal = (zPos: number, rotY: number) => {
      const goalGroup = new THREE.Group();
      const postMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.6,
      });

      // Crossbar (7.32m wide at 2.44m height)
      const crossbar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 7.32, 16),
        postMat
      );
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, 2.44, 0);
      goalGroup.add(crossbar);

      // Left & Right Uprights
      const leftPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.44, 16),
        postMat
      );
      leftPost.position.set(-3.66, 1.22, 0);
      goalGroup.add(leftPost);

      const rightPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.44, 16),
        postMat
      );
      rightPost.position.set(3.66, 1.22, 0);
      goalGroup.add(rightPost);

      // Rear net box
      const netMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });
      const netBox = new THREE.Mesh(new THREE.BoxGeometry(7.32, 2.44, 2.0), netMat);
      netBox.position.set(0, 1.22, -1.0);
      goalGroup.add(netBox);

      goalGroup.position.set(0, 0, zPos);
      goalGroup.rotation.y = rotY;
      return goalGroup;
    };

    scene.add(createGoal(-52.5, 0));
    scene.add(createGoal(52.5, Math.PI));

    // 7. Assemble 11 Composite 3-12 Part Procedural Player Card Pedestals
    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.CircleGeometry(1.6, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    squad.forEach((pos) => {
      const coords = FORMATION_COORDS_4213[pos.slot] || { x: 0, z: 0 };
      const isWeak = pos.slot === weakestSlot;
      const isSelected = pos.slot === selectedSlot;

      // Group for entire player card totem
      const playerGroup = new THREE.Group();
      playerGroup.position.set(coords.x, 0, coords.z);
      playerGroup.name = pos.slot;

      // Part 1: Soft Contact Shadow Disc (flush at ground y = 0.01)
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = 0.01;
      playerGroup.add(shadowMesh);

      // Part 2: Hexagonal Plinth Pedestal
      const plinthMat = new THREE.MeshStandardMaterial({
        color: isWeak ? 0x2d1212 : isSelected ? 0x064e3b : 0x0f172a,
        metalness: 0.85,
        roughness: 0.25,
      });
      const plinthMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 1.5, 0.35, 6),
        plinthMat
      );
      plinthMesh.position.y = 0.175;
      plinthMesh.castShadow = !isSoftwareGl;
      plinthMesh.receiveShadow = true;
      playerGroup.add(plinthMesh);

      // Part 3: Beveled Plinth Collar Trim
      const trimMat = new THREE.MeshStandardMaterial({
        color: isWeak ? 0xef4444 : isSelected ? 0x00ff87 : 0xfacc15,
        metalness: 0.95,
        roughness: 0.15,
      });
      const trimMesh = new THREE.Mesh(
        new THREE.TorusGeometry(1.32, 0.06, 12, 24),
        trimMat
      );
      trimMesh.rotation.x = Math.PI / 2;
      trimMesh.position.y = 0.35;
      playerGroup.add(trimMesh);

      // Part 4: Vertical Monolith Card Base
      const cardBackMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        metalness: 0.8,
        roughness: 0.3,
      });
      const cardBackMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 2.45, 0.08),
        cardBackMat
      );
      cardBackMesh.position.y = 1.6;
      cardBackMesh.castShadow = !isSoftwareGl;
      playerGroup.add(cardBackMesh);

      // Part 5: Beveled Card Foil Frame
      const frameMat = new THREE.MeshStandardMaterial({
        color: isWeak ? 0xf87171 : isSelected ? 0x00ff87 : 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.2,
      });
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.72, 2.52, 0.04),
        frameMat
      );
      frameMesh.position.y = 1.6;
      playerGroup.add(frameMesh);

      // Part 6: Front Card Face Texture Plate
      const cardTex = createPlayerCardTexture(pos.player, isWeak);
      const cardFaceMat = new THREE.MeshBasicMaterial({
        map: cardTex,
      });
      const cardFaceMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 2.4),
        cardFaceMat
      );
      cardFaceMesh.position.set(0, 1.6, 0.045);
      playerGroup.add(cardFaceMesh);

      // Part 7: Crown Finial Crest (Top accent)
      const crownMat = new THREE.MeshStandardMaterial({
        color: isWeak ? 0xef4444 : 0xfacc15,
        metalness: 0.95,
        roughness: 0.1,
      });
      const crownMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.28, 4),
        crownMat
      );
      crownMesh.position.y = 2.95;
      crownMesh.rotation.y = Math.PI / 4;
      playerGroup.add(crownMesh);

      // Part 8: Role++ Floating Energy Beacon Ring
      const beaconColor = isWeak ? 0xef4444 : pos.rolePlusPlus.includes('Defend') ? 0x00ff87 : pos.rolePlusPlus.includes('Attack') ? 0xf59e0b : 0x38bdf8;
      const beaconMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
      });
      const beaconRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.035, 8, 24),
        beaconMat
      );
      beaconRing.rotation.x = Math.PI / 2;
      beaconRing.position.y = 0.5;
      playerGroup.add(beaconRing);

      // Part 9: Role++ Vertical Light Beacon Pillar
      const pillarMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: isSelected ? 0.6 : 0.25,
      });
      const pillarMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 3.2, 8),
        pillarMat
      );
      pillarMesh.position.y = 1.6;
      playerGroup.add(pillarMesh);

      // Part 10: Slot Label Disc Badge (Ground Marker)
      const slotDiscMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x00ff87 : 0x1e293b,
        roughness: 0.4,
      });
      const slotDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.04, 16),
        slotDiscMat
      );
      slotDisc.position.set(0, 0.03, 1.4);
      playerGroup.add(slotDisc);

      // Face the camera slightly (angled towards mid-pitch)
      playerGroup.rotation.y = coords.x > 0 ? -0.15 : coords.x < 0 ? 0.15 : 0;

      scene.add(playerGroup);
      playerGroupsRef.current.set(pos.slot, playerGroup);
    });

    // 8. Raycasting for Player Click & Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find ancestor group with slot name
        let target: THREE.Object3D | null = intersects[0].object;
        while (target && target.parent && target.parent !== scene) {
          target = target.parent;
        }
        if (target && playerGroupsRef.current.has(target.name)) {
          const slot = target.name;
          onSelectPlayer?.(slot);
          applyCameraPreset('CLOSE_UP', slot);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 900;
      const h = container.clientHeight || 560;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 10. Animation Loop (Exponential Damped Motion & Lossless 60fps)
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth camera interpolation towards target position & look-at
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPos.current.x, 3.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPos.current.y, 3.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPos.current.z, 3.5, dt);

      controls.target.x = THREE.MathUtils.damp(controls.target.x, targetCamLook.current.x, 3.5, dt);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, targetCamLook.current.y, 3.5, dt);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, targetCamLook.current.z, 3.5, dt);

      controls.update();

      // Subtle float animation for selected or weakest card
      playerGroupsRef.current.forEach((grp, slotKey) => {
        if (slotKey === selectedSlot) {
          grp.position.y = 0.4 + Math.sin(now * 0.003) * 0.15;
        } else if (slotKey === weakestSlot) {
          grp.position.y = 0.15 + Math.sin(now * 0.002) * 0.08;
        } else {
          grp.position.y = 0;
        }
      });

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [squad, weakestSlot]);

  // Adjust lighting mood dynamically
  useEffect(() => {
    const lights = lightsRef.current;
    if (!lights.keyLight || !lights.hemiLight) return;

    if (lightingMood === 'NIGHT_FLOODLIGHTS') {
      lights.keyLight.color.setHex(0xfff3e0);
      lights.keyLight.intensity = 2.2;
      lights.hemiLight.color.setHex(0x38bdf8);
      lights.hemiLight.groundColor.setHex(0x052e16);
      lights.hemiLight.intensity = 1.1;
      lights.cornerSpots?.forEach((s) => (s.intensity = 1.8));
    } else if (lightingMood === 'GOLDEN_DUSK') {
      lights.keyLight.color.setHex(0xfbbf24);
      lights.keyLight.intensity = 3.2;
      lights.hemiLight.color.setHex(0xf472b6);
      lights.hemiLight.groundColor.setHex(0x1e1b4b);
      lights.hemiLight.intensity = 0.9;
      lights.cornerSpots?.forEach((s) => (s.intensity = 0.6));
    } else if (lightingMood === 'TACTICAL_NEON') {
      lights.keyLight.color.setHex(0x00ff87);
      lights.keyLight.intensity = 1.5;
      lights.hemiLight.color.setHex(0x06b6d4);
      lights.hemiLight.groundColor.setHex(0x020617);
      lights.hemiLight.intensity = 1.4;
      lights.cornerSpots?.forEach((s) => (s.intensity = 2.2));
    }
  }, [lightingMood]);

  return (
    <div className="relative w-full h-[580px] sm:h-[640px] bg-[#070b12] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Three.js WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Overlay: Title & Active Inspector Info */}
      <div className="absolute top-3 inset-x-3 pointer-events-none flex items-start justify-between gap-3">
        <div className="bg-[#090d16]/90 border border-slate-800 rounded-lg px-3.5 py-2 pointer-events-auto backdrop-blur-none shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff87]" />
            <h4 className="text-xs font-bold text-white tracking-wide">
              Three.js 3D Stadium Pitch · 4-2-1-3 Formation
            </h4>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Click any player pedestal to inspect card stats, Role++ beacon & chemistry
          </p>
        </div>

        {/* Selected Player Floating Spec Card */}
        {inspectedPosition && (
          <div className="bg-[#090d16]/95 border border-slate-700 rounded-xl p-3 max-w-xs pointer-events-auto shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-mono text-slate-400">
                  {inspectedPosition.slot} · {inspectedPosition.label}
                </span>
                <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{inspectedPosition.player.rating} {inspectedPosition.player.name}</span>
                  {inspectedPosition.slot === weakestSlot && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded">
                      Weakest
                    </span>
                  )}
                </h5>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#00ff87]">
                  {inspectedPosition.player.consolePrice.toLocaleString()} Coins
                </span>
                <div className="text-[10px] text-slate-400">
                  Chem: {inspectedPosition.chemPoints}/3 ◆
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="font-semibold text-white font-mono">
                  {inspectedPosition.rolePlusPlus}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Club / League:</span>
                <span className="font-mono text-slate-200">
                  {inspectedPosition.player.club} · {inspectedPosition.player.league}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Item Score:</span>
                <span className="font-mono font-bold text-amber-400">
                  {inspectedPosition.player.itemScore}
                </span>
              </div>
            </div>

            {onRunTacticalAdvice && (
              <button
                type="button"
                onClick={() => onRunTacticalAdvice(inspectedPosition.player.name)}
                className="w-full mt-2.5 py-1.5 px-3 bg-[#00ff87] hover:bg-[#00e67a] text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze Upgrade Options</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion <= 15% height) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-auto max-w-[95vw] pointer-events-auto">
        <div className="flex flex-col items-center">
          {/* Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
            className="mb-1 px-3 py-0.5 bg-[#090d16] border border-slate-800 rounded-t-lg text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 shadow-md"
          >
            {isControlsCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3 text-[#00ff87]" />
                <span>Show 3D Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 text-[#00ff87]" />
                <span>Hide Controls</span>
              </>
            )}
          </button>

          {/* Unified Compact Glassmorphic Horizontal Dock */}
          {!isControlsCollapsed && (
            <div className="bg-[#090d16]/95 border border-slate-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-center gap-4 text-xs shadow-2xl">
              {/* Camera Angle Presets */}
              <div className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-300 mr-1">Camera:</span>
                {(
                  [
                    { id: 'BROADCAST', label: 'Broadcast 45°' },
                    { id: 'OVERHEAD', label: 'Tactical 90°' },
                    { id: 'BEHIND_GOAL', label: 'Behind GK' },
                  ] as { id: CameraPreset; label: string }[]
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => applyCameraPreset(c.id)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                      cameraPreset === c.id
                        ? 'bg-[#00ff87] text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-slate-800 hidden sm:block" />

              {/* Lighting Mood Switcher */}
              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-slate-300 mr-1">Lighting:</span>
                {(
                  [
                    { id: 'NIGHT_FLOODLIGHTS', label: 'Stadium Night' },
                    { id: 'GOLDEN_DUSK', label: 'Sunset Dusk' },
                    { id: 'TACTICAL_NEON', label: 'Neon Cyber' },
                  ] as { id: LightingMood; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setLightingMood(m.id)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                      lightingMood === m.id
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-slate-800 hidden sm:block" />

              {/* Reset View Button */}
              <button
                type="button"
                onClick={() => applyCameraPreset('BROADCAST')}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold transition-colors"
                title="Reset Camera Target"
              >
                <RotateCcw className="w-3 h-3 text-[#00ff87]" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
