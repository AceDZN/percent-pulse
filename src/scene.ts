import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
const MAGENTA = 0xff247b;
const WARM = 0xffd68a;

/** Decorative geometry never determines game collision, HP, targeting, or telegraphs. */
export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.23;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12132e);
  scene.fog = new THREE.Fog(0x171936, 42, 88);
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
  const dark = toon(0x111321), edge = toon(0x252a3a), cyan = toon(0x02a9a5), pink = toon(MAGENTA);
  const lineCyan = unlit(CYAN), linePink = unlit(MAGENTA), lineMuted = unlit(0x8a315c, 0.5);
  scene.add(new THREE.HemisphereLight(0xcbdfff, 0x1b1526, 2.7));
  const key = new THREE.DirectionalLight(0xffffff, 3.25); key.position.set(-12, 30, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff779e, 1.5); rim.position.set(15, 9, -18); scene.add(rim);

  function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geometry(new THREE.BoxGeometry(w, h, d)), material); m.position.set(x, y, z); return m;
  }
  const arena = new THREE.Group(); scene.add(arena);
  const base = new THREE.Mesh(geometry(new THREE.CylinderGeometry(1, 0.91, 2, 64)), dark); base.scale.set(17.6, 1, 12.6); base.position.y = -1.1; arena.add(base);
  // Deterministic procedural stone texture and slab sectors follow the generated
  // visual target. Their seams are decoration, never holes or gameplay colliders.
  const stoneCanvas = document.createElement('canvas'); stoneCanvas.width = stoneCanvas.height = 256;
  const stoneCtx = stoneCanvas.getContext('2d')!; const pixels = stoneCtx.createImageData(256, 256);
  let stoneSeed = 0x91a7c35;
  for (let i = 0; i < 256 * 256; i++) { stoneSeed ^= stoneSeed << 13; stoneSeed ^= stoneSeed >>> 17; stoneSeed ^= stoneSeed << 5; const n = 150 + (stoneSeed >>> 0) % 100; pixels.data.set([n, n, n, 255], i * 4); }
  stoneCtx.putImageData(pixels, 0, 0); stoneCtx.strokeStyle = '#5a5a5a'; stoneCtx.lineWidth = 1;
  for (let i = 0; i < 28; i++) { const x = (i * 73) % 256, y = (i * 107) % 256; stoneCtx.beginPath(); stoneCtx.moveTo(x, y); stoneCtx.lineTo(x + 8, y - 6); stoneCtx.lineTo(x + 22, y - 3); stoneCtx.lineTo(x + 29, y - 15); stoneCtx.stroke(); }
  const stoneMap = new THREE.CanvasTexture(stoneCanvas); stoneMap.wrapS = stoneMap.wrapT = THREE.RepeatWrapping; stoneMap.repeat.set(0.25, 0.25); stoneMap.colorSpace = THREE.SRGBColorSpace; resources.push(stoneMap);
  const stoneMaterials = [0x303443, 0x2e3340, 0x343744, 0x2c3241].map(c => { const m = toon(c); m.map = stoneMap; return m; });
  const slabGeometries: THREE.BufferGeometry[][] = stoneMaterials.map(() => []);
  function ellipsePoint(r: number, a: number) { return new THREE.Vector2(Math.cos(a) * 17 * r, Math.sin(a) * 12 * r); }
  for (let band = 0; band < 4; band++) {
    const segments = 8 + band * 8, inner = band * 0.25 + (band ? 0.006 : 0), outer = (band + 1) * 0.25 - 0.004;
    for (let i = 0; i < segments; i++) {
      const start = (i / segments) * Math.PI * 2 + band * 0.11 + 0.004, end = ((i + 1) / segments) * Math.PI * 2 + band * 0.11 - 0.004;
      const shape = new THREE.Shape(); const first = ellipsePoint(outer, start); shape.moveTo(first.x, first.y);
      for (let j = 1; j <= 4; j++) { const p = ellipsePoint(outer, start + (end - start) * j / 4); shape.lineTo(p.x, p.y); }
      for (let j = 4; j >= 0; j--) { const p = ellipsePoint(inner, start + (end - start) * j / 4); shape.lineTo(p.x, p.y); } shape.closePath();
      const slab = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.028, bevelSegments: 1, steps: 1, curveSegments: 1 }); slab.rotateX(-Math.PI / 2); slab.translate(0, -0.2 - (i % 3) * 0.006, 0); slabGeometries[(i * 3 + band) % 4].push(slab);
    }
  }
  slabGeometries.forEach((gs, i) => { const merged = mergeGeometries(gs, false); if (merged) arena.add(new THREE.Mesh(geometry(merged), stoneMaterials[i])); gs.forEach(g => g.dispose()); });
  const crackPoints: number[] = [];
  for (let i = 0; i < 80; i++) { const a = i * 2.39996, r = 0.18 + (i * 37 % 76) / 100; const x = Math.cos(a) * 16 * r, z = Math.sin(a) * 11 * r; let px = x, pz = z; for (let j = 0; j < 3; j++) { const nx = px + Math.cos(a + j * 1.3) * 0.5, nz = pz + Math.sin(a - j * 0.7) * 0.5; crackPoints.push(px, 0.013, pz, nx, 0.013, nz); px = nx; pz = nz; } }
  const cracks = geometry(new THREE.BufferGeometry()); cracks.setAttribute('position', new THREE.Float32BufferAttribute(crackPoints, 3)); const crackMaterial = new THREE.LineBasicMaterial({ color: 0x090c16, transparent: true, opacity: 0.8 }); resources.push(crackMaterial); arena.add(new THREE.LineSegments(cracks, crackMaterial));
  function decorativeEllipse(r: number, thickness: number, material: THREE.Material, y: number) { const ring = new THREE.Mesh(geometry(new THREE.RingGeometry(r - thickness / 2, r + thickness / 2, 128)), material); ring.rotation.x = -Math.PI / 2; ring.scale.set(17, 12, 1); ring.position.y = y; arena.add(ring); return ring; }
  decorativeEllipse(0.7, 0.005, lineMuted, 0.012); decorativeEllipse(0.94, 0.005, linePink, 0.013); decorativeEllipse(1.018, 0.008, linePink, 0.014);
  for (let i = 0; i < 44; i++) {
    const a = i / 44 * Math.PI * 2; const block = box(1.95, 0.58 + (i % 3) * 0.1, 0.82, i % 3 === 0 ? dark : edge, Math.cos(a) * 17.5, 0.18, Math.sin(a) * 12.5); block.rotation.y = -a - Math.PI / 2; arena.add(block);
  }
  const crystalGeometry = geometry(new THREE.ConeGeometry(0.22, 0.9, 4));
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + 0.05; const pylon = new THREE.Group(); pylon.position.set(Math.cos(a) * 18, 0, Math.sin(a) * 13); pylon.rotation.y = -a;
    pylon.add(box(1.1, 1.25, 1.1, dark, 0, 0.45, 0)); pylon.add(box(1.25, 0.18, 1.25, edge, 0, 1.08, 0)); pylon.add(box(0.92, 0.045, 0.92, linePink, 0, 1.19, 0));
    const crystal = new THREE.Mesh(crystalGeometry, linePink); crystal.position.y = 1.65; crystal.rotation.z = 0.2; pylon.add(crystal); arena.add(pylon);
  }
  // The void architecture stays outside the playable ellipse and below the
  // foreground sightline. Far columns provide depth without hiding combat.
  for (let i = 0; i < 34; i++) {
    const a = i / 34 * Math.PI * 2; const x = Math.cos(a) * (26 + (i % 4) * 2), z = Math.sin(a) * (22 + (i % 3) * 2);
    const height = z > 8 ? 4 + i % 3 : 9 + (i * 7 % 12); const top = z > 8 ? -3 : 2 + (i % 5) * 1.5;
    const column = new THREE.Mesh(geometry(new THREE.CylinderGeometry(1.1 + i % 3 * 0.3, 0.6, height, 5)), i % 3 === 0 ? toon(0x202644) : dark); column.position.set(x, top - height / 2, z); column.rotation.y = a; scene.add(column);
    if (i % 3 === 0) { const strip = box(0.11, height * 0.8, 0.1, unlit(0xc91a71, 0.65), x + 0.9, top - height / 2, z + 0.3); scene.add(strip); }
  }

  const circleGeometry = geometry(new THREE.CircleGeometry(1, 48));
  const ringGeometry = geometry(new THREE.RingGeometry(0.92, 1, 48));
  function flatMesh(g: THREE.BufferGeometry, m: THREE.Material) { const mesh = new THREE.Mesh(g, m); mesh.rotation.x = -Math.PI / 2; return mesh; }
  function shadow(radius: number) { const s = flatMesh(circleGeometry, unlit(0x02060d, 0.48)); s.position.y = 0.025; s.scale.setScalar(radius); return s; }
  const playerRoot = new THREE.Group(); scene.add(playerRoot);
  playerRoot.add(shadow(0.85));
  const playerBody = new THREE.Group(); playerRoot.add(playerBody);
  const torso = new THREE.Mesh(geometry(new THREE.CylinderGeometry(0.49, 0.33, 0.82, 5)), dark); torso.position.y = 1; playerBody.add(torso);
  const breastplate = new THREE.Mesh(geometry(new THREE.OctahedronGeometry(0.43, 0)), cyan); breastplate.scale.set(0.75, 1.1, 0.52); breastplate.position.set(0, 1, 0.23); playerBody.add(breastplate);
  const head = new THREE.Mesh(geometry(new THREE.IcosahedronGeometry(0.4, 0)), dark); head.scale.set(1, 0.75, 1); head.position.set(0, 1.5, 0.04); playerBody.add(head);
  playerBody.add(box(0.48, 0.1, 0.15, lineCyan, 0, 1.5, 0.35));
  playerBody.add(box(0.22, 0.3, 0.84, dark, -0.48, 0.85, 0.28));
  playerBody.add(box(0.17, 0.17, 0.25, lineCyan, -0.48, 0.87, 0.78));
  for (const side of [-1, 1]) { const shoulder = new THREE.Mesh(geometry(new THREE.OctahedronGeometry(0.48, 0)), cyan); shoulder.scale.set(0.55, 0.55, 1.5); shoulder.position.set(side * 0.5, 1.15, -0.18); shoulder.rotation.y = side * -0.5; playerBody.add(shoulder); }
  for (const side of [-1, 1]) { const leg = box(0.23, 0.65, 0.27, dark, side * 0.25, 0.33, side * 0.16); leg.rotation.x = side * 0.15; playerBody.add(leg); playerBody.add(box(0.06, 0.44, 0.29, cyan, side * 0.35, 0.33, side * 0.16)); }
  playerBody.scale.setScalar(1.12);
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
    const clone = model.clone(true);
    v.body.add(clone); v.generated = clone; v.placeholder.visible = false;
  }
  new GLTFLoader().load(`${import.meta.env.BASE_URL}models/pulse-sentinel.glb`, gltf => {
    if (disposed) return;
    model = gltf.scene;
    // The exported sculpture faces forward vertically. Pitch its face skyward
    // so the diamond silhouette and eye read from the overhead combat camera.
    model.rotation.x = -Math.PI / 2;
    const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const scalar = 2.5 / Math.max(size.x, size.y, size.z);
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
      for (const side of [-1, 1]) { const forearm = new THREE.Mesh(geometry(new THREE.OctahedronGeometry(0.48, 0)), dark); forearm.scale.set(0.7, 1.2, 1); forearm.position.set(side * 0.9, 0.65, 0.45); body.add(forearm); const joint = box(0.12, 0.1, 0.6, linePink, side * 0.9, 1.05, 0.4); joint.rotation.z = side * 0.25; body.add(joint); }
    } else {
      const core = new THREE.Mesh(geometry(new THREE.ConeGeometry(0.67, 1.3, 3)), pink); core.rotation.x = Math.PI / 2; core.position.y = 0.65; placeholder.add(core);
      placeholder.add(box(1.15, 0.18, 0.35, dark, 0, 0.6, -0.12)); placeholder.add(box(0.21, 0.16, 0.3, unlit(WARM), 0, 0.62, 0.62));
      for (const side of [-1, 1]) for (const fore of [-1, 1]) { const leg = box(0.13, 0.14, 0.65, dark, side * 0.48, 0.3, fore * 0.3); leg.rotation.y = side * fore * 0.55; leg.rotation.x = fore * 0.35; body.add(leg); }
    }
    const ring = flatMesh(ringGeometry, linePink); ring.position.y = 0.04; ring.scale.setScalar(e.family === 'anchor' ? 1.25 : 0.72); root.add(ring);
    const healthWidth = e.family === 'anchor' ? 2.5 : 1.6;
    const hpBack = box(healthWidth + 0.09, 0.1, 0.13, dark, 0, 2.55, 0); root.add(hpBack);
    const hp = box(healthWidth, 0.055, 0.15, pink, 0, 2.56, 0); root.add(hp);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false })); label.position.set(0, 2.95, 0); label.scale.set(e.family === 'anchor' ? 2.7 : 1.7, 0.55, 1); root.add(label); resources.push(label.material);
    const v = { root, body, placeholder, generated: null, ring, hp, label, hpText: '', family: e.family }; attachModel(v); return v;
  }
  function hpLabel(v: EnemyVisual, hp: number, maxHp: number) {
    const hpValue = Number.isInteger(hp) ? String(hp) : hp.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    const text = v.family === 'anchor' ? `${hpValue} / ${maxHp}` : `${hpValue} HP`;
    if (v.hpText === text) return; v.hpText = text;
    const c = document.createElement('canvas'); c.width = 256; c.height = 72; const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#0b111be6'; ctx.beginPath(); ctx.roundRect(12, 3, 232, 66, 16); ctx.fill();
    ctx.fillStyle = '#fff3f7'; ctx.font = '700 38px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 128, 37);
    const old = v.label.material.map; const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; v.label.material.map = texture; v.label.material.needsUpdate = true; old?.dispose();
  }
  const aimRoot = new THREE.Group(); scene.add(aimRoot);
  const aimRing = flatMesh(ringGeometry, lineCyan); aimRing.scale.setScalar(0.42); aimRing.position.y = 0.05; aimRoot.add(aimRing);
  for (const k of [-1, 1]) { aimRoot.add(box(0.19, 0.015, 0.035, lineCyan, k * 0.63, 0.05, 0)); aimRoot.add(box(0.035, 0.015, 0.19, lineCyan, 0, 0.05, k * 0.63)); }
  const shotRoot = new THREE.Group(); scene.add(shotRoot);
  const hazardRoot = new THREE.Group(); scene.add(hazardRoot);
  const shotPool: THREE.Mesh[] = [], impactPool: THREE.Mesh[] = [], hazardPool: THREE.Mesh[] = [], hazardRings: THREE.Mesh[] = [];
  const beamGeometry = geometry(new THREE.BoxGeometry(1, 1, 1));
  const impactGeometry = geometry(new THREE.OctahedronGeometry(0.4, 0));
  const pulseMaterial = unlit(0xe6a4ff, 0.75), boltMaterial = unlit(CYAN, 0.9);
  const hazardMat = unlit(MAGENTA, 0.3), dangerMat = unlit(MAGENTA, 0.65), hazardEdge = unlit(MAGENTA, 0.95);
  for (const material of [hazardMat, dangerMat, hazardEdge]) {
    // Show the precise portion of each state-defined warning that touches the
    // arena floor. This clips decoration only; game collision is independent.
    material.onBeforeCompile = shader => {
      shader.vertexShader = `varying vec3 vArenaWorld;\n${shader.vertexShader}`.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvArenaWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = `varying vec3 vArenaWorld;\n${shader.fragmentShader}`.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nvec2 arenaFloorPoint = vArenaWorld.xz / vec2(17.0, 12.0);\nif (dot(arenaFloorPoint, arenaFloorPoint) > 1.0) discard;');
    };
    material.customProgramCacheKey = () => 'arena-floor-ellipse-v1';
  }
  const arcCache = new Map<string, THREE.BufferGeometry>();
  function arcGeometry(radius: number, width: number, edgeOnly = false) { const key = `${radius}:${width}:${edgeOnly}`; let g = arcCache.get(key); if (!g) { const outer = radius + width / 2; const inner = edgeOnly ? Math.max(0, outer - 0.055) : Math.max(0, radius - width / 2); g = geometry(new THREE.RingGeometry(inner, outer, 64, 1, -Math.PI / 2 - Math.PI * 0.425, Math.PI * 0.85)); arcCache.set(key, g); } return g; }
  let width = 0, height = 0;
  function updateCamera() {
    const aspect = width / Math.max(1, height);
    const distance = Math.max(34, 46 / aspect);
    const fog = scene.fog as THREE.Fog; fog.near = distance + 8; fog.far = distance + 54;
    camera.position.set(cameraFocus.x, distance * 0.8192, cameraFocus.z + distance * 0.5736);
    camera.lookAt(cameraFocus.x, 0, cameraFocus.z);
    camera.updateMatrixWorld();
  }
  function resize() { width = Math.max(1, canvas.clientWidth); height = Math.max(1, canvas.clientHeight); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); updateCamera(); }
  function pointerToWorld(clientX: number, clientY: number) { const r = canvas.getBoundingClientRect(); pointer.set((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height * 2 - 1)); raycaster.setFromCamera(pointer, camera); raycaster.ray.intersectPlane(plane, hit); return { x: hit.x, z: hit.z }; }
  function worldToScreen(x: number, z: number) { const r = canvas.getBoundingClientRect(); const p = new THREE.Vector3(x, 0, z).project(camera); return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }; }
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
      v.hp.scale.x = Math.max(0.001, e.hp / e.maxHp); v.hp.position.x = -(1 - v.hp.scale.x) * (e.family === 'anchor' ? 1.25 : 0.8);
      v.ring.scale.setScalar((e.family === 'anchor' ? 1.25 : 0.72) * (e.telegraph > 0 ? 1 + Math.sin(state.time * 16) * 0.07 : 1)); hpLabel(v, e.hp, e.maxHp);
    }
    enemyVisuals.forEach((v, id) => { if (!alive.has(id)) { scene.remove(v.root); v.label.material.map?.dispose(); v.label.material.map = null; enemyVisuals.delete(id); } });
    aimRoot.position.set(state.aim.x, 0, state.aim.z);
    shotPool.forEach(s => { s.visible = false; }); impactPool.forEach(s => { s.visible = false; });
    state.shots.forEach((s, i) => {
      let beam = shotPool[i]; if (!beam) { beam = new THREE.Mesh(beamGeometry, boltMaterial); shotPool.push(beam); shotRoot.add(beam); }
      beam.visible = true; beam.material = s.kind === 'pulse' ? pulseMaterial : boltMaterial;
      const dx = s.toX - s.x, dz = s.toZ - s.z, length = Math.hypot(dx, dz);
      beam.position.set((s.x + s.toX) / 2, 0.86, (s.z + s.toZ) / 2); beam.rotation.y = Math.atan2(dx, dz); const a = Math.max(0.06, 1 - s.age * 5); beam.scale.set(s.kind === 'pulse' ? 0.19 * a : 0.085 * a, 0.08, Math.max(0.05, length));
      let impact = impactPool[i]; if (!impact) { impact = new THREE.Mesh(impactGeometry, lineCyan); impactPool.push(impact); shotRoot.add(impact); } impact.visible = true; impact.material = s.kind === 'pulse' ? linePink : lineCyan; impact.position.set(s.toX, 1, s.toZ); impact.rotation.y = state.time * 12; impact.scale.setScalar(Math.max(0.01, (1 - s.age / 0.24) * (s.kind === 'pulse' ? 1.7 : 0.8)));
    });
    hazardPool.forEach(h => { h.visible = false; }); hazardRings.forEach(h => { h.visible = false; });
    state.hazards.forEach((h, i) => {
      const isStrip = h.kind === 'sweep' || h.kind === 'beam' || h.kind === 'line';
      const isArc = h.kind === 'arc';
      let mesh = hazardPool[i]; if (!mesh) { mesh = flatMesh(circleGeometry, hazardMat); hazardPool.push(mesh); hazardRoot.add(mesh); }
      mesh.visible = true; mesh.geometry = isStrip ? beamGeometry : isArc ? arcGeometry(h.radius, h.width) : circleGeometry; mesh.material = h.charge >= 1 ? dangerMat : hazardMat; mesh.position.set(h.x, 0.055, h.z);
      if (isStrip) { mesh.rotation.set(0, h.angle, 0); mesh.scale.set(h.width, 0.03, h.radius * 2); } else if (isArc) { mesh.rotation.set(-Math.PI / 2, 0, h.angle); mesh.scale.setScalar(1); } else { mesh.rotation.set(-Math.PI / 2, 0, 0); mesh.scale.setScalar(h.radius); }
      let ring = hazardRings[i]; if (!ring) { ring = flatMesh(ringGeometry, hazardEdge); hazardRings.push(ring); hazardRoot.add(ring); }
      ring.visible = !isStrip; ring.position.set(h.x, 0.065, h.z); ring.geometry = isArc ? arcGeometry(h.radius, h.width, true) : ringGeometry; ring.rotation.set(-Math.PI / 2, 0, isArc ? h.angle : 0); ring.scale.setScalar(isArc ? 1 : h.radius * Math.max(0.05, Math.min(1, h.charge)));
    });
    renderer.render(scene, camera);
  }
  resize();
  return { render, resize, pointerToWorld, worldToScreen, assetsStatus: () => modelStatus, stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, width, height, dpr: renderer.getPixelRatio(), modelStatus, camera: { x: camera.position.x, y: camera.position.y, z: camera.position.z, elevation: 55 } }), dispose() { disposed = true; enemyVisuals.forEach(v => v.label.material.map?.dispose()); resources.forEach(r => r.dispose()); modelGeometry.forEach(g => g.dispose()); modelMaterials.forEach(m => m.dispose()); modelTextures.forEach(t => t.dispose()); renderer.dispose(); } };
}
