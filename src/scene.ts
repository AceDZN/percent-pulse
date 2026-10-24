import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export interface RenderState {
  player: { x:number; z:number; angle:number; hp:number; invulnerable?:number; moving?:boolean|number; dashTime?:number };
  enemies: Array<{ id:number; x:number; z:number; angle:number; hp:number; maxHp:number; family:'anchor'|'skitter'; phase:string; telegraph:number; hitFlash?:number; stun?:number; boss?:boolean }>;
  shots: Array<{ x:number; z:number; toX:number; toZ:number; kind:'bolt'|'pulse'; age:number }>;
  hazards: Array<{ id?:number; x:number; z:number; radius:number; angle:number; width:number; kind:string; charge:number; age?:number; duration?:number }>;
  aim:{ x:number; z:number };
  targetId?:number|null;
  time:number;
  wave?:number;
  encounter?:number;
  effectsReduced:boolean;
  destination?:{ x:number; z:number }|null;
  pulseRadius?:number;
  pulseWaves?:Array<{ x:number; z:number; age:number; radius:number }>;
  bursts?:Array<{ id:number; x:number; z:number; age:number }>;
  portals?:Array<{ id:number; x:number; z:number; remaining:number; family:string }>;
  phase?:'move'|'combat'|'pulse-intro';
  mode?:string;
}

const CYAN=0x11e9ff, PINK=0xff357f, WARM=0xffca70;
const FLOOR_X=9, FLOOR_Z=7;

/** State owns collision and all HP. Mesh bounds and effects are decorative only. */
export function createScene(canvas:HTMLCanvasElement) {
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x19394f);
  scene.fog=new THREE.Fog(0x25465c,25,60);
  const camera=new THREE.PerspectiveCamera(40,1,.1,150);
  const focus=new THREE.Vector3(0,0,.15);
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2(), hit=new THREE.Vector3();
  const floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const resources:Array<{dispose():void}>=[];
  const modelGeometries=new Set<THREE.BufferGeometry>(),modelMaterials=new Set<THREE.Material>(),modelTextures=new Set<THREE.Texture>();
  let disposed=false,width=0,height=0;
  const gradient=new THREE.DataTexture(new Uint8Array([85,160,240]),3,1,THREE.RedFormat);
  gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;resources.push(gradient);
  function geo<T extends THREE.BufferGeometry>(g:T){resources.push(g);return g;}
  function toon(color:number){const m=new THREE.MeshToonMaterial({color,gradientMap:gradient});resources.push(m);return m;}
  function basic(color:number,opacity=1){const m=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1,side:THREE.DoubleSide});resources.push(m);return m;}
  function box(w:number,h:number,d:number,m:THREE.Material,x=0,y=0,z=0){const o=new THREE.Mesh(geo(new THREE.BoxGeometry(w,h,d)),m);o.position.set(x,y,z);return o;}
  function mesh(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);return o;}
  function flat(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=.025,z=0){const o=mesh(g,m,x,y,z);o.rotation.x=-Math.PI/2;return o;}
  const charcoal=toon(0x152535),edge=toon(0x374b60),armor=toon(0x04b6d0),lightArmor=toon(0x83dcf0),enemyArmor=toon(0xb8155d);
  const cyan=basic(CYAN),pink=basic(PINK),dimPink=basic(0xb63872,.5),warm=basic(WARM);
  const circle=geo(new THREE.CircleGeometry(1,64)),ring=geo(new THREE.RingGeometry(.96,1,80)),unitBox=geo(new THREE.BoxGeometry(1,1,1));
  const octa=geo(new THREE.OctahedronGeometry(1,0));
  const hemi=new THREE.HemisphereLight(0xd7f1ff,0x1a2440,1.7);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xe6f8ff,2.3);key.position.set(-7,16,8);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=11;key.shadow.camera.bottom=-11;
  key.shadow.camera.near=1;key.shadow.camera.far=35;key.shadow.bias=-.0005;key.shadow.normalBias=.035;key.shadow.radius=2;scene.add(key);
  const rimLight=new THREE.DirectionalLight(0x79adff,.8);rimLight.position.set(10,6,-12);scene.add(rimLight);

  // Quiet, irregular stone slabs derived from the v2 mockups.
  const arena=new THREE.Group();scene.add(arena);
  const base=mesh(geo(new THREE.CylinderGeometry(1,.92,1.8,64)),charcoal,0,-1,0);base.scale.set(9.45,1,7.45);arena.add(base);
  const texCanvas=document.createElement('canvas');texCanvas.width=texCanvas.height=256;
  const ctx=texCanvas.getContext('2d')!,pixels=ctx.createImageData(256,256);let noise=0x6b2c914;
  for(let i=0;i<256*256;i++){noise^=noise<<13;noise^=noise>>>17;noise^=noise<<5;const n=195+(noise>>>0)%52;pixels.data.set([n,n,n,255],i*4);}
  ctx.putImageData(pixels,0,0);
  const stoneMap=new THREE.CanvasTexture(texCanvas);stoneMap.wrapS=stoneMap.wrapT=THREE.RepeatWrapping;stoneMap.repeat.set(.32,.32);stoneMap.colorSpace=THREE.SRGBColorSpace;resources.push(stoneMap);
  const stoneMaterials=[0x49566a,0x455266,0x4d596c].map(c=>{const m=toon(c);m.map=stoneMap;return m;});
  const cells:THREE.BufferGeometry[][]=stoneMaterials.map(()=>[]);
  const seeds:Array<{x:number;z:number}>=[];
  for(let row=-3;row<=3;row++)for(let col=-4;col<=4;col++){
    const x=col*2.45+(row%2)*1.15+Math.sin(col*7+row*3)*.3,z=row*2.3+Math.cos(col*5-row)*.25;
    if((x/9.8)**2+(z/7.8)**2<1.22)seeds.push({x,z});
  }
  function clip(poly:THREE.Vector2[],nx:number,nz:number,c:number){
    const out:THREE.Vector2[]=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],da=a.x*nx+a.y*nz-c,db=b.x*nx+b.y*nz-c;
      if(da<=0)out.push(a);
      if((da<0)!==(db<0)){const t=da/(da-db);out.push(new THREE.Vector2(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t));}
    }return out;
  }
  seeds.forEach((s,index)=>{
    let poly=Array.from({length:80},(_,i)=>new THREE.Vector2(Math.cos(i/80*Math.PI*2)*9,Math.sin(i/80*Math.PI*2)*7));
    seeds.forEach(other=>{if(s===other||!poly.length)return;const nx=other.x-s.x,nz=other.z-s.z,c=(other.x**2+other.z**2-s.x**2-s.z**2)/2;poly=clip(poly,nx,nz,c);});
    if(poly.length<3)return;
    const center=poly.reduce((a,p)=>a.add(p),new THREE.Vector2()).multiplyScalar(1/poly.length);
    poly=poly.map(p=>p.clone().lerp(center,.012));const shape=new THREE.Shape(poly);
    const g=new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1,curveSegments:1});
    g.rotateX(-Math.PI/2);g.translate(0,-.18,0);cells[index%3].push(g);
  });
  cells.forEach((gs,i)=>{if(!gs.length)return;const merged=mergeGeometries(gs,false);if(merged){const floor=mesh(geo(merged),stoneMaterials[i]);floor.receiveShadow=true;arena.add(floor);}gs.forEach(g=>g.dispose());});
  const seam=flat(geo(new THREE.RingGeometry(.975,.991,128)),cyan);seam.scale.set(9,7,1);arena.add(seam);
  for(let i=0;i<30;i++){
    const a=i/30*Math.PI*2,b=box(1.53,.42+(i%3)*.05,.68,edge,Math.cos(a)*9.45,.12,Math.sin(a)*7.45);b.rotation.y=-a-Math.PI/2;b.receiveShadow=true;arena.add(b);
  }
  const crystal=geo(new THREE.OctahedronGeometry(.3,0));
  for(const a of [.4,2.25,3.7,5.45]){
    const p=new THREE.Group();p.position.set(Math.cos(a)*9.65,0,Math.sin(a)*7.65);p.rotation.y=-a;
    p.add(box(.6,1.25,.65,charcoal,0,.5,0));p.add(box(.78,.14,.78,edge,0,-.04,0));
    const gem=mesh(crystal,dimPink,0,1.22,0);gem.scale.set(.65,1.55,.7);p.add(gem);arena.add(p);
  }
  for(let i=0;i<11;i++){
    const a=i/11*Math.PI*2,x=Math.cos(a)*(16+i%3),z=Math.sin(a)*(14+i%2),h=3+(i*3%4),top=z>0?-2:.5+i%2;
    const col=mesh(geo(new THREE.CylinderGeometry(.55+i%2*.22,.35,h,5)),edge,x,top-h/2,z);col.rotation.y=a;scene.add(col);
  }

  function contactShadow(radius:number){const s=flat(circle,basic(0x081522,.25));s.scale.setScalar(radius);return s;}
  function enableShadow(o:THREE.Object3D){o.traverse(child=>{if(child instanceof THREE.Mesh){child.castShadow=true;child.receiveShadow=true;}});}
  const playerRoot=new THREE.Group();scene.add(playerRoot);playerRoot.add(contactShadow(.62));
  const body=new THREE.Group();playerRoot.add(body);
  body.add(box(.7,.73,.43,armor,0,1.02,0));
  body.add(box(.62,.21,.44,charcoal,0,.57,0));
  const chest=mesh(octa,cyan,0,1.06,.25);chest.scale.set(.19,.23,.08);body.add(chest);
  body.add(box(.56,.58,.11,armor,0,1.05,-.27));
  const backCore=mesh(octa,cyan,0,1.08,-.34);backCore.scale.set(.12,.19,.055);body.add(backCore);
  const head=mesh(geo(new THREE.IcosahedronGeometry(.34,0)),armor,0,1.62,.01);head.scale.set(1,.9,1);body.add(head);
  body.add(box(.43,.12,.13,charcoal,0,1.65,.27));body.add(box(.29,.045,.04,cyan,0,1.67,.35));
  const arms:THREE.Group[]=[],legs:THREE.Group[]=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.53,1.25,0);body.add(arm);arms.push(arm);
    const shoulder=mesh(geo(new THREE.IcosahedronGeometry(.31,0)),lightArmor);shoulder.scale.set(1,.8,1);arm.add(shoulder);
    arm.add(box(.22,.4,.23,charcoal,0,-.33,.02));arm.add(box(.27,.28,.28,armor,0,-.43,.1));
    const leg=new THREE.Group();leg.position.set(side*.22,.54,0);body.add(leg);legs.push(leg);
    leg.add(box(.23,.45,.26,charcoal,0,-.2,0));leg.add(box(.27,.25,.3,armor,0,-.26,.07));leg.add(box(.28,.12,.41,edge,0,-.48,.09));
  }
  const blaster=box(.2,.23,.7,charcoal,-.55,.97,.42);body.add(blaster);body.add(box(.18,.16,.14,cyan,-.55,.97,.82));
  enableShadow(body);
  const playerRing=flat(ring,basic(CYAN,.45));playerRing.scale.setScalar(.67);playerRoot.add(playerRing);
  const invulnerability=flat(ring,basic(CYAN,.75));invulnerability.scale.setScalar(.88);playerRoot.add(invulnerability);
  const rangeRing=flat(geo(new THREE.RingGeometry(.995,1,96)),basic(CYAN,.16));scene.add(rangeRing);
  const destination=flat(geo(new THREE.RingGeometry(.7,1,32)),basic(CYAN,.65));destination.scale.setScalar(.23);scene.add(destination);
  const destinationLineGeo=geo(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]));
  const destinationLineMaterial=new THREE.LineBasicMaterial({color:CYAN,transparent:true,opacity:.24});resources.push(destinationLineMaterial);
  const destinationLine=new THREE.Line(destinationLineGeo,destinationLineMaterial);scene.add(destinationLine);

  type Enemy=RenderState['enemies'][number];
  type EnemyVisual={root:THREE.Group;body:THREE.Group;fallback:THREE.Group;generated:THREE.Object3D|null;ring:THREE.Mesh;health:THREE.Group;bar:THREE.Mesh;label:THREE.Sprite;labelText:string;bracket:THREE.Group;family:string;boss:boolean;dead:boolean};
  const enemies=new Map<number,EnemyVisual>();
  let generatedModel:THREE.Object3D|null=null,modelStatus='Tripo pulse-sentinel.glb loading';
  function attachGenerated(v:EnemyVisual){
    if(!generatedModel||v.generated||v.family!=='anchor')return;
    const model=generatedModel.clone(true);if(v.boss)model.scale.multiplyScalar(1.18);v.body.add(model);v.generated=model;v.fallback.visible=false;
  }
  new GLTFLoader().load(import.meta.env.BASE_URL+'models/pulse-sentinel.glb',gltf=>{
    if(disposed)return;
    const raw=gltf.scene;raw.rotation.x=-Math.PI/2;
    const bounds=new THREE.Box3().setFromObject(raw),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    raw.position.sub(center);const scale=2.8/Math.max(size.x,size.y,size.z),wrapper=new THREE.Group();wrapper.add(raw);wrapper.scale.setScalar(scale);wrapper.position.y=size.y*scale/2+.42;
    raw.traverse(o=>{if(o instanceof THREE.Mesh){modelGeometries.add(o.geometry);o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){modelMaterials.add(m);const p=m as THREE.MeshStandardMaterial;p.roughness=.68;p.metalness=.12;for(const t of [p.map,p.normalMap,p.roughnessMap,p.metalnessMap])if(t)modelTextures.add(t);if(p.map)p.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}}});
    generatedModel=wrapper;modelStatus='Tripo pulse-sentinel.glb loaded';enemies.forEach(attachGenerated);
  },undefined,()=>{modelStatus='Tripo pulse-sentinel.glb unavailable; procedural fallback';});
  const bracketMaterial=new THREE.LineBasicMaterial({color:0xe4fbff,transparent:true,opacity:.95});resources.push(bracketMaterial);
  const bracketGeometry=geo(new THREE.BufferGeometry());const corners:number[]=[];
  for(const sx of [-1,1])for(const sy of [-1,1])corners.push(sx,sy,0,sx*.65,sy,0,sx,sy,0,sx,sy*.65,0);
  bracketGeometry.setAttribute('position',new THREE.Float32BufferAttribute(corners,3));
  function makeEnemy(e:Enemy):EnemyVisual{
    const root=new THREE.Group();scene.add(root);root.add(contactShadow(e.family==='anchor'?1.2:.6));
    const enemyBody=new THREE.Group();root.add(enemyBody);const fallback=new THREE.Group();enemyBody.add(fallback);
    if(e.family==='anchor'){
      const diamond=mesh(octa,enemyArmor,0,1.05,0);diamond.scale.set(1,.95,.65);fallback.add(diamond);
      const eye=mesh(octa,pink,0,1.1,.5);eye.scale.set(.32,.42,.2);fallback.add(eye);
      for(const side of [-1,1]){const wing=mesh(octa,enemyArmor,side*.95,1.05,0);wing.scale.set(.28,.72,.3);fallback.add(wing);}
    }else{
      const shell=mesh(octa,enemyArmor,0,.62,0);shell.scale.set(.48,.54,.45);fallback.add(shell);
      const eye=mesh(octa,pink,0,.7,.36);eye.scale.set(.22,.24,.08);fallback.add(eye);
      for(const side of [-1,1])for(const fore of [-1,1]){
        const leg=box(.1,.14,.65,charcoal,side*.44,.32,fore*.22);leg.rotation.y=side*fore*.55;leg.rotation.x=fore*.4;fallback.add(leg);
        const foot=box(.13,.35,.13,enemyArmor,side*.55,.18,fore*.43);foot.rotation.z=side*-.2;fallback.add(foot);
      }
    }enableShadow(enemyBody);
    const groundRing=flat(ring,dimPink);groundRing.scale.setScalar(e.family==='anchor'?1.25:.6);root.add(groundRing);
    const health=new THREE.Group();health.position.y=e.family==='anchor'?2.38:1.5;root.add(health);
    const hw=e.family==='anchor'?2.45:1.05;
    health.add(box(hw+.08,.12,.035,charcoal,0,0,0));const bar=box(hw,.075,.05,pink,0,0,.025);health.add(bar);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false}));resources.push(sprite.material);sprite.position.y=.42;sprite.scale.set(e.family==='anchor'?2.7:1.2,.6,1);health.add(sprite);
    const bracket=new THREE.Group();bracket.position.y=e.family==='anchor'?1.15:.62;bracket.scale.set(e.family==='anchor'?1.5:.72,e.family==='anchor'?1.2:.72,1);bracket.add(new THREE.LineSegments(bracketGeometry,bracketMaterial));root.add(bracket);
    const v={root,body:enemyBody,fallback,generated:null,ring:groundRing,health,bar,label:sprite,labelText:'',bracket,family:e.family,boss:!!e.boss,dead:false};attachGenerated(v);return v;
  }
  function updateLabel(v:EnemyVisual,e:Enemy){
    const n=Number.isInteger(e.hp)?String(e.hp):e.hp.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
    const label=e.family==='anchor'?n+' / '+e.maxHp:n;if(label===v.labelText)return;v.labelText=label;
    const c=document.createElement('canvas');c.width=e.family==='anchor'?256:128;c.height=64;const x=c.getContext('2d')!;
    x.fillStyle='rgba(12,27,42,.76)';x.beginPath();x.roundRect(5,2,c.width-10,60,12);x.fill();x.fillStyle='#f4fcff';x.font='700 39px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(label,c.width/2,34);
    const old=v.label.material.map,t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;v.label.material.map=t;v.label.material.needsUpdate=true;old?.dispose();
  }

  const effectRoot=new THREE.Group();scene.add(effectRoot);
  const clearRing=flat(ring,basic(CYAN,.45));effectRoot.add(clearRing);
  const clearShards=new THREE.Group();for(let i=0;i<10;i++)clearShards.add(mesh(octa,cyan));effectRoot.add(clearShards);
  const beams:THREE.Mesh[]=[],boltDiamonds:THREE.Mesh[]=[],sparks:THREE.Mesh[]=[],pulseRings:THREE.Mesh[]=[],pulseInnerRings:THREE.Mesh[]=[],pulseFills:THREE.Mesh[]=[],warningFills:THREE.Mesh[]=[],warningEdges:THREE.Mesh[]=[];
  const burstGroups:THREE.Group[]=[],portalGroups:THREE.Group[]=[];
  const beamMaterial=basic(CYAN,.9),pulseMaterial=basic(CYAN,.82),pulseInner=basic(CYAN,.2),pulseFill=basic(CYAN,.09),warningFill=basic(WARM,.22),warningReady=basic(WARM,.48),warningEdge=basic(WARM,.88);
  pulseMaterial.blending=THREE.AdditiveBlending;pulseInner.blending=THREE.AdditiveBlending;pulseFill.blending=THREE.AdditiveBlending;
  const shadowShaderMaterials=[pulseMaterial,pulseInner,pulseFill,warningFill,warningReady,warningEdge];
  shadowShaderMaterials.forEach(m=>{
    m.onBeforeCompile=s=>{
      s.vertexShader=('varying vec3 vArenaWorld;\n'+s.vertexShader).replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvArenaWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
      s.fragmentShader=('varying vec3 vArenaWorld;\n'+s.fragmentShader).replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nvec2 floorPoint=vArenaWorld.xz/vec2(9.0,7.0);if(dot(floorPoint,floorPoint)>1.0)discard;');
    };m.customProgramCacheKey=()=> 'v2-floor-clip';
  });
  function poolMesh(pool:THREE.Mesh[],i:number,g:THREE.BufferGeometry,m:THREE.Material,isFlat=false){let o=pool[i];if(!o){o=isFlat?flat(g,m):mesh(g,m);effectRoot.add(o);pool.push(o);}o.visible=true;return o;}
  function effectGroup(pool:THREE.Group[],i:number,count:number,material:THREE.Material){let g=pool[i];if(!g){g=new THREE.Group();for(let j=0;j<count;j++){const shard=mesh(octa,material);g.add(shard);}effectRoot.add(g);pool.push(g);}g.visible=true;return g;}
  function hide(pool:Array<THREE.Object3D>){pool.forEach(o=>o.visible=false);}
  let lastX=0,lastZ=0,lastTime=0;
  function updateCamera(){
    const aspect=width/Math.max(1,height),distance=Math.max(20,22/aspect);
    camera.position.set(focus.x,distance*.8192,focus.z+distance*.5736);camera.lookAt(focus.x,0,focus.z);camera.updateMatrixWorld();
    const fog=scene.fog as THREE.Fog;fog.near=distance+5;fog.far=distance+38;
  }
  function resize(){width=Math.max(1,canvas.clientWidth);height=Math.max(1,canvas.clientHeight);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();updateCamera();}
  function pointerToWorld(x:number,y:number){const r=canvas.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-((y-r.top)/r.height*2-1));raycaster.setFromCamera(pointer,camera);raycaster.ray.intersectPlane(floorPlane,hit);return{x:hit.x,z:hit.z};}
  function worldToScreen(x:number,z:number){const r=canvas.getBoundingClientRect(),p=new THREE.Vector3(x,0,z).project(camera);return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}
  function render(state:RenderState,dt:number){
    if(canvas.clientWidth!==width||canvas.clientHeight!==height)resize();
    // Stable camera: actor movement never drags the entire arena.
    updateCamera();
    playerRoot.position.set(state.player.x,0,state.player.z);body.rotation.y=state.player.angle;
    const timeDelta=state.time-lastTime,validDelta=timeDelta>0&&timeDelta<.2;
    const vx=validDelta?THREE.MathUtils.clamp((state.player.x-lastX)/timeDelta,-6,6):0,vz=validDelta?THREE.MathUtils.clamp((state.player.z-lastZ)/timeDelta,-6,6):0;
    const moving=state.player.moving??Math.hypot(vx,vz)>.2;
    body.rotation.z=state.effectsReduced?0:-vx*.014;body.rotation.x=state.effectsReduced?0:vz*.012;body.position.y=moving&&!state.effectsReduced?Math.abs(Math.sin(state.time*11))*.045:0;
    legs.forEach((leg,i)=>leg.rotation.x=moving&&!state.effectsReduced?Math.sin(state.time*11+i*Math.PI)*.4:0);
    arms.forEach((arm,i)=>arm.rotation.x=moving&&!state.effectsReduced?Math.sin(state.time*11+i*Math.PI)*.16:0);
    lastX=state.player.x;lastZ=state.player.z;lastTime=state.time;
    invulnerability.visible=(state.player.invulnerable||0)>0;invulnerability.scale.setScalar(.88+(state.effectsReduced?0:Math.sin(state.time*8)*.035));
    rangeRing.visible=state.phase==='pulse-intro';rangeRing.position.set(state.player.x,.028,state.player.z);rangeRing.scale.setScalar(state.pulseRadius||5.4);
    destination.visible=!!state.destination;destinationLine.visible=!!state.destination;
    if(state.destination){destination.position.set(state.destination.x,.035,state.destination.z);destinationLineGeo.setFromPoints([new THREE.Vector3(state.player.x,.03,state.player.z),new THREE.Vector3(state.destination.x,.03,state.destination.z)]);}
    const alive=new Set<number>();
    state.enemies.forEach(e=>{
      if(e.hp<=0)return;alive.add(e.id);let v=enemies.get(e.id);if(!v){v=makeEnemy(e);enemies.set(e.id,v);}
      v.root.position.set(e.x,0,e.z);v.body.rotation.y=e.angle;
      const flash=Math.max(0,e.hitFlash||0),stun=Math.max(0,e.stun||0);
      const recoil=state.effectsReduced?0:Math.min(.18,flash*.65);
      v.body.position.set(-Math.sin(e.angle)*recoil,e.family==='anchor'?.035*Math.sin(state.time*2+e.id):0,-Math.cos(e.angle)*recoil);
      const squash=state.effectsReduced?1:1-Math.min(.11,flash*.35);v.body.scale.set(1+(1-squash)*.5,squash,1+(1-squash)*.5);
      v.body.rotation.z=stun&&!state.effectsReduced?Math.sin(state.time*12+e.id)*.06:0;
      const ratio=Math.max(.001,e.hp/e.maxHp),hw=e.family==='anchor'?2.45:1.05;v.bar.scale.x=ratio;v.bar.position.x=-(1-ratio)*hw/2;
      v.health.quaternion.copy(camera.quaternion);v.bracket.quaternion.copy(camera.quaternion);v.bracket.visible=e.id===state.targetId;
      const inRange=Math.hypot(e.x-state.player.x,e.z-state.player.z)<=(state.pulseRadius||5.4);
      // White brackets mean automatic target; cyan ground rings mean Pulse
      // center inclusion only. An out-of-range selected enemy stays pink.
      v.ring.material=inRange&&state.wave!==0?basicRange:dimPink;
      updateLabel(v,e);
    });
    enemies.forEach((v,id)=>{if(!alive.has(id)){scene.remove(v.root);v.label.material.map?.dispose();v.label.material.map=null;enemies.delete(id);}});
    [beams,boltDiamonds,sparks,pulseRings,pulseInnerRings,pulseFills,warningFills,warningEdges,burstGroups,portalGroups].forEach(hide);
    state.shots.forEach((s,i)=>{
      const beam=poolMesh(beams,i,unitBox,beamMaterial),dx=s.toX-s.x,dz=s.toZ-s.z;
      beam.position.set((s.x+s.toX)/2,1.05,(s.z+s.toZ)/2);beam.rotation.y=Math.atan2(dx,dz);beam.scale.set(.065,.07,Math.max(.05,Math.hypot(dx,dz)));
      beam.visible=s.age<.17;
      if(s.kind==='bolt'&&!state.effectsReduced){
        for(let j=0;j<3;j++){const d=poolMesh(boltDiamonds,i*3+j,octa,cyan),t=Math.min(.95,.22+j*.23+s.age*.5);d.position.set(s.x+dx*t,1.05,s.z+dz*t);d.scale.set(.085,.09,.22);d.rotation.y=Math.atan2(dx,dz);d.visible=s.age<.2;}
      }
      if(!state.effectsReduced){const spark=poolMesh(sparks,i,octa,cyan);spark.position.set(s.toX,1,s.toZ);spark.scale.setScalar(Math.max(.015,(1-s.age/.24)*.24));spark.rotation.y=state.time*15;}
    });
    (state.pulseWaves||[]).forEach((p,i)=>{
      const t=Math.max(0,Math.min(1,p.age/.45)),r=state.effectsReduced?p.radius:p.radius*(1-(1-t)**3);
      const o=poolMesh(pulseRings,i,ring,pulseMaterial,true);o.position.set(p.x,.07,p.z);o.scale.setScalar(Math.max(.02,r));o.visible=p.age<.72;
      const inner=poolMesh(pulseInnerRings,i,ring,pulseInner,true);inner.position.set(p.x,.065,p.z);inner.scale.setScalar(Math.max(.02,r*.78));inner.visible=p.age<.65&&!state.effectsReduced;
      const fill=poolMesh(pulseFills,i,circle,pulseFill,true);fill.position.set(p.x,.045,p.z);fill.scale.setScalar(Math.max(.02,r));fill.visible=p.age<.65&&!state.effectsReduced;
    });
    state.hazards.forEach((h,i)=>{
      const lane=h.kind==='lane'||h.kind==='sweep',fill=poolMesh(warningFills,i,lane?unitBox:circle,h.charge>=1?warningReady:warningFill,!lane);
      fill.geometry=lane?unitBox:circle;fill.material=h.charge>=1?warningReady:warningFill;fill.position.set(h.x,.045,h.z);
      if(lane){fill.rotation.set(0,h.angle,0);fill.scale.set(h.width,.02,h.radius*2);}else{fill.rotation.set(-Math.PI/2,0,0);fill.scale.setScalar(h.radius);}
      const warning=poolMesh(warningEdges,i,lane?unitBox:ring,warningEdge,!lane);warning.geometry=lane?unitBox:ring;warning.position.set(h.x,.055,h.z);
      if(lane){warning.rotation.set(0,h.angle,0);warning.scale.set(.055,.025,h.radius*2);const side=(1-h.charge)*h.width/2;warning.position.x+=Math.cos(h.angle)*side;warning.position.z-=Math.sin(h.angle)*side;}
      else{warning.rotation.set(-Math.PI/2,0,0);warning.scale.setScalar(h.radius*Math.max(.08,Math.min(1,h.charge)));}
    });
    (state.bursts||[]).forEach((b,i)=>{
      if(state.effectsReduced||b.age>.7)return;
      const g=effectGroup(burstGroups,i,7,pink);g.position.set(b.x,0,b.z);const t=Math.max(0,b.age);
      g.children.forEach((o,j)=>{const a=j/7*Math.PI*2+j*.2;o.position.set(Math.cos(a)*t*2.6,.35+Math.sin(Math.min(1,t/.7)*Math.PI)*(.4+j%3*.14),Math.sin(a)*t*2.6);o.rotation.set(t*5+j,t*3,t*4);o.scale.setScalar(Math.max(.001,.16*(1-t/.7)));});
    });
    (state.portals||[]).forEach((p,i)=>{
      const g=effectGroup(portalGroups,i,2,dimPink);g.position.set(p.x,.04,p.z);
      g.children.forEach((o,j)=>{(o as THREE.Mesh).geometry=ring;o.rotation.x=-Math.PI/2;o.position.set(0,j*.02,0);const r=p.family==='anchor'?1.1:.65;o.scale.setScalar(j?r*Math.max(.12,1-Math.min(1,p.remaining/1.6)):r+.18);});
    });
    const celebration=(state.mode==='clear'||state.mode==='won')?(state.bursts||[]).at(-1):undefined;
    clearRing.visible=!!celebration;clearShards.visible=!!celebration&&!state.effectsReduced;
    if(celebration){
      const t=Math.max(0,Math.min(.65,celebration.age));clearRing.position.set(state.player.x,.06,state.player.z);clearRing.scale.setScalar(state.effectsReduced?1.8:1+t*3);
      clearShards.position.set(state.player.x,0,state.player.z);clearShards.children.forEach((o,i)=>{const a=i/10*Math.PI*2;o.position.set(Math.cos(a)*(.5+t*3),.4+Math.sin(t/.65*Math.PI)*(.8+i%3*.18),Math.sin(a)*(.5+t*3));o.rotation.y=t*5+i;o.scale.setScalar(Math.max(.005,.13*(1-t/.7)));});
    }
    renderer.render(scene,camera);
  }
  const basicRange=basic(CYAN,.3);
  resize();
  return{render,resize,pointerToWorld,worldToScreen,assetsStatus:()=>modelStatus,stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,width,height,dpr:renderer.getPixelRatio(),modelStatus,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,elevation:55}}),dispose(){disposed=true;enemies.forEach(v=>v.label.material.map?.dispose());resources.forEach(r=>r.dispose());modelGeometries.forEach(g=>g.dispose());modelMaterials.forEach(m=>m.dispose());modelTextures.forEach(t=>t.dispose());renderer.dispose();}};
}
