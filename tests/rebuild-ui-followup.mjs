// Narrow UI follow-up to the independent v2 control suite: real touch and Enter.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url = process.env.PERCENT_PULSE_URL || 'http://localhost:4182/';
const out = 'artifacts/rebuild-ui-followup';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
const errors = [], badResponses = [], external = [], results = [];
const observe = page => {
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) badResponses.push({ status: r.status(), url: r.url() }); });
  page.on('request', r => { if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(url).origin) external.push(r.url()); });
};
const read = page => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (page, ms) => page.evaluate(ms => window.advanceTime(ms), ms);
const shot = async (page, name) => { await page.waitForTimeout(250); await page.screenshot({ path: `${out}/${name}.png` }); };
const record = name => { results.push({ name, passed: true }); console.log('PASS ' + name); };
const inspectPulse = async page => {
  const s = await read(page);
  assert.equal(s.pulse.charges, 1); assert.equal(s.pulses, 1);
  assert.equal(s.enemies.find(e => e.family === 'anchor').hpExact, '72');
  assert.equal(s.enemies.filter(e => e.family === 'skitter').length, 3);
  assert.ok(s.enemies.filter(e => e.family === 'skitter').every(e => e.hpExact === '18'));
  assert.match(await page.locator('#receipt').innerText(), /25% × 96 = 24/);
  return s;
};
try {
  const desktopContext = await browser.newContext({ viewport: { width: 1672, height: 941 } });
  const desktop = await desktopContext.newPage(); observe(desktop);
  await desktop.addInitScript(() => localStorage.setItem('percent-pulse-v2-settings', JSON.stringify({ volume: 0, reduced: true, bindings: { up: 'KeyI', down: 'KeyS', left: 'KeyA', right: 'KeyD', pulse: 'Space' } })));
  await desktop.goto(url, { waitUntil: 'networkidle' }); await desktop.locator('#start-btn').click(); await advance(desktop, 0);
  const coachKeys = await desktop.locator('#coach kbd').allTextContents();
  assert.ok(coachKeys.includes('I')); assert.ok(!coachKeys.includes('W'));
  await desktop.keyboard.down('i'); await advance(desktop, 150); await desktop.keyboard.up('i');
  assert.equal((await read(desktop)).phase, 'combat');
  await advance(desktop, 5000); assert.equal((await read(desktop)).mode, 'clear');
  record('desktop movement coach displays the actual remapped key and that key unlocks ordinary combat');
  await desktop.locator('#next').click(); await advance(desktop, 0);
  assert.equal((await read(desktop)).phase, 'pulse-intro');
  await desktop.locator('#pulse').focus(); assert.equal(await desktop.evaluate(() => document.activeElement.id), 'pulse');
  await desktop.keyboard.press('Enter'); await advance(desktop, 100);
  const enterState = await inspectPulse(desktop);
  await shot(desktop, 'enter-pulse');
  record('Enter on the focused Pulse button activates exactly one area Pulse with a confirmed current-HP receipt');

  const touchContext = await browser.newContext({ viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true });
  const touch = await touchContext.newPage(); observe(touch);
  await touch.goto(url, { waitUntil: 'networkidle' }); await touch.locator('#start-btn').tap(); await advance(touch, 0);
  assert.match(await touch.locator('#coach').innerText(), /גררו את המקל/);
  assert.match(await touch.locator('#coach').innerText(), /ברצפה/);
  assert.equal(await touch.locator('#coach kbd').count(), 0);
  await shot(touch, 'touch-coach');
  const rect = await touch.locator('#stick').boundingBox(); assert.ok(rect);
  const client = await touchContext.newCDPSession(touch);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, id: 1 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: rect.x + rect.width * .8, y: rect.y + rect.height / 2, id: 1 }] });
  await advance(touch, 200); await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await advance(touch, 5000); assert.equal((await read(touch)).mode, 'clear');
  await touch.locator('#next').tap(); await advance(touch, 0);
  assert.equal((await read(touch)).phase, 'pulse-intro');
  assert.match(await touch.locator('#coach').innerText(), /כפתור הפעימה/);
  assert.equal(await touch.locator('#coach kbd').count(), 0);
  await shot(touch, 'touch-pulse-intro');
  await touch.locator('#pulse').tap(); await advance(touch, 100); const touchState = await inspectPulse(touch);
  await shot(touch, 'touch-pulse');
  await touch.setViewportSize({ width: 390, height: 844 }); await advance(touch, 0); await shot(touch, 'touch-portrait-pulse');
  record('touch coaching names the visible stick/floor and Pulse button; real touch produces the same exact four-target result');

  assert.deepEqual(errors, []); assert.deepEqual(badResponses, []); assert.deepEqual(external, []);
  record('follow-up has no page/console errors, failed responses or external requests');
  await fs.writeFile(`${out}/report.json`, JSON.stringify({ url, browser: await browser.version(), results, errors, badResponses, external, enterState, touchState }, null, 2));
  console.log(JSON.stringify({ checks: results.length, errors, badResponses, external }));
} catch (e) {
  await fs.writeFile(`${out}/report.json`, JSON.stringify({ url, results, errors, badResponses, external, error: String(e) }, null, 2));
  throw e;
} finally { await browser.close(); }
