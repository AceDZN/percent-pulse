/** v2 production replay: real movement + Space only, read-only state observation.
 * No injected enemies/HP/resources/levels/wins; deterministic time is the public hook. */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='docs/rebuild-v2/actual';
await fs.mkdir(out,{recursive:true});
await fs.mkdir('playtest-output/rebuild',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1672,height:941},deviceScaleFactor:1});
page.setDefaultTimeout(60000);
const errors=[],badResponses=[],external=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url().split('?')[0],status:r.status()});});
page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://localhost:4182/'))external.push(r.url().split('?')[0]);});
await page.goto('http://localhost:4182/',{waitUntil:'networkidle'});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const step=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
await page.locator('#start-btn').click();await step(0);
let held=new Set();
async function move(x,z){const next=new Set();if(x>.18)next.add('ArrowRight');if(x<-.18)next.add('ArrowLeft');if(z>.18)next.add('ArrowDown');if(z<-.18)next.add('ArrowUp');for(const k of held)if(!next.has(k))await page.keyboard.up(k);for(const k of next)if(!held.has(k))await page.keyboard.down(k);held=next;}
async function shot(name){await step(0);await page.waitForTimeout(200);await page.screenshot({path:out+'/'+name+'.png'});await fs.writeFile(out+'/'+name+'.json',JSON.stringify(await state(),null,2));}
const waypoints=[{x:-5,z:3.5},{x:-5,z:-3.5},{x:5,z:-3.5},{x:5,z:3.5}];
let wp=0,lastWave=0,retries=0,guard=0;const history=[];const captured=new Set();
while(guard++<2200){
  let s=await state();
  if(s.mode==='won'){await move(0,0);await shot('victory');history.push({won:s});break;}
  if(s.mode==='failed'){history.push({failed:s});await shot('failure-in-run');if(++retries>2)throw new Error('Repeated replay failure');await page.locator('#retry').click();held.clear();wp=0;continue;}
  if(s.mode==='clear'){
    await move(0,0);assert.equal(s.hazards.length,0);const t=s.time;
    await step(1200);assert.equal((await state()).time,t,'cleared wave has no survival timer');
    history.push({cleared:s.wave,seconds:s.waveTime,hp:s.player.hp,kills:s.waveKills});
    if(s.wave===1){await shot('clear');captured.add('clear');}
    await page.keyboard.press('Space');held.clear();wp=0;continue;
  }
  assert.equal(s.mode,'playing');
  if(lastWave!==s.wave){lastWave=s.wave;wp=0;history.push({wave:s.wave,phase:s.phase});}
  if(s.phase==='pulse-intro'){
    await move(0,0);
    await step(3000);s=await state();assert.equal(s.player.hp,100);
    assert.equal(s.enemies.find(e=>e.family==='anchor').hpExact,'96');
    await shot('pulse-intro');await page.keyboard.press('Space');await step(330);
    const after=await state();
    assert.equal(after.enemies.find(e=>e.family==='anchor').hpExact,'72');
    assert.equal(after.enemies.filter(e=>e.family==='skitter').every(e=>e.hpExact==='18'),true);
    assert.equal(after.pulse.charges,1);assert.match(await page.locator('#receipt').innerText(),/96.*24/s);
    await shot('combat');captured.add('combat');continue;
  }
  let goal=waypoints[wp];if(Math.hypot(s.player.x-goal.x,s.player.z-goal.z)<1){wp=(wp+1)%waypoints.length;goal=waypoints[wp];}
  let x=goal.x-s.player.x,z=goal.z-s.player.z;
  for(const h of s.hazards){
    if(h.charge>=1)continue;
    const dx=s.player.x-h.x,dz=s.player.z-h.z;
    if(h.kind==='burst'&&Math.hypot(dx,dz)<h.radius+1.4){x=dx||1;z=dz||-1;}
    if(h.kind==='lane'){
      const side=dx*Math.cos(h.angle)-dz*Math.sin(h.angle);
      if(Math.abs(side)<h.width/2+1.2){const sign=side>=0?1:-1;x=Math.cos(h.angle)*sign;z=-Math.sin(h.angle)*sign;}
    }
  }
  await move(x,z);
  if(s.wave===1&&!captured.has('opening')&&s.receipts.length>0){await shot('opening');captured.add('opening');}
  if(s.wave>2&&s.pulse.charges&&s.pulse.cooldown<=0&&s.pulse.preview.length){
    const big=s.pulse.preview.some(r=>{const e=s.enemies.find(e=>e.id===r.target);return e&&e.hp>72;});
    const urgent=s.hazards.some(h=>h.charge>.55&&h.charge<1);
    if(big||s.pulse.preview.length>=3||urgent){await page.keyboard.press('Space');await step(100);if(!captured.has('multi-pulse')&&s.pulse.preview.length>1){await shot('multi-pulse');captured.add('multi-pulse');}}
  }
  await step(s.enemies.length?200:400);
}
const final=await state();assert.equal(final.mode,'won');assert.equal(final.wave,8);
assert.deepEqual(errors,[]);assert.deepEqual(badResponses,[]);assert.deepEqual(external,[]);
const report={browser:await browser.version(),viewport:'1672x941 DPR1',retries,history,final,errors,badResponses,external};
await fs.writeFile('playtest-output/rebuild/full-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({mode:final.mode,time:final.time,waves:final.wave,kills:final.kills,retries:final.retries,pulses:final.pulses,hp:final.player.hp,errors,badResponses,external,history:history.filter(h=>h.cleared)}));
await browser.close();
