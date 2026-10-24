import { Rational, resolveStrike, type AttackKind } from './math';

export type Family = 'anchor' | 'skitter';
export type Mode = 'title' | 'playing' | 'paused' | 'clear' | 'failed' | 'won';
export interface Spawn { hp: number; at: number; x: number; z: number; family: Family; boss?: boolean }
const sk = (hp: number, at: number, x: number, z: number): Spawn => ({ hp, at, x, z, family: 'skitter' });
const an = (hp: number, at: number, x: number, z: number, boss = false): Spawn => ({ hp, at, x, z, family: 'anchor', boss });
export const WAVES: { name: string; spawns: Spawn[] }[] = [
  { name: 'פשוט לזוז', spawns: [sk(18,.7,-4,-2.5), sk(36,1,4,-3), sk(18,1.3,0,-4.8)] },
  { name: 'הפעימה שלכם', spawns: [an(96,0,0,-1.5), sk(24,0,-4,.4), sk(24,0,4,.4), sk(24,0,-2.8,-1)] },
  { name: 'באים ביחד', spawns: [sk(36,0,-5,-3),sk(36,.8,5,-3),sk(54,2,0,-5),sk(36,4,-6,1),sk(36,5,6,1),sk(54,7,0,-5)] },
  { name: 'משהו גדול בדרך', spawns: [sk(36,0,-5,-3),sk(36,.8,5,-3),sk(36,1.6,0,-5),an(216,5,0,-4),sk(54,8,-6,1),sk(54,10,6,1),sk(54,12,0,-5)] },
  { name: 'שני עוגנים', spawns: [an(144,0,-4,-3),an(180,2,4,-3),sk(36,3,-6,1),sk(36,5,6,1),sk(54,7,0,-5),sk(36,9,-5,3)] },
  { name: 'בכל הכיוונים', spawns: [sk(54,0,-5,-3),sk(54,1,5,-3),sk(54,3,0,-5),sk(54,5,-6,1),sk(54,7,6,1),an(144,8,0,-4),sk(54,9,-5,3),sk(54,11,5,3),sk(54,13,0,-5)] },
  { name: 'שומרים מרחק', spawns: [an(252,0,-4,-3),sk(72,2,5,-3),sk(72,4,-6,1),an(252,6,4,-3),sk(72,10,0,-5),sk(72,13,6,2)] },
  { name: 'הלב האחרון', spawns: [an(720,0,0,-3,true),sk(54,4,-6,1),sk(54,8,6,1),sk(54,12,-5,-3),sk(54,16,5,-3),sk(54,20,-5,3),sk(54,24,5,3)] },
];
// Retained export name for tools consuming formation metadata, with no v1 timers/ammo.
export const ENCOUNTERS = WAVES;
export interface Enemy {
  id: number; x: number; z: number; angle: number; hp: Rational; maxHp: number;
  family: Family; phase: string; telegraph: number; hitFlash: number; stun: number; boss: boolean;
  attackCooldown: number; windup: number; attackX: number; attackZ: number;
  rush: number; rushX: number; rushZ: number;
}
export interface Hazard {
  id: number; source: number; x: number; z: number; radius: number; angle: number;
  width: number; kind: 'burst' | 'lane'; charge: number; age: number; duration: number; hit: boolean;
}
export interface Receipt { time: number; target: number; kind: AttackKind; before: string; raw: string; applied: string; after: string; boosted: boolean }
export class Game {
  mode: Mode = 'title'; wave = 0; time = 0; waveTime = 0;
  phase: 'move' | 'combat' | 'pulse-intro' = 'move';
  player = { x: 0, z: 3.3, angle: Math.PI, hp: 100, invulnerable: 0, moving: 0 };
  moveInput = { x: 0, z: 0 }; destination: { x: number; z: number } | null = null;
  aim = { x: 0, z: -3 }; targetId: number | null = null;
  enemies: Enemy[] = []; pending: Spawn[] = []; hazards: Hazard[] = [];
  shots: { x: number; z: number; toX: number; toZ: number; kind: AttackKind; age: number }[] = [];
  bursts: { id: number; x: number; z: number; age: number }[] = [];
  pulseWaves: { x: number; z: number; age: number; radius: number }[] = [];
  charges = 2; autoRange = 18; pulseRadius = 5.4; pulseCooldown = 0; shotCooldown = .35;
  kills = 0; waveKills = 0; retries = 0; pulses = 0; hurtCount = 0; hintUses = 0;
  guided = true; pulseIntroduced = false; movedDistance = 0; effectsReduced = false;
  reason = ''; lastMessage = ''; messageTime = 0;
  receipts: Receipt[] = []; receiptStart = 0;
  events: { t: number; event: string; data: unknown }[] = [];
  private id = 1; private hazardId = 1;
  log(event: string, data: unknown = {}) {
    this.events.push({ t: +this.time.toFixed(3), event, data: structuredClone(data) });
    if (this.events.length > 1200) this.events.shift();
  }
  start(guided = true) {
    this.wave = 0; this.time = 0; this.kills = 0; this.retries = 0; this.pulses = 0;
    this.hurtCount = 0; this.hintUses = 0; this.receipts = []; this.events = [];
    this.guided = guided; this.pulseIntroduced = !guided; this.id = 1; this.hazardId = 1;
    this.player.hp = 100; this.setup();
  }
  setup() {
    this.mode = 'playing'; this.waveTime = 0; this.waveKills = 0; this.movedDistance = 0;
    this.phase = this.guided && this.wave === 0 ? 'move' : this.guided && this.wave === 1 && !this.pulseIntroduced ? 'pulse-intro' : 'combat';
    const hp = this.player.hp;
    this.player = { x: 0, z: 3.3, angle: Math.PI, hp, invulnerable: 1.4, moving: 0 };
    this.moveInput = { x: 0, z: 0 }; this.destination = null; this.targetId = null;
    this.enemies = []; this.hazards = []; this.shots = []; this.bursts = []; this.pulseWaves = [];
    this.pending = WAVES[this.wave].spawns.map(s => ({ ...s }));
    this.charges = this.wave === 0 ? 0 : 2; this.pulseCooldown = 0; this.shotCooldown = .35;
    this.receiptStart = this.receipts.length; this.reason = '';
    this.lastMessage = ''; this.messageTime = 0;
    if (this.phase === 'pulse-intro') { while(this.pending.length && this.pending[0].at === 0) this.spawn(this.pending.shift()!); this.shotCooldown = .75; }
    this.log('wave-start', { version: 2, wave: this.wave + 1, hp, charges: this.charges, guided: this.guided });
  }
  next() {
    if (this.mode !== 'clear') return;
    this.wave++; this.setup();
  }
  retry() {
    if (this.mode !== 'failed' && this.mode !== 'paused') return;
    this.retries++; this.log('retry', { wave: this.wave + 1 });
    this.player.hp = 100; this.setup();
  }
  pause() {
    if (this.mode === 'playing') { this.mode = 'paused'; this.stop(); this.log('pause'); }
    else if (this.mode === 'paused') { this.mode = 'playing'; this.log('resume'); }
  }
  stop() { this.moveInput = { x: 0, z: 0 }; this.destination = null; }
  move(x: number, z: number) { this.moveInput = { x, z }; if (x || z) this.destination = null; }
  setDestination(x: number, z: number) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    this.destination = this.bound(x, z); this.moveInput = { x: 0, z: 0 };
  }
  help() { this.hintUses++; this.log('help', { wave: this.wave + 1 }); }
  skipGuidance() { this.guided = false; this.pulseIntroduced = true; if (this.phase !== 'combat') this.phase = 'combat'; this.log('guidance-skipped'); }
  bound(x: number, z: number, rx = 8.4, rz = 6.25) {
    const edge = Math.hypot(x / rx, z / rz);
    return edge > 1 ? { x: x / edge, z: z / edge } : { x, z };
  }
  spawn(s: Spawn) {
    const e: Enemy = { id: this.id++, x: s.x, z: s.z, angle: 0, hp: new Rational(s.hp), maxHp: s.hp,
      family: s.family, phase: 'pursue', telegraph: 0, hitFlash: 0, stun: 0, boss: !!s.boss,
      attackCooldown: s.family === 'anchor' ? 2.3 : 1.4, windup: 0, attackX: 0, attackZ: 0,
      rush: 0, rushX: 0, rushZ: 0 };
    this.enemies.push(e); this.log('spawn', { id: e.id, hp: s.hp, family: s.family, boss: e.boss });
    return e;
  }
  target() {
    const live = this.enemies.filter(e => e.hp.n > 0n && Math.hypot(e.x - this.player.x, e.z - this.player.z) <= this.autoRange);
    const stable = live.find(e => e.id === this.targetId);
    const result = stable || live.sort((a,b) => Math.hypot(a.x-this.player.x,a.z-this.player.z)-Math.hypot(b.x-this.player.x,b.z-this.player.z))[0];
    this.targetId = result?.id ?? null;
    return result;
  }
  pulseTargets() { return this.enemies.filter(e => e.hp.n > 0n && Math.hypot(e.x-this.player.x,e.z-this.player.z) <= this.pulseRadius); }
  strike(e: Enemy, kind: AttackKind) {
    if (e.hp.n <= 0n) return false;
    const r = resolveStrike(e.hp, kind, false);
    e.hp = r.after; e.hitFlash = .22;
    this.shots.push({ x: this.player.x, z: this.player.z, toX: e.x, toZ: e.z, kind, age: 0 });
    const receipt: Receipt = { time: +this.time.toFixed(3), target: e.id, kind, before: r.before.toString(),
      raw: r.raw.toString(), applied: r.applied.toString(), after: r.after.toString(), boosted: false };
    this.receipts.push(receipt); this.log('hit', receipt);
    if (e.hp.n === 0n) {
      this.kills++; this.waveKills++;
      this.bursts.push({ id: e.id, x: e.x, z: e.z, age: 0 });
      this.hazards = this.hazards.filter(h => h.source !== e.id);
      this.log('destroyed', { target: e.id, wave: this.wave + 1 });
    }
    return true;
  }
  pulse() {
    if (this.mode !== 'playing' || this.charges <= 0 || this.pulseCooldown > 0 || this.phase === 'move') return false;
    const targets = this.pulseTargets();
    if (!targets.length) { this.lastMessage = 'התקרבו לאויבים — הטבעת מראה את הטווח'; this.messageTime = 2; this.log('pulse-empty'); return false; }
    this.charges--; this.pulses++; this.pulseCooldown = .9; this.shotCooldown = Math.max(this.shotCooldown, .75);
    this.pulseWaves.push({ x: this.player.x, z: this.player.z, age: 0, radius: this.pulseRadius });
    const ids = new Set(targets.map(e => e.id));
    this.hazards = this.hazards.filter(h => !ids.has(h.source));
    for (const e of targets) {
      this.strike(e, 'pulse');
      const dx=e.x-this.player.x, dz=e.z-this.player.z, l=Math.hypot(dx,dz)||1;
      const pushed = this.bound(e.x+dx/l*1.8,e.z+dz/l*1.8,8.2,6);
      e.x=pushed.x; e.z=pushed.z; e.stun=.8; e.windup=0; e.rush=0; e.telegraph=0; e.phase='stunned'; e.attackCooldown=1.6;
    }
    if (this.phase === 'pulse-intro') { this.phase='combat'; this.pulseIntroduced=true; this.lastMessage='בדיוק! עכשיו ממשיכים לזוז'; this.messageTime=2.5; }
    this.log('pulse', { count: targets.length, charges: this.charges, radius: this.pulseRadius });
    return true;
  }
  hurt(source: string) {
    if (this.mode !== 'playing' || this.phase !== 'combat' || this.player.invulnerable > 0 || (this.wave === 0 && this.waveTime < 8)) return;
    this.player.hp = Math.max(0,this.player.hp-20); this.player.invulnerable=1.6; this.hurtCount++;
    this.lastMessage='אזור זהוב מזהיר לפני פגיעה — צאו ממנו'; this.messageTime=2.2;
    this.log('hurt',{ source, hp:this.player.hp });
    if (this.player.hp===0) { this.mode='failed'; this.reason='אפשר לנסות שוב את אותו גל'; this.stop(); this.log('failed',{wave:this.wave+1}); }
  }
  beginAttack(e: Enemy) {
    e.windup=e.family==='skitter'?1.2:1.4; e.attackX=this.player.x; e.attackZ=this.player.z; e.phase='windup'; e.telegraph=0;
    const dx=e.attackX-e.x,dz=e.attackZ-e.z;
    if(e.family==='skitter'){
      this.hazards.push({id:this.hazardId++,source:e.id,x:(e.x+e.attackX)/2,z:(e.z+e.attackZ)/2,radius:Math.hypot(dx,dz)/2+.65,angle:Math.atan2(dx,dz),width:1.35,kind:'lane',charge:0,age:0,duration:1.2,hit:false});
    } else {
      const spread=e.boss?[-2.5,0,2.5]:[0];
      for(const offset of spread){const pos=this.bound(e.attackX+offset,e.attackZ,8.1,6);
        this.hazards.push({id:this.hazardId++,source:e.id,x:pos.x,z:pos.z,radius:e.boss?1.45:1.65,angle:0,width:0,kind:'burst',charge:0,age:0,duration:1.4,hit:false});}
    }
    this.log('warning',{source:e.id,kind:e.family,duration:e.windup});
  }
  advanceEffects(dt:number) {
    for(const s of this.shots)s.age+=dt;this.shots=this.shots.filter(s=>s.age<.22);
    for(const b of this.bursts)b.age+=dt;this.bursts=this.bursts.filter(b=>b.age<.65);
    for(const p of this.pulseWaves)p.age+=dt;this.pulseWaves=this.pulseWaves.filter(p=>p.age<.65);
  }
  tick(dt: number) {
    if(this.mode==='clear'||this.mode==='won'){this.advanceEffects(dt);return;}
    if(this.mode!=='playing')return;
    this.time+=dt; this.player.invulnerable=Math.max(0,this.player.invulnerable-dt);
    this.pulseCooldown=Math.max(0,this.pulseCooldown-dt); this.shotCooldown=Math.max(0,this.shotCooldown-dt);
    this.messageTime=Math.max(0,this.messageTime-dt);
    let mx=this.moveInput.x,mz=this.moveInput.z;
    if(this.destination&&!mx&&!mz){const dx=this.destination.x-this.player.x,dz=this.destination.z-this.player.z,l=Math.hypot(dx,dz);if(l<.15)this.destination=null;else{mx=dx/l;mz=dz/l;}}
    const length=Math.hypot(mx,mz); if(length>1){mx/=length;mz/=length;}
    this.player.moving=Math.min(1,length);
    const before={x:this.player.x,z:this.player.z};const moved=this.bound(this.player.x+mx*5.6*dt,this.player.z+mz*5.6*dt);
    this.player.x=moved.x;this.player.z=moved.z;this.movedDistance+=Math.hypot(moved.x-before.x,moved.z-before.z);
    if(this.phase==='move'&&this.movedDistance>.45){this.phase='combat';this.log('movement-learned');}
    if(this.phase==='combat'){
      this.waveTime+=dt;
      while(this.pending.length&&this.pending[0].at<=this.waveTime)this.spawn(this.pending.shift()!);
    }
    const target=this.target();
    if(target){this.aim={x:target.x,z:target.z};this.player.angle=Math.atan2(target.x-this.player.x,target.z-this.player.z);}
    else if(length>.1)this.player.angle=Math.atan2(mx,mz);
    for(const e of this.enemies){
      if(e.hp.n<=0n)continue;
      e.hitFlash=Math.max(0,e.hitFlash-dt);e.stun=Math.max(0,e.stun-dt);
      if(this.phase!=='combat'){e.phase='idle';continue;}
      if(e.stun>0){e.phase='stunned';continue;}
      const dx=this.player.x-e.x,dz=this.player.z-e.z,l=Math.hypot(dx,dz)||1;
      e.angle=Math.atan2(dx,dz);e.attackCooldown=Math.max(0,e.attackCooldown-dt);
      if(e.windup>0){
        e.windup=Math.max(0,e.windup-dt);e.telegraph=1-e.windup/(e.family==='skitter'?1.2:1.4);e.phase='windup';
        if(e.windup===0){e.phase='recover';e.telegraph=0;e.attackCooldown=e.boss?2.1:e.family==='anchor'?3.2:2.3;
          if(e.family==='skitter'){e.rush=.18;e.rushX=(e.attackX-e.x)/.18;e.rushZ=(e.attackZ-e.z)/.18;}}
      }else if(e.rush>0){e.rush=Math.max(0,e.rush-dt);const pos=this.bound(e.x+e.rushX*dt,e.z+e.rushZ*dt,8.2,6);e.x=pos.x;e.z=pos.z;e.phase='rush';}
      else if(e.attackCooldown<=0&&(e.family==='anchor'||l<3.4))this.beginAttack(e);
      else{
        e.phase='pursue';const stop=e.family==='anchor'?4.5:2.3;const speed=e.family==='anchor'?.34:1.15+this.wave*.06;
        if(l>stop){const pos=this.bound(e.x+dx/l*speed*dt,e.z+dz/l*speed*dt,8.2,6);e.x=pos.x;e.z=pos.z;}
      }
    }
    if(this.phase==='combat'&&target&&this.shotCooldown<=0){this.strike(target,'bolt');this.shotCooldown=.58;}
    for(const h of this.hazards){
      h.age+=dt;h.charge=Math.min(1,h.age/h.duration);
      if(h.age>=h.duration&&!h.hit){h.hit=true;const dx=this.player.x-h.x,dz=this.player.z-h.z;
        const side=Math.abs(dx*Math.cos(h.angle)-dz*Math.sin(h.angle)),along=Math.abs(dx*Math.sin(h.angle)+dz*Math.cos(h.angle));
        if(h.kind==='lane'?(side<h.width/2+.35&&along<h.radius):Math.hypot(dx,dz)<h.radius+.35)this.hurt(h.kind);
        else this.log('avoided',{source:h.source});}
    }
    this.hazards=this.hazards.filter(h=>h.age<h.duration+.25&&this.enemies.some(e=>e.id===h.source&&e.hp.n>0n));
    this.advanceEffects(dt);
    if(this.mode!=='playing')return;
    const alive=this.enemies.some(e=>e.hp.n>0n);
    if(this.phase==='combat'&&!alive&&this.pending.length&&this.pending[0].at>this.waveTime+.6)this.pending[0].at=this.waveTime+.6;
    if(this.phase==='combat'&&!alive&&!this.pending.length){
      this.hazards=[];this.stop();this.targetId=null;this.player.hp=Math.min(100,this.player.hp+20);
      this.mode=this.wave===WAVES.length-1?'won':'clear';this.log('wave-cleared',{wave:this.wave+1,seconds:this.waveTime});
      if(this.mode==='won')this.log('won',{seconds:this.time,retries:this.retries});
    }
  }
  text() {
    const preview=this.pulseTargets().map(e=>({target:e.id,before:e.hp.toString(),raw:resolveStrike(e.hp,'pulse').raw.toString()}));
    return {version:2,coordinates:'x right, z toward camera; floor y0; player ellipse (x/8.4)^2+(z/6.25)^2<=1; hazards lane heading atan2(dx,dz), radius half-length, width full',mode:this.mode,wave:this.wave+1,name:WAVES[this.wave].name,phase:this.phase,time:+this.time.toFixed(2),waveTime:+this.waveTime.toFixed(2),player:{...this.player},movement:this.moveInput,destination:this.destination,target:this.targetId,autoFire:{damage:18,unlimited:true,cooldown:this.shotCooldown,range:this.autoRange},pulse:{charges:this.charges,cooldown:this.pulseCooldown,radius:this.pulseRadius,preview},enemies:this.enemies.filter(e=>e.hp.n>0n).map(e=>({...e,hp:e.hp.toNumber(),hpExact:e.hp.toString()})),pending:this.pending.map(s=>({...s,in:Math.max(0,+(s.at-this.waveTime).toFixed(2))})),hazards:this.hazards,receipts:this.receipts.slice(this.receiptStart).slice(-5),waveKills:this.waveKills,waveTotal:WAVES[this.wave].spawns.length,kills:this.kills,retries:this.retries,pulses:this.pulses,hintUses:this.hintUses,reason:this.reason};
  }
}
