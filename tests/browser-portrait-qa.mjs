import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out = 'artifacts/qa-portrait'; await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:4182/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { polling: 250, timeout: 60000 });
  await page.locator('#start-btn').tap();
  await page.evaluate(() => window.advanceTime(0));
  let s = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  assert.equal(s.mode, 'playing');
  await page.screenshot({ path: `${out}/visible-arena.png` });
  const enemy = s.screen.enemies[0]; await page.touchscreen.tap(enemy.x, enemy.y);
  await page.locator('#touch-pulse').tap(); await page.evaluate(() => window.advanceTime(20));
  s = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  assert.equal(s.receipts.at(-1).after, '27/2');
  const receipt = await page.locator('#receipt').boundingBox(); assert.ok(receipt.height < 180);
  const target = s.screen.enemies[0];
  const targetCovered = target.x >= receipt.x && target.x <= receipt.x + receipt.width && target.y >= receipt.y && target.y <= receipt.y + receipt.height;
  assert.equal(targetCovered, false, 'portrait receipt must not cover the living target');
  await page.screenshot({ path: `${out}/visible-pulse.png` });
  assert.deepEqual(errors, []);
  await fs.writeFile(`${out}/report.json`, JSON.stringify({ browser: await browser.version(), viewport: '390x844', errors, receipt, state: s }, null, 2));
  console.log(JSON.stringify({ mode: s.mode, hpExact: s.enemies[0].hpExact, errors, receipt }));
} finally { await browser.close(); }
