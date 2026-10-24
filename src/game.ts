import { Rational, resolveStrike, type AttackKind } from './math';
export const ENCOUNTERS = [
  {name:'מגע ראשון',hp:[18],ammo:[2,1],duration:35},
  {name:'שני איומים',hp:[96,18],ammo:[4,2],duration:62},
  {name:'חלון נסגר',hp:[84,54],ammo:[6,2],duration:62},
  {name:'קפיצת כוח',hp:[96,27],ammo:[4,2],duration:62},
  {name:'דפוס חדש',hp:[120,36],ammo:[6,2],duration:75},
];
export interface Enemy {id:number;x:number;z:number;angle:number;hp:Rational;maxHp:number;family:'anchor'|'skitter';phase:string;telegraph:number;hitFlash:number;}
export interface Hazard {id:number;x:number;z:number;radius:number;angle:number;width:number;kind:string;charge:number;age:number;duration:number;hit:boolean;}
export interface Receipt {time:number;target:number;kind:AttackKind;before:string;raw:string;applied:string;after:string;boosted:boolean;}
export class Game {
  mode:'title'|'playing'|'paused'|'interlude'|'failed'|'won'='title';
  encounter=0;time=0;elapsed=0;interlude=0;reason='';kills=0;dashCount=0;retries=0;hintUses=0;
  player={x:0,z:7,angle:Math.PI,hp:100,dashTime:0,dashCooldown:0,invulnerable:0};
  aim={x:0,z:-7};moveInput={x:0,z:0};dashVector={x:0,z:-1};
  enemies:Enemy[]=[];hazards:Hazard[]=[];
  shots:{x:number;z:number;toX:number;toZ:number;kind:AttackKind;age:number}[]=[];
  ammo={bolt:2,pulse:1};boost={available:false,armed:false};cooldown=0;
  receipts:Receipt[]=[];receiptStart=0;events:{t:number;event:string;data:unknown}[]=[];
  lastMessage='';messageTime=0;preview=true;effectsReduced=false;nextHazard=1.8;hazardId=0;hurtCount=0;
  log(event:string,data:unknown={}){this.events.push({t:+this.time.toFixed(3),event,data});if(this.events.length>500)this.events.shift();}
  start(){this.encounter=0;this.time=0;this.kills=0;this.retries=0;this.dashCount=0;this.hintUses=0;this.receipts=[];this.events=[];this.setup();}
  setup(){
    const c=ENCOUNTERS[this.encounter];this.mode='playing';this.elapsed=0;this.nextHazard=1.8;this.reason='';this.cooldown=0;this.hazards=[];this.shots=[];this.receiptStart=this.receipts.length;
    this.player={x:0,z:7,angle:Math.PI,hp:100,dashTime:0,dashCooldown:0,invulnerable:1.2};this.moveInput={x:0,z:0};
    this.ammo={bolt:c.ammo[0],pulse:c.ammo[1]};this.boost={available:this.encounter===3,armed:false};this.preview=this.encounter<4;
    this.enemies=c.hp.map((hp,i)=>({id:this.encounter*10+i+1,x:i===0?0:8,z:i===0?-5:1,angle:0,hp:new Rational(hp),maxHp:hp,family:(hp<=36?'skitter':'anchor') as Enemy['family'],phase:'pursue',telegraph:0,hitFlash:0}));
    this.lastMessage=this.encounter===0?'זוזו מהפס לפני הפגיעה. רווח מזנק דרך הסכנה.':this.encounter===3?'תגבור זמין: הפעילו E לפני הפגיעה הרצויה.':this.encounter===4?'ערכים חדשים. בחרו את הירייה בלי תצוגת נזק מוקדמת.':'טהרו את הזירה ושרדו עד תום המחזור.';this.messageTime=6;this.log('encounter-start',{encounter:this.encounter+1,ammo:this.ammo});
  }
  retry(){if(this.mode==='failed'||this.mode==='paused'){this.retries++;this.log('retry',{encounter:this.encounter+1});this.setup();}}
  next(){if(this.mode==='interlude'){this.encounter++;this.setup();}}
  pause(){if(this.mode==='playing'){this.mode='paused';this.moveInput={x:0,z:0};this.log('pause');}else if(this.mode==='paused'){this.mode='playing';this.log('resume');}}
  move(x:number,z:number){this.moveInput={x,z};}
  toggleBoost(){if(this.mode==='playing'&&this.boost.available){this.boost.armed=!this.boost.armed;this.log('boost-armed',{armed:this.boost.armed});}}
  help(){this.hintUses++;this.log('help',{encounter:this.encounter+1});}
  target(){
    const dx=this.aim.x-this.player.x,dz=this.aim.z-this.player.z,l=Math.hypot(dx,dz);if(l<.05)return undefined;
    return this.enemies.filter(e=>e.hp.n>0n).map(e=>{const ex=e.x-this.player.x,ez=e.z-this.player.z,along=(ex*dx+ez*dz)/l;return {e,along,side:Math.abs(ex*dz-ez*dx)/l};}).filter(v=>v.along>0&&v.along<38&&v.side<(v.e.family==='anchor'?1.25:.82)).sort((a,b)=>a.along-b.along)[0]?.e;
  }
  fire(kind:AttackKind){
    if(this.mode!=='playing'||this.cooldown>0||this.ammo[kind]<=0)return false;
    this.cooldown=kind==='bolt'?.52:.85;const e=this.target();const end=e||this.aim;
    this.shots.push({x:this.player.x,z:this.player.z,toX:end.x,toZ:end.z,kind,age:0});
    if(!e){this.lastMessage='החטאה: התחמושת והתגבור נשמרו.';this.messageTime=1.3;this.log('miss',{kind});return false;}
    const r=resolveStrike(e.hp,kind,this.boost.armed);this.ammo[kind]--;e.hp=r.after;e.hitFlash=.2;
    if(r.boosted){this.boost.armed=false;this.boost.available=false;this.lastMessage='התגבור הוחל על הנזק הגולמי ונוצל.';this.messageTime=2;}
    const receipt={time:+this.time.toFixed(3),target:e.id,kind,before:r.before.toString(),raw:r.raw.toString(),applied:r.applied.toString(),after:r.after.toString(),boosted:r.boosted};
    this.receipts.push(receipt);this.log('hit',receipt);if(e.hp.n===0n){this.kills++;this.log('destroyed',{target:e.id});}
    if(this.ammo.bolt===0&&this.enemies.some(e=>e.hp.n>0n))this.fail(this.ammo.pulse===0?'התחמושת נגמרה. בחרו סדר יריות חדש.':'נותרו רק יריות אחוז. הן לא מגיעות לאפס; נסו לשמור Bolt לסיום.');
    return true;
  }
  dash(){
    if(this.mode!=='playing'||this.player.dashCooldown>0)return;
    let {x,z}=this.moveInput;let l=Math.hypot(x,z);if(!l){x=this.aim.x-this.player.x;z=this.aim.z-this.player.z;l=Math.hypot(x,z)||1;}
    this.dashVector={x:x/l,z:z/l};this.player.dashTime=.22;this.player.dashCooldown=2.2;this.player.invulnerable=.32;this.dashCount++;this.log('dash');
  }
  hurt(amount:number,source:string){if(this.player.invulnerable>0)return;this.player.hp=Math.max(0,this.player.hp-amount);this.player.invulnerable=.9;this.hurtCount++;this.log('hurt',{amount,source,hp:this.player.hp});if(this.player.hp===0)this.fail('המגן נשבר. התחמקו מהאזור המסומן לפני הפגיעה.');}
  fail(reason:string){this.mode='failed';this.reason=reason;this.moveInput={x:0,z:0};this.log('failed',{reason});}
  spawnHazard(){
    const i=this.hazardId++; const arc=this.encounter>0&&i%4===2;const sweep=i%4<2;
    // Sweep long axis is (sin(angle), cos(angle)); exact strip collision matches mesh.
    const anchor=this.enemies.find(e=>e.family==='anchor'&&e.hp.n>0n);const cx=anchor?.x||0,cz=anchor?.z||0;
    const angle=arc?Math.atan2(this.player.x-cx,this.player.z-cz):i%2===0?Math.PI/2:0;
    this.hazards.push({id:i,x:arc?cx:sweep?(angle===0?this.player.x:0):this.player.x,z:arc?cz:sweep?(angle===0?0:this.player.z):this.player.z,radius:arc?Math.max(4,Math.min(14,Math.hypot(this.player.x-cx,this.player.z-cz))):sweep?20:2.8,angle,width:arc?2.4:2.1,kind:arc?'arc':sweep?'sweep':'burst',charge:0,age:0,duration:1.65,hit:false});
  }
  tick(dt:number){
    if(this.mode==='interlude'){this.interlude-=dt;if(this.interlude<=0)this.next();return;}
    if(this.mode!=='playing')return;
    this.time+=dt;this.elapsed+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.messageTime=Math.max(0,this.messageTime-dt);
    const p=this.player;p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);p.dashTime=Math.max(0,p.dashTime-dt);
    let mx=this.moveInput.x,mz=this.moveInput.z;const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}
    const speed=6.3;if(p.dashTime>0){mx=this.dashVector.x*4;mz=this.dashVector.z*4;}
    p.x+=mx*speed*dt;p.z+=mz*speed*dt;const edge=Math.hypot(p.x/16.1,p.z/11.1);if(edge>1){p.x/=edge;p.z/=edge;}p.angle=Math.atan2(this.aim.x-p.x,this.aim.z-p.z);
    for(const e of this.enemies){if(e.hp.n===0n)continue;e.hitFlash=Math.max(0,e.hitFlash-dt);
      const dx=p.x-e.x,dz=p.z-e.z,l=Math.hypot(dx,dz)||1;e.angle=Math.atan2(dx,dz);
      const cycle=(this.elapsed+e.id*.73)%(e.family==='anchor'?7:4.5);
      const windup=e.family==='anchor'?cycle>4.8&&cycle<6:cycle>2.6&&cycle<3.5;
      e.phase=windup?'windup':e.family==='skitter'&&cycle>=3.5?'rush':'pursue';e.telegraph=windup?(cycle-(e.family==='anchor'?4.8:2.6))/(e.family==='anchor'?1.2:.9):0;
      let es=e.family==='anchor'?.65:1.65;if(e.phase==='rush')es=5;if(windup)es=0;
      if(l>(e.family==='anchor'?2.6:1.2)){e.x+=dx/l*es*dt;e.z+=dz/l*es*dt;}
      if(l<(e.family==='anchor'?3:1.45)&&!windup)this.hurt(e.family==='anchor'?18:12,e.family);
    }
    if(this.elapsed>=this.nextHazard){this.spawnHazard();this.nextHazard=this.elapsed+Math.max(2.15,3.8-this.encounter*.27);}
    for(const h of this.hazards){h.age+=dt;h.charge=Math.min(1,h.age/h.duration);if(h.age>=h.duration&&!h.hit){h.hit=true;const dx=p.x-h.x,dz=p.z-h.z;const side=Math.abs(dx*Math.cos(h.angle)-dz*Math.sin(h.angle));const along=Math.abs(dx*Math.sin(h.angle)+dz*Math.cos(h.angle));const angle=Math.atan2(Math.sin(Math.atan2(dx,dz)-h.angle),Math.cos(Math.atan2(dx,dz)-h.angle));const collision=h.kind==='arc'?(Math.abs(Math.hypot(dx,dz)-h.radius)<h.width/2+.45&&Math.abs(angle)<Math.PI*.425):h.kind==='sweep'?(side<h.width/2+.45&&along<h.radius):Math.hypot(dx,dz)<h.radius+.4;if(collision)this.hurt(20,h.kind);else this.log('avoided',{hazard:h.kind});}}
    this.hazards=this.hazards.filter(h=>h.age<h.duration+.4);for(const s of this.shots)s.age+=dt;this.shots=this.shots.filter(s=>s.age<.24);
    if(this.mode!=='playing')return;
    if(this.elapsed>=ENCOUNTERS[this.encounter].duration&&this.enemies.every(e=>e.hp.n===0n)){
      this.log('encounter-cleared',{encounter:this.encounter+1,elapsed:this.elapsed});this.hazards=[];
      if(this.encounter===4){this.mode='won';this.log('won');}else{this.mode='interlude';this.interlude=8;}
    }
  }
  text(){return {coordinates:'x right, z down (+z toward camera); floor y=0; player center within exact ellipse (x/16.1)^2+(z/11.1)^2<=1; arc heading atan2(dx,dz), span 0.85PI, width radial',mode:this.mode,encounter:this.encounter+1,name:ENCOUNTERS[this.encounter].name,time:+this.time.toFixed(2),cycleRemaining:Math.max(0,+(ENCOUNTERS[this.encounter].duration-this.elapsed).toFixed(2)),player:{...this.player},aim:this.aim,enemies:this.enemies.filter(e=>e.hp.n>0n).map(e=>({...e,hp:e.hp.toNumber(),hpExact:e.hp.toString()})),hazards:this.hazards.map(h=>({...h})),ammo:this.ammo,boost:this.boost,cooldown:this.cooldown,preview:this.preview,target:this.target()?.id,receipts:this.receipts.slice(this.receiptStart).slice(-4),kills:this.kills,dashes:this.dashCount,retries:this.retries,hintUses:this.hintUses,reason:this.reason};}
}
