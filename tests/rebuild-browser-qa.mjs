// V2 independent controls/recovery checks. Game changes use real input and the
// deterministic time hook; focus fallback is explicitly a synthetic blur event.
// No HP, resources, formations, or win states are injected.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url = process.env.PERCENT_PULSE_URL || 'http://localhost:4182/';
const origin = new URL(url).origin;
const out = 'artifacts/rebuild-qa'; await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
const results = [], errors = [], badResponses = [], external = [];
const observe = page => {
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push({ text: m.text(), location: m.location() }); });
  page.on('response', r => { if (r.status() >= 400) badResponses.push({ status: r.status(), url: r.url() }); });
  page.on('request', r => { if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== origin) external.push(r.url()); });
};
const record = (name, data = {}) => { results.push({ name, passed: true, ...data }); console.log('PASS ' + name); };
const read = page => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (page, ms) => page.evaluate(ms => window.advanceTime(ms), ms);
const capture = async (page, name) => {
  // Let CSS fades finish while the deterministic game clock remains frozen.
  await page.waitForTimeout(250);
  return page.screenshot({ path: `${out}/${name}.png` });
};
const number = text => { const [n, d = 1] = text.split('/').map(Number); return n / d; };
let page;
try {
  const context = await browser.newContext({ viewport: { width: 1672, height: 941 } });
  page = await context.newPage(); page.setDefaultTimeout(60000); observe(page);
  await page.addInitScript(() => localStorage.setItem('percent-pulse-v2-settings', '{corrupt'));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { polling: 100, timeout: 60000 });
  assert.equal((await read(page)).settings.bindings.pulse, 'Space');
  assert.equal((await read(page)).settings.volume, .18);
  await page.locator('#start-btn').click(); await advance(page, 20000);
  let s = await read(page);
  assert.equal(s.phase, 'move'); assert.equal(s.player.hp, 100); assert.equal(s.enemies.length, 0);
  assert.equal(await page.locator('#pulse').isVisible(), false);
  assert.match(await page.locator('#coach').innerText(), /הירי אוטומטי/);
  record('safe movement-only opening and corrupt-setting fallback');

  await page.keyboard.down('ArrowRight'); await advance(page, 150); await page.keyboard.up('ArrowRight');
  await advance(page, 1100); s = await read(page);
  assert.equal(s.phase, 'combat'); assert.ok(s.receipts.some(r => r.kind === 'bolt'));
  assert.equal(s.autoFire.unlimited, true); assert.equal(s.pulses, 0);
  await capture(page, 'opening-auto');
  record('ordinary attack occurs after movement with no aim/fire input');
  await advance(page, 4000); s = await read(page);
  assert.equal(s.mode, 'clear'); assert.equal(s.wave, 1); assert.equal(s.hazards.length, 0);
  const clearTime = s.time; await advance(page, 20000); assert.equal((await read(page)).time, clearTime);
  await capture(page, 'clear');
  record('enemy clearance ends wave immediately and clear state stays safe', { firstWaveSeconds: s.waveTime });

  // One held Next press must not also trigger the newly introduced ability.
  await page.keyboard.down('Space'); await advance(page, 0);
  await advance(page, 4000); await page.keyboard.down('Space');
  s = await read(page); assert.equal(s.wave, 2); assert.equal(s.phase, 'pulse-intro');
  assert.equal(s.player.hp, 100); assert.equal(s.pulse.charges, 2);
  assert.equal(s.enemies.find(e => e.family === 'anchor').hpExact, '96');
  assert.ok(s.enemies.filter(e => e.family === 'skitter').every(e => e.hpExact === '24'));
  assert.equal(s.hazards.length, 0); await page.keyboard.up('Space');
  record('held Next does not spend Pulse; safe four-target introduction remains unchanged');

  await page.keyboard.down('Space'); await advance(page, 100);
  s = await read(page); assert.equal(s.pulse.charges, 1); assert.equal(s.pulses, 1);
  const anchor = s.enemies.find(e => e.family === 'anchor'); assert.equal(anchor.hpExact, '72');
  assert.ok(s.enemies.filter(e => e.family === 'skitter').every(e => e.hpExact === '18'));
  assert.match(await page.locator('#receipt').innerText(), /25% × 96 = 24/);
  await capture(page, 'pulse-four-targets');
  await advance(page, 1100); await page.keyboard.down('Space'); s = await read(page);
  assert.equal(s.pulse.charges, 1); assert.equal(s.pulses, 1); await page.keyboard.up('Space');
  record('single Space spends one area charge; 96→72 and 24→18 are readable; hold does not repeat');

  await page.locator('#settings').click();
  await page.locator('#volume').focus(); await page.keyboard.press('Home'); await page.locator('#reduced').check();
  await page.locator('details > summary').click(); await page.locator('[data-binding="pulse"]').click(); await page.keyboard.press('p');
  await page.locator('#close-options').click(); await page.locator('#resume').click();
  s = await read(page); assert.equal(s.settings.volume, 0); assert.equal(s.settings.reduced, true); assert.equal(s.settings.bindings.pulse, 'KeyP');
  const target = s.screen.enemies.find(e => e.id === anchor.id);
  await page.mouse.click(target.x, target.y); await advance(page, 300);
  s = await read(page); assert.ok(s.destination); assert.ok(s.pulse.preview.length > 0);
  await page.keyboard.down('p'); await advance(page, 0); await page.keyboard.up('p');
  s = await read(page); assert.equal(s.pulse.charges, 0); assert.equal(s.pulses, 2);
  const pulses = s.receipts.filter(r => r.kind === 'pulse');
  const latestPulse = pulses.filter(r => r.time === pulses.at(-1).time).sort((a, b) => number(b.before) - number(a.before))[0];
  const receiptText = (await page.locator('#receipt').innerText()).replace(/\s/g, '');
  assert.ok(receiptText.includes(`25%×${number(latestPulse.before)}=${number(latestPulse.raw)}`), 'latest activation updates receipt instead of retaining an older larger hit');
  record('floor click moves; mute/reduced/remapped Pulse work; latest current base replaces old receipt');

  await page.keyboard.down('p'); await advance(page, 7000); await page.keyboard.down('p');
  s = await read(page); assert.equal(s.mode, 'clear'); assert.equal(s.wave, 2); assert.equal(s.pulses, 2);
  await page.keyboard.up('p');
  record('ordinary fire finishes with no charges and a held special key cannot skip a clear');
  await page.locator('#next').click(); await advance(page, 0);
  s = await read(page); assert.equal(s.wave, 3); assert.equal(s.pulse.charges, 2);
  const pointer = { x: s.screen.player.x + 120, y: s.screen.player.y - 20 };
  await page.mouse.click(pointer.x, pointer.y); await advance(page, 200);
  s = await read(page); assert.ok(s.destination); const pointerX = s.player.x;
  await page.keyboard.down('ArrowLeft'); await advance(page, 200); await page.keyboard.up('ArrowLeft');
  s = await read(page); assert.equal(s.destination, null); assert.ok(s.player.x < pointerX);
  record('keyboard movement overrides floor destination without an aiming mode');

  await page.keyboard.press('Escape'); const frozen = await read(page); await advance(page, 5000);
  assert.equal((await read(page)).time, frozen.time); assert.deepEqual((await read(page)).player, frozen.player);
  await page.locator('#resume').click(); await advance(page, 0); assert.equal((await read(page)).mode, 'playing');
  const resizeState = await read(page);
  await page.setViewportSize({ width: 768, height: 1024 }); await advance(page, 0); await capture(page, 'tablet');
  assert.deepEqual((await read(page)).player, resizeState.player); assert.equal((await read(page)).time, resizeState.time);
  await page.setViewportSize({ width: 390, height: 844 }); await advance(page, 0); await capture(page, 'portrait');
  assert.equal((await read(page)).wave, 3); assert.equal((await read(page)).time, resizeState.time);
  await page.setViewportSize({ width: 1672, height: 941 }); await advance(page, 0);
  await page.keyboard.press('f'); await page.waitForFunction(() => Boolean(document.fullscreenElement)); await advance(page, 0);
  await page.keyboard.press('f'); await page.waitForFunction(() => !document.fullscreenElement); await advance(page, 0);
  assert.equal((await read(page)).time, resizeState.time);
  record('pause, tablet/portrait resize and fullscreen preserve progress');

  await page.keyboard.down('ArrowRight'); await advance(page, 100);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  s = await read(page); assert.equal(s.mode, 'paused'); const blurred = { x: s.player.x, z: s.player.z };
  await page.locator('#resume').click(); await advance(page, 200); await page.keyboard.up('ArrowRight');
  s = await read(page); assert.equal(s.player.x, blurred.x); assert.equal(s.player.z, blurred.z);
  record('explicit blur handler clears held input and resumes safely', { method: 'synthetic blur event; native focus not claimed' });

  // Reach a genuine no-input mistake through ordinary progression, never by damage injection.
  const idleRoute = [];
  for (let i = 0; i < 500; i++) {
    s = await read(page);
    if (s.mode === 'failed' || s.mode === 'won') break;
    if (s.mode === 'clear') { idleRoute.push(s.wave); await page.locator('#next').click(); }
    else await advance(page, 500);
  }
  s = await read(page); assert.equal(s.mode, 'failed', 'later no-input play must expose a real recovery case');
  const failedWave = s.wave; assert.equal(s.player.hp, 0); await capture(page, 'failed');
  await page.locator('#retry').click(); s = await read(page);
  assert.equal(s.wave, failedWave); assert.equal(s.player.hp, 100); assert.equal(s.pulse.charges, 2); assert.equal(s.receipts.length, 0);
  record('actual no-input failure retries the current wave with restored health/charges', { failedWave, idleClears: idleRoute });

  const touchContext = await browser.newContext({ viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true });
  const touch = await touchContext.newPage(); touch.setDefaultTimeout(60000); observe(touch);
  await touch.goto(url, { waitUntil: 'networkidle' }); await touch.locator('#start-btn').tap(); await advance(touch, 0);
  const stick = await touch.locator('#stick').boundingBox(); assert.ok(stick);
  const client = await touchContext.newCDPSession(touch);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: stick.x + stick.width / 2, y: stick.y + stick.height / 2, id: 1 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: stick.x + stick.width * .8, y: stick.y + stick.height * .5, id: 1 }] });
  await advance(touch, 200); await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  let ts = await read(touch); assert.equal(ts.phase, 'combat'); assert.ok(ts.player.x > .45);
  await advance(touch, 5000); assert.equal((await read(touch)).mode, 'clear');
  await touch.locator('#next').tap(); await advance(touch, 0);
  assert.equal((await read(touch)).phase, 'pulse-intro');
  await touch.locator('#pulse').tap(); await advance(touch, 100); ts = await read(touch);
  assert.equal(ts.pulse.charges, 1); assert.equal(ts.enemies.find(e => e.family === 'anchor').hpExact, '72');
  assert.ok(ts.enemies.filter(e => e.family === 'skitter').every(e => e.hpExact === '18'));
  await capture(touch, 'touch-pulse');
  await touch.setViewportSize({ width: 390, height: 844 }); await advance(touch, 0); await capture(touch, 'touch-portrait-pulse');
  const rect = await touch.locator('#receipt').boundingBox();
  assert.ok(rect.height < 160);
  for (const e of (await read(touch)).screen.enemies) assert.ok(!(e.x >= rect.x && e.x <= rect.x + rect.width && e.y >= rect.y && e.y <= rect.y + rect.height), 'portrait receipt does not cover a live center');
  record('actual touch stick and single Pulse button complete the opening and show area damage on tablet/portrait');
  await touchContext.close();

  assert.deepEqual(errors, []); assert.deepEqual(badResponses, []); assert.deepEqual(external, []);
  record('no page/console errors, failed resource responses or external runtime requests');
  await fs.writeFile(`${out}/report.json`, JSON.stringify({ url, browser: await browser.version(), results, errors, badResponses, external, final: await read(page) }, null, 2));
  console.log(JSON.stringify({ checks: results.length, errors, badResponses, external }));
} catch (error) {
  if (page) await capture(page, 'diagnostic').catch(() => {});
  await fs.writeFile(`${out}/report.json`, JSON.stringify({ url, results, error: String(error), errors, badResponses, external, state: page ? await read(page).catch(() => null) : null }, null, 2));
  throw error;
} finally { await browser.close(); }
