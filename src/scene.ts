import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface RenderState {
  player: { x: number; z: number; angle: number; hp: number; dashTime: number };
  enemies: Array<{ id: number; x: number; z: number; angle: number; hp: number; maxHp: number; family: 'anchor' | 'skitter'; phase: string; telegraph: number }>;
  shots: Array<{ x: number; z: number; toX: number; toZ: number; kind: 'bolt' | 'pulse'; age: number }>;
  hazards: Array<{ x: number; z: number; radius: number; angle: number; width: number; kind: string; charge: number }>;
  aim: { x: number; z: number };
  time: number;
  encounter: number;
  effectsReduced: boolean;
}

const CYAN = 0x71f6ed;
const MAGENTA = 0xff517e;
const WARM = 0xffd68a;
const FLOOR = 0x19202b;

/** Decorative geometry never determines game collision, HP, targeting, or telegraphs. */
export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.23;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b111b);
  scene.fog = new THREE.Fog(0x0b111b, 65, 115);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 160);
  const cameraFocus = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const pointer = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const resources: Array<{ dispose(): void }> = [];
  const colorSteps = new Uint8Array([90, 155, 235]);
  const gradientMap = new THREE.DataTexture(colorSteps, 3, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;
  resources.push(gradientMap);
  function toon(color: number) { const m = new THREE.MeshToonMaterial({ color, gradientMap }); resources.push(m); return m; }
  function unlit(color: number, opacity = 1) { const m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity === 1, side: THREE.DoubleSide }); resources.push(m); return m; }
  function geometry<T extends THREE.BufferGeometry>(g: T) { resources.push(g); return g; }
  const dark = toon(0x141923), edge = toon(0x354153), cyan = toon(CYAN), pink = toon(MAGENTA), amber = toon(WARM);
  const lineCyan = unlit(CYAN), linePink = unlit(MAGENTA), lineMuted = unlit(0x3e5869, 0.32);
  scene.add(new THREE.HemisphereLight(0xcbdfff, 0x1b1526, 2.7));
  const key = new THREE.DirectionalLight(0xffffff, 3.25); key.position.set(-12, 30, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff779e, 1.5); rim.position.set(15, 9, -18); scene.add(rim);

  function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geometry(new THREE.BoxGeometry(w, h, d)), material); m.position.set(x, y, z); return m;
  }
  const arena = new THREE.Group(); scene.add(arena);
  arena.add(box(38, 0.8, 28, dark, 0, -0.58, 0));
  arena.add(box(34.8, 0.16, 24.8, toon(FLOOR), 0, -0.1, 0));
  // Sparse score markings make the space legible without decorating attack surfaces.
  for (let x = -16; x <= 16; x += 4) arena.add(box(0.018, 0.012, 24, lineMuted, x, 0.003, 0));
  for (let z = -12; z <= 12; z += 4) arena.add(box(34, 0.012, 0.018, lineMuted, 0, 0.003, z));
  for (const z of [-12.25, 12.25]) { arena.add(box(35, 0.2, 0.22, edge, 0, 0.06, z)); arena.add(box(34.2, 0.035, 0.055, lineCyan, 0, 0.19, z)); }
  for (const x of [-17.25, 17.25]) { arena.add(box(0.22, 0.2, 24.5, edge, x, 0.06, 0)); arena.add(box(0.055, 0.035, 24.1, lineCyan, x, 0.19, 0)); }
  for (const x of [-18.1, 18.1]) for (const z of [-11, -5.5, 0, 5.5, 11]) {
    const pylon = new THREE.Group(); pylon.position.set(x, 0, z); pylon.add(box(0.8, 0.9, 1.45, edge, 0, 0.25, 0)); pylon.add(box(0.86, 0.07, 1.53, linePink, 0, 0.73, 0)); arena.add(pylon);
  }
  // The broken ring motif is an orientation cue, not a target or collision object.
  const centerRing = new THREE.Mesh(geometry(new THREE.RingGeometry(4.9, 4.94, 64, 1, 0.15, Math.PI * 1.8)), lineMuted);
  centerRing.rotation.x = -Math.PI / 2; centerRing.position.y = 0.015; arena.add(centerRing);
  for (const sign of [-1, 1]) for (let i = 0; i < 5; i++) arena.add(box(0.12, 0.01, 0.5 + i * 0.14, unlit(0x607280, 0.28), sign * (11.5 + i * 0.45), 0.016, 0));

  const circleGeometry = geometry(new THREE.CircleGeometry(1, 48));
  const ringGeometry = geometry(new THREE.RingGeometry(0.92, 1, 48));
  function flatMesh(g: THREE.BufferGeometry, m: THREE.Material) { const mesh = new THREE.Mesh(g, m); mesh.rotation.x = -Math.PI / 2; return mesh; }
  function shadow(radius: number) { const s = flatMesh(circleGeometry, unlit(0x02060d, 0.48)); s.position.y = 0.025; s.scale.setScalar(radius); return s; }
  const playerRoot = new THREE.Group(); scene.add(playerRoot);
  playerRoot.add(shadow(0.85));
  const playerBody = new THREE.Group(); playerRoot.add(playerBody);
  const torso = new THREE.Mesh(geometry(new THREE.CylinderGeometry(0.42, 0.57, 0.9, 5)), cyan); torso.position.y = 0.85; playerBody.add(torso);
  const head = new THREE.Mesh(geometry(new THREE.IcosahedronGeometry(0.4, 0)), dark); head.scale.set(1, 0.75, 1); head.position.set(0, 1.5, 0.04); playerBody.add(head);
  playerBody.add(box(0.48, 0.1, 0.15, lineCyan, 0, 1.5, 0.35));
  playerBody.add(box(0.22, 0.3, 0.84, dark, -0.48, 0.85, 0.28));
  playerBody.add(box(0.17, 0.17, 0.25, lineCyan, -0.48, 0.87, 0.78));
  playerBody.add(box(0.28, 0.53, 0.35, edge, -0.24, 0.28, 0));
  playerBody.add(box(0.28, 0.53, 0.35, edge, 0.24, 0.28, 0));
  const playerRing = flatMesh(ringGeometry, lineCyan); playerRing.position.y = 0.035; playerRing.scale.setScalar(0.7); playerRoot.add(playerRing);
  const dashRing = flatMesh(ringGeometry, unlit(CYAN, 0.6)); dashRing.position.y = 0.04; playerRoot.add(dashRing);

  type EnemyVisual = { root: THREE.Group; body: THREE.Group; placeholder: THREE.Group; generated: THREE.Object3D | null; ring: THREE.Mesh; hp: THREE.Mesh; label: THREE.Sprite; hpText: string; family: string };
  const enemyVisuals = new Map<number, EnemyVisual>();
  let model: THREE.Object3D | null = null;
  let modelStatus = 'procedural sentinel; Tripo model pending';
  let disposed = false;
  const modelGeometry = new Set<THREE.BufferGeometry>();
  const modelMaterials = new Set<THREE.Material>();
  const modelTextures = new Set<THREE.Texture>();
  function attachModel(v: EnemyVisual) {
    if (!model || v.family !== 'anchor' || v.generated) return;
    const clone = model.clone(true); clone.rotation.y = Math.PI;
    v.body.add(clone); v.generated = clone; v.placeholder.visible = false;
  }
  new GLTFLoader().load(`${import.meta.env.BASE_URL}models/pulse-sentinel.glb`, gltf => {
    if (disposed) return;
    model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const scalar = 2.25 / Math.max(size.x, size.y, size.z);
    model.position.sub(center); const wrapper = new THREE.Group(); wrapper.add(model); wrapper.scale.setScalar(scalar); wrapper.position.y = size.y * scalar / 2 + 0.35; model = wrapper;
    model.traverse(o => { if (o instanceof THREE.Mesh) { o.frustumCulled = true; modelGeometry.add(o.geometry); const mats = Array.isArray(o.material) ? o.material : [o.material]; for (const m of mats) { modelMaterials.add(m); const std = m as THREE.MeshStandardMaterial; if (std.map) { std.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); modelTextures.add(std.map); } if (std.normalMap) modelTextures.add(std.normalMap); if (std.roughnessMap) modelTextures.add(std.roughnessMap); if (std.metalnessMap) modelTextures.add(std.metalnessMap); std.roughness = 0.8; std.metalness = 0.15; } } });
    modelStatus = 'Tripo pulse-sentinel.glb loaded'; enemyVisuals.forEach(attachModel);
  }, undefined, () => { modelStatus = 'Tripo pulse-sentinel.glb unavailable; procedural fallback active'; });

  function createEnemy(e: RenderState['enemies'][number]): EnemyVisual {
    const root = new THREE.Group(); scene.add(root); root.add(shadow(e.family === 'anchor' ? 1.45 : 0.8));
    const body = new THREE.Group(); root.add(body); const placeholder = new THREE.Group(); body.add(placeholder);
    if (e.family === 'anchor') {
      const core = new THREE.Mesh(geometry(new THREE.OctahedronGeometry(1.12, 0)), pink); core.scale.set(1.1, 0.9, 1); core.position.y = 1.15; placeholder.add(core);
      for (const x of [-1, 1]) { const blade = box(0.35, 0.7, 1.5, dark, x * 0.9, 1.35, 0); blade.rotation.z = x * -0.35; placeholder.add(blade); }
      placeholder.add(box(0.5, 0.17, 0.2, unlit(0xffdbe8), 0, 1.3, 0.95));
    } else {
      const core = new THREE.Mesh(geometry(new THREE.ConeGeometry(0.67, 1.3, 3)), pink); core.rotation.x = Math.PI / 2; core.position.y = 0.65; placeholder.add(core);
      placeholder.add(box(1.15, 0.18, 0.35, dark, 0, 0.6, -0.12)); placeholder.add(box(0.21, 0.16, 0.3, unlit(WARM), 0, 0.62, 0.62));
    }
    const ring = flatMesh(ringGeometry, linePink); ring.position.y = 0.04; ring.scale.setScalar(e.family === 'anchor' ? 1.25 : 0.72); root.add(ring);
    const hpBack = box(1.65, 0.1, 0.13, dark, 0, 2.7, 0); root.add(hpBack);
    const hp = box(1.6, 0.055, 0.15, pink, 0, 2.71, 0); root.add(hp);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false })); label.position.set(0, 3.1, 0); label.scale.set(1.7, 0.5, 1); root.add(label); resources.push(label.material);
    const v = { root, body, placeholder, generated: null, ring, hp, label, hpText: '', family: e.family }; attachModel(v); return v;
  }
  function hpLabel(v: EnemyVisual, hp: number) {
    const text = Number.isInteger(hp) ? String(hp) : hp.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    if (v.hpText === text) return; v.hpText = text;
    const c = document.createElement('canvas'); c.width = 256; c.height = 72; const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#0b111be6'; ctx.beginPath(); ctx.roundRect(12, 3, 232, 66, 16); ctx.fill();
    ctx.fillStyle = '#fff3f7'; ctx.font = '600 42px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 128, 37);
    const old = v.label.material.map; const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; v.label.material.map = texture; v.label.material.needsUpdate = true; old?.dispose();
  }
  const aimRoot = new THREE.Group(); scene.add(aimRoot);
  const aimRing = flatMesh(ringGeometry, lineCyan); aimRing.scale.setScalar(0.42); aimRing.position.y = 0.05; aimRoot.add(aimRing);
  for (const k of [-1, 1]) { aimRoot.add(box(0.19, 0.015, 0.035, lineCyan, k * 0.63, 0.05, 0)); aimRoot.add(box(0.035, 0.015, 0.19, lineCyan, 0, 0.05, k * 0.63)); }
  const shotRoot = new THREE.Group(); scene.add(shotRoot);
  const hazardRoot = new THREE.Group(); scene.add(hazardRoot);
  const shotPool: THREE.Mesh[] = [], hazardPool: THREE.Mesh[] = [], hazardRings: THREE.Mesh[] = [];
  const beamGeometry = geometry(new THREE.BoxGeometry(1, 1, 1));
  const pulseMaterial = unlit(0xe6a4ff, 0.75), boltMaterial = unlit(CYAN, 0.9);
  const hazardMat = unlit(MAGENTA, 0.21), dangerMat = unlit(WARM, 0.45), hazardEdge = unlit(MAGENTA, 0.8);
  let width = 0, height = 0;
  function updateCamera() {
    const aspect = width / Math.max(1, height);
    const distance = aspect < 1 ? 62 : aspect < 1.4 ? 50 : 43;
    camera.position.set(cameraFocus.x, distance * 0.72, cameraFocus.z + distance * 0.63);
    camera.lookAt(cameraFocus.x, 0, cameraFocus.z);
    camera.updateMatrixWorld();
  }
  function resize() { width = Math.max(1, canvas.clientWidth); height = Math.max(1, canvas.clientHeight); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); updateCamera(); }
  function pointerToWorld(clientX: number, clientY: number) { const r = canvas.getBoundingClientRect(); pointer.set((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height * 2 - 1)); raycaster.setFromCamera(pointer, camera); raycaster.ray.intersectPlane(plane, hit); return { x: hit.x, z: hit.z }; }
  function render(state: RenderState, dt: number) {
    if (canvas.clientWidth !== width || canvas.clientHeight !== height) resize();
    const ease = state.effectsReduced ? 1 : Math.min(1, Math.max(0, dt) * 5);
    cameraFocus.x = THREE.MathUtils.lerp(cameraFocus.x, state.player.x * 0.06, ease);
    cameraFocus.z = THREE.MathUtils.lerp(cameraFocus.z, state.player.z * 0.05, ease); updateCamera();
    playerRoot.position.set(state.player.x, 0, state.player.z); playerBody.rotation.y = state.player.angle;
    playerBody.position.y = state.player.dashTime > 0 ? 0.15 : Math.sin(state.time * 7) * 0.025;
    dashRing.visible = state.player.dashTime > 0; dashRing.scale.setScalar(1 + Math.sin(state.time * 28) * 0.1); playerRing.rotation.z = -state.player.angle;
    const alive = new Set<number>();
    for (const e of state.enemies) {
      if (e.hp <= 0) continue; alive.add(e.id); let v = enemyVisuals.get(e.id); if (!v) { v = createEnemy(e); enemyVisuals.set(e.id, v); }
      v.root.position.set(e.x, 0, e.z); v.body.rotation.y = e.angle; v.body.position.y = state.effectsReduced ? 0 : Math.sin(state.time * 3.2 + e.id) * 0.1;
      v.hp.scale.x = Math.max(0.001, e.hp / e.maxHp); v.hp.position.x = -(1 - v.hp.scale.x) * 0.8;
      v.ring.scale.setScalar((e.family === 'anchor' ? 1.25 : 0.72) * (e.telegraph > 0 ? 1 + Math.sin(state.time * 16) * 0.07 : 1)); hpLabel(v, e.hp);
    }
    enemyVisuals.forEach((v, id) => { if (!alive.has(id)) { scene.remove(v.root); v.label.material.map?.dispose(); v.label.material.map = null; enemyVisuals.delete(id); } });
    aimRoot.position.set(state.aim.x, 0, state.aim.z);
    shotPool.forEach(s => { s.visible = false; });
    state.shots.forEach((s, i) => {
      let beam = shotPool[i]; if (!beam) { beam = new THREE.Mesh(beamGeometry, boltMaterial); shotPool.push(beam); shotRoot.add(beam); }
      beam.visible = true; beam.material = s.kind === 'pulse' ? pulseMaterial : boltMaterial;
      const dx = s.toX - s.x, dz = s.toZ - s.z, length = Math.hypot(dx, dz);
      beam.position.set((s.x + s.toX) / 2, 0.86, (s.z + s.toZ) / 2); beam.rotation.y = Math.atan2(dx, dz); const a = Math.max(0.06, 1 - s.age * 5); beam.scale.set(s.kind === 'pulse' ? 0.19 * a : 0.085 * a, 0.08, Math.max(0.05, length));
    });
    hazardPool.forEach(h => { h.visible = false; }); hazardRings.forEach(h => { h.visible = false; });
    state.hazards.forEach((h, i) => {
      const isStrip = h.kind === 'sweep' || h.kind === 'beam' || h.kind === 'line';
      let mesh = hazardPool[i]; if (!mesh) { mesh = flatMesh(circleGeometry, hazardMat); hazardPool.push(mesh); hazardRoot.add(mesh); }
      mesh.visible = true; mesh.geometry = isStrip ? beamGeometry : circleGeometry; mesh.material = h.charge >= 1 ? dangerMat : hazardMat; mesh.position.set(h.x, 0.055, h.z);
      if (isStrip) { mesh.rotation.set(0, h.angle, 0); mesh.scale.set(h.width, 0.03, h.radius * 2); } else { mesh.rotation.set(-Math.PI / 2, 0, 0); mesh.scale.setScalar(h.radius); }
      let ring = hazardRings[i]; if (!ring) { ring = flatMesh(ringGeometry, hazardEdge); hazardRings.push(ring); hazardRoot.add(ring); }
      ring.visible = !isStrip; ring.position.set(h.x, 0.065, h.z); ring.scale.setScalar(h.radius * Math.max(0.05, Math.min(1, h.charge)));
    });
    renderer.render(scene, camera);
  }
  resize();
  return { render, resize, pointerToWorld, assetsStatus: () => modelStatus, dispose() { disposed = true; enemyVisuals.forEach(v => v.label.material.map?.dispose()); resources.forEach(r => r.dispose()); modelGeometry.forEach(g => g.dispose()); modelMaterials.forEach(m => m.dispose()); modelTextures.forEach(t => t.dispose()); renderer.dispose(); } };
}
