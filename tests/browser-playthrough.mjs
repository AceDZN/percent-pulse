/** Supplement to the installed web-game action client: adaptive aim/weapon inputs,
 * all encounters, complete HUD screenshots, and production Chrome measurement.
 * Reads the public text hook; changes state ONLY with real keyboard/mouse input
 * and the deterministic time hook. Never injects HP, resources, encounters or wins.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='playtest-output/full';await fs.mkdir(out,{recursive:true});await fs.mkdir('docs/evidence',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1672,height:941},deviceScaleFactor:1});
page.setDefaultTimeout(60000);const errors=[],failed=[],remote=[],badResponses=[];
page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url().split('?')[0]});});page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>failed.push(r.url().split('?')[0]));page.on('request',r=>{if(!r.url().startsWith('http://localhost:4182')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))remote.push(r.url().split('?')[0]);});
await page.goto('http://localhost:4182/',{waitUntil:'networkidle',timeout:120000});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
await page.locator('#start-btn').click({force:true});await advance(0);
let pressed=new Set();
async function movement(x,z){const next=new Set();if(x>.2)next.add('KeyD');if(x<-.2)next.add('KeyA');if(z>.2)next.add('KeyS');if(z<-.2)next.add('KeyW');for(const k of pressed)if(!next.has(k))await page.keyboard.up(k);for(const k of next)if(!pressed.has(k))await page.keyboard.down(k);pressed=next;}
let lastEncounter=0,shots=0,retries=0,guard=0,waypoint=0,dashAt=0;const route=[{x:12,z:7},{x:12,z:-7},{x:-12,z:-7},{x:-12,z:7}];const history=[];const captures=[];
while(guard++<3500){
  const s=await state();if(s.mode==='won'){history.push({won:s});break;}
  if(s.mode==='failed'){await movement(0,0);await page.screenshot({path:`${out}/failure-${retries}.png`});history.push({failure:s});if(++retries>3)throw new Error('More than three retries');await page.locator('#retry').click({force:true});waypoint=0;dashAt=s.time;continue;}
  if(s.mode==='interlude'){await movement(0,0);await page.screenshot({path:`${out}/clear-${s.encounter}.png`});await advance(8100);continue;}
  if(s.mode!=='playing')throw new Error('Unexpected mode '+s.mode);
  if(s.encounter!==lastEncounter){lastEncounter=s.encounter;waypoint=0;history.push({encounter:s.encounter,ammo:s.ammo,preview:s.preview});if(s.encounter===5)assert.equal(s.preview,false);}
  let wp=route[waypoint];if(Math.hypot(s.player.x-wp.x,s.player.z-wp.z)<1.1){waypoint=(waypoint+1)%route.length;wp=route[waypoint];}
  let dx=wp.x-s.player.x,dz=wp.z-s.player.z;
  for(const h of s.hazards){if(h.charge>=1)continue;const ex=s.player.x-h.x,ez=s.player.z-h.z;
    if(h.kind==='sweep'){
      const side=ex*Math.cos(h.angle)-ez*Math.sin(h.angle);
      if(Math.abs(side)<3.6){const n={x:Math.cos(h.angle),z:-Math.sin(h.angle)};let sign=side>=0?1:-1;if(Math.abs(s.player.x+n.x*sign*4)>15||Math.abs(s.player.z+n.z*sign*4)>10)sign=-sign;dx=n.x*sign;dz=n.z*sign;}
    }else if(h.kind==='arc'){const d=Math.hypot(ex,ez);if(Math.abs(d-h.radius)<3.7){let sign=d>h.radius?1:-1;if(Math.hypot((s.player.x+ex/d*sign*4)/16.1,(s.player.z+ez/d*sign*4)/11.1)>1)sign=-sign;dx=ex/d*sign;dz=ez/d*sign;}}else if(Math.hypot(ex,ez)<4){dx=ex||1;dz=ez||-1;}
  }
  await movement(dx,dz);
  const fast=s.enemies.find(e=>e.family==='skitter'),enemy=(s.encounter===2&&s.ammo.pulse===2?s.enemies.find(e=>e.family==='anchor'):undefined)||fast||s.enemies[0];
  if(enemy&&s.cooldown<.001){
    const screen=s.screen.enemies.find(e=>e.id===enemy.id);await page.mouse.move(screen.x,screen.y);
    if(s.encounter===4&&enemy.maxHp===27&&s.boost.available&&!s.boost.armed)await page.keyboard.press('KeyE');
    const kind=enemy.family==='anchor'&&s.ammo.pulse>0?'pulse':'bolt';
    if(kind==='pulse'){await page.keyboard.down('KeyQ');await advance(17);await page.keyboard.up('KeyQ');}else await page.mouse.click(screen.x,screen.y);
    shots++;await advance(0);const after=await state();
    if(s.encounter===2&&enemy.family==='anchor'&&after.receipts.at(-1)?.kind==='pulse'){
      const r=after.receipts.at(-1);if(['72','54'].includes(r.after)){await page.screenshot({path:`docs/evidence/pulse-${r.after}.png`});captures.push(`pulse-${r.after}.png`);}}
    if(s.encounter===4&&after.receipts.at(-1)?.boosted){await page.screenshot({path:'docs/evidence/boost-27.png'});captures.push('boost-27.png');}
    if(s.encounter===5&&after.receipts.length>0&&!captures.includes('transfer.png')){await page.screenshot({path:'docs/evidence/transfer.png'});captures.push('transfer.png');}
  }
  if(s.time-dashAt>6.3&&Math.abs(s.player.x)<13&&Math.abs(s.player.z)<8){await page.keyboard.press('Space');dashAt=s.time;}
  await advance(200);
}
await movement(0,0);const final=await state();assert.equal(final.mode,'won');assert.equal(final.hintUses,0);await page.screenshot({path:'docs/evidence/victory.png'});history.push({final,shots,errors,failed,remote,badResponses,captures});
// Pause/resume and restart are verified after a fresh real Start click.
await page.locator('#again').click({force:true});await advance(400);await page.keyboard.press('Escape');const paused=await state();await advance(5000);assert.equal((await state()).time,paused.time);assert.equal(paused.mode,'paused');await page.locator('#resume').click({force:true});await advance(100);assert.ok((await state()).time>paused.time);
await page.keyboard.press('Escape');await page.locator('#retry').click({force:true});assert.equal((await state()).player.hp,100);
await page.setViewportSize({width:768,height:1024});await advance(0);const resized=await state();await page.screenshot({path:`${out}/tablet.png`});assert.equal(resized.encounter,1);
await page.setViewportSize({width:1672,height:941});await advance(0);
// Failure is reached through no movement, no modified damage or state.
await advance(35000);assert.equal((await state()).mode,'failed');await page.screenshot({path:'docs/evidence/failure.png'});await page.locator('#retry').click({force:true});assert.equal((await state()).player.hp,100);
await fs.writeFile(`${out}/report.json`,JSON.stringify({browser:await browser.version(),viewport:'1672x941 DPR1',history,errors,failed,remote,badResponses},null,2));
console.log(JSON.stringify({browser:await browser.version(),mode:final.mode,encounters:final.encounter,time:final.time,retries,shots,errors,failed,remote,badResponses,captures}));await browser.close();
