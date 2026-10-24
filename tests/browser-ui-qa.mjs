// Independent production UI checks. All game changes use real controls; the only
// game API invocation is the documented deterministic time hook.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out = new URL('../artifacts/qa-ui/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
page.setDefaultTimeout(60000);
const errors = [], badResponses = [], external = [], results = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push({text:m.text(),location:m.location()}); });
page.on('response', r => { if (r.status() >= 400) badResponses.push({ url: r.url(), status: r.status() }); });
page.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith('http://localhost:4182/')) external.push(r.url()); });
const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = ms => page.evaluate(ms => window.advanceTime(ms), ms);
const screenshot = name => page.screenshot({ path: new URL(name + '.png', out).pathname });
const record = (name, data = {}) => { results.push({ name, passed: true, ...data }); console.log('PASS ' + name); };
try {
  // Verify defensive loading of malformed settings before entering actual play.
  await page.addInitScript(() => localStorage.setItem('percent-pulse-settings', '{broken JSON'));
  await page.goto('http://localhost:4182', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { timeout: 60000, polling: 250 });
  await page.waitForFunction(() => /loaded/.test(JSON.parse(window.render_game_to_text()).assets), null, { timeout: 60000, polling: 250 });
  assert.equal((await state()).settings.volume, .25);
  assert.equal((await state()).settings.bindings.bolt, 'KeyJ');
  record('malformed saved settings recover to valid defaults');
  await page.locator('#start-btn').click();
  await advance(0);
  let s = await state();
  assert.equal(s.mode, 'playing');
  assert.match(s.assets, /loaded/);
  assert.equal(await page.locator('#boost').isVisible(), false);
  const enemy = s.screen.enemies[0];
  await page.mouse.click(enemy.x, enemy.y);
  await advance(20);
  s = await state();
  assert.equal(s.receipts.at(-1).before, '18');
  assert.equal(s.receipts.at(-1).after, '0');
  assert.equal(s.ammo.bolt, 1);
  await screenshot('confirmed-hit');
  record('mouse hit confirms actual 18 to 0 receipt and hides unavailable boost');

  await page.keyboard.down('ArrowRight'); await advance(400); await page.keyboard.up('ArrowRight');
  const moved = await state(); assert.ok(moved.player.x > 1);
  await page.keyboard.press('Escape');
  assert.equal((await state()).mode, 'paused');
  const frozen = await state(); await advance(2000);
  const still = await state();
  assert.equal(still.time, frozen.time);
  assert.deepEqual(still.player, frozen.player);
  await screenshot('paused');
  await page.keyboard.press('Escape');
  assert.equal((await state()).mode, 'playing');
  record('Escape pause freezes simulation and resumes without resetting position');

  // Replay no-input failure after a UI retry, then recover through its actual button.
  await page.keyboard.press('Escape'); await page.locator('#retry').click();
  await advance(12000);
  s = await state(); assert.equal(s.mode, 'failed'); assert.equal(s.player.hp, 0);
  await page.locator('#retry').waitFor({ state: 'visible' });
  assert.match(await page.locator('#overlay .log').innerText(), /עדיין אין פגיעות/);
  await screenshot('failed');
  await page.locator('#retry').click();
  s = await state(); assert.equal(s.mode, 'playing'); assert.equal(s.player.hp, 100);
  assert.deepEqual(s.ammo, { bolt: 2, pulse: 1 });
  record('no-input failure and visible retry restore HP/ammunition', { failureTime: s.time });

  await page.locator('#settings').click();
  assert.equal((await state()).mode, 'paused');
  await page.locator('#volume').focus(); await page.keyboard.press('Home');
  await page.locator('#reduced').check();
  await page.locator('[data-binding="bolt"]').click(); await page.keyboard.press('k');
  await page.locator('#close-options').click();
  await page.locator('#resume').click();
  s = await state();
  assert.equal(s.settings.volume, 0); assert.equal(s.settings.reduced, true);
  assert.equal(s.settings.bindings.bolt, 'KeyK');
  const mappedEnemy = s.screen.enemies[0];
  await page.mouse.move(mappedEnemy.x, mappedEnemy.y);
  await page.keyboard.down('k'); await advance(20); await page.keyboard.up('k');
  s = await state(); assert.equal(s.receipts.at(-1).after, '0');
  record('mute, reduced effects, and remapped keyboard Bolt work through actual settings controls');

  // Right click uses a real browser event. A listener observes preventDefault.
  await page.keyboard.press('Escape'); await page.locator('#retry').click();
  s = await state(); const pulseEnemy = s.screen.enemies[0];
  await page.evaluate(() => { window.__qaContextPrevented = false; document.querySelector('#arena').addEventListener('contextmenu', e => { window.__qaContextPrevented = e.defaultPrevented; }); });
  await page.mouse.click(pulseEnemy.x, pulseEnemy.y, { button: 'right' }); await advance(20);
  s = await state();
  assert.equal(s.receipts.at(-1).kind, 'pulse'); assert.equal(s.receipts.at(-1).after, '27/2');
  assert.equal(await page.evaluate(() => window.__qaContextPrevented), true);
  record('right-click Pulse updates exact HP and suppresses browser context menu');

  const beforeResize = await state();
  await page.setViewportSize({ width: 390, height: 844 }); await advance(0);
  const resized = await state();
  assert.equal(resized.encounter, beforeResize.encounter);
  assert.equal(resized.time, beforeResize.time);
  assert.equal(resized.enemies[0].hpExact, beforeResize.enemies[0].hpExact);
  assert.deepEqual(resized.player, beforeResize.player);
  await screenshot('mobile-resize');
  const receiptBox = await page.locator('#receipt').boundingBox();
  assert.ok(receiptBox.height < 180, 'portrait receipt must not stretch over the arena');
  await page.setViewportSize({ width: 1280, height: 720 }); await advance(0);
  // Viewport edge aiming should leave finite floor coordinates, with no reset.
  await page.mouse.move(1, 1); await advance(0);
  const edge = await state(); assert.ok(Number.isFinite(edge.aim.x) && Number.isFinite(edge.aim.z));
  assert.equal(edge.time, beforeResize.time);
  record('portrait resize preserves gameplay and viewport-edge aiming remains finite');

  const beforeFullscreen = await state();
  await page.keyboard.press('f');
  await page.waitForFunction(() => Boolean(document.fullscreenElement)); await advance(0);
  assert.equal((await state()).time, beforeFullscreen.time);
  await page.keyboard.press('f');
  await page.waitForFunction(() => !document.fullscreenElement); await advance(0);
  assert.deepEqual((await state()).player, beforeFullscreen.player);
  record('F fullscreen enters and exits while preserving gameplay state');

  // Headless Chrome may keep all pages focused. Prefer an actual tab switch;
  // if it emits no blur, explicitly test the handler and record that limitation.
  await page.keyboard.down('ArrowRight'); await advance(100);
  const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
  await page.bringToFront();
  s = await state();
  const realFocusLossObserved = s.mode === 'paused';
  if (!realFocusLossObserved) await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  s = await state(); assert.equal(s.mode, 'paused');
  const pausedPosition = { x: s.player.x, z: s.player.z };
  await page.locator('#resume').click(); await advance(200);
  const afterFocus = await state();
  assert.equal(afterFocus.player.x, pausedPosition.x); assert.equal(afterFocus.player.z, pausedPosition.z);
  await page.keyboard.up('ArrowRight');
  record('blur pauses and clears held input before resume', { method: realFocusLossObserved ? 'actual tab change' : 'explicit blur event; headless tab focus was not observable' });
  await other.close();

  // A touch aim gesture must not spend a Bolt before the player chooses Pulse.
  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touchPage = await touchContext.newPage();
  touchPage.setDefaultTimeout(60000);
  touchPage.on('pageerror', e => errors.push(String(e)));
  touchPage.on('console', m => { if (m.type() === 'error') errors.push({text:m.text(),location:m.location()}); });
  await touchPage.goto('http://localhost:4182', { waitUntil: 'networkidle' });
  await touchPage.locator('#start-btn').tap();
  await touchPage.evaluate(() => window.advanceTime(0));
  let touchState = await touchPage.evaluate(() => JSON.parse(window.render_game_to_text()));
  const touchEnemy = touchState.screen.enemies[0];
  await touchPage.touchscreen.tap(touchEnemy.x, touchEnemy.y);
  touchState = await touchPage.evaluate(() => JSON.parse(window.render_game_to_text()));
  assert.deepEqual(touchState.ammo, { bolt: 2, pulse: 1 });
  assert.equal(touchState.receipts.length, 0);
  await touchPage.locator('#touch-pulse').tap();
  await touchPage.evaluate(() => window.advanceTime(20));
  touchState = await touchPage.evaluate(() => JSON.parse(window.render_game_to_text()));
  assert.equal(touchState.receipts.at(-1).kind, 'pulse');
  assert.equal(touchState.receipts.at(-1).after, '27/2');
  assert.deepEqual(touchState.ammo, { bolt: 2, pulse: 0 });
  const stick = await touchPage.locator('#stick').boundingBox();
  const client = await touchContext.newCDPSession(touchPage);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: stick.x + 55, y: stick.y + 55, id: 1 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: stick.x + 83, y: stick.y + 30, id: 1 }] });
  await touchPage.evaluate(() => window.advanceTime(400));
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const touchMoved = await touchPage.evaluate(() => JSON.parse(window.render_game_to_text()));
  assert.ok(Math.hypot(touchMoved.player.x - touchState.player.x, touchMoved.player.z - touchState.player.z) > 1);
  await touchPage.locator('#touch-dash').tap();
  const touchDashed = await touchPage.evaluate(() => JSON.parse(window.render_game_to_text()));
  assert.equal(touchDashed.dashes, 1);
  await touchPage.screenshot({ path: new URL('touch-controls.png', out).pathname });
  record('touch aim preserves ammunition; explicit Pulse, touch joystick, and dash operate');
  await touchContext.close();

  assert.deepEqual(errors, []); assert.deepEqual(badResponses, []); assert.deepEqual(external, []);
  record('no page/console errors, failed resources, or external runtime requests');
  const report = { browser: 'Google Chrome channel, headless', viewport: '1280×720 and 390×844', results, errors, badResponses, external, finalState: await state() };
  await fs.writeFile(new URL('report.json', out), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: results.length, results }, null, 2));
} catch (error) {
  await screenshot('failure-diagnostic').catch(() => {});
  const report = { results, error: String(error), errors, badResponses, external, state: await state().catch(() => null) };
  await fs.writeFile(new URL('report.json', out), JSON.stringify(report, null, 2));
  throw error;
} finally { await browser.close(); }
