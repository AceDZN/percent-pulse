import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, WAVES, type Enemy } from '../src/game.ts';
import { Rational } from '../src/math.ts';

const wait = (g: Game, seconds: number) => {
  for (let left = seconds; left > 1e-9; left -= 1 / 60) g.tick(Math.min(1 / 60, left));
};
const fixture = (wave = 2) => {
  const g = new Game(); g.start(false); g.wave = wave; g.setup();
  // Isolate the state subsystem under test; never used as browser victory evidence.
  g.pending = []; g.enemies = []; g.hazards = []; g.player.x = 0; g.player.z = 0;
  g.player.invulnerable = 0; g.shotCooldown = 999;
  return g;
};
const enemy = (g: Game, hp: number, x = 1, z = 0, family: 'anchor'|'skitter' = 'anchor') =>
  g.spawn({ hp, x, z, family, at: 0 });
const hp = (e: Enemy, exact: string) => assert.equal(e.hp.toString(), exact);

test('guided opening is safe until the first movement, then ordinary fire needs no aim or fire input', () => {
  const g = new Game(); g.start();
  wait(g, 20);
  assert.equal(g.phase, 'move'); assert.equal(g.waveTime, 0);
  assert.equal(g.enemies.length, 0); assert.equal(g.hazards.length, 0); assert.equal(g.player.hp, 100);
  assert.equal(g.pulse(), false); assert.equal(g.charges, 0, 'Pulse is not introduced in the move-only opening');
  g.move(1, 0); wait(g, .1); g.move(0, 0);
  assert.equal(g.phase, 'combat');
  g.aim = { x: 999, z: 999 }; // Ordinary targeting does not depend on pointer aim.
  wait(g, 7);
  assert.equal(g.mode, 'clear'); assert.equal(g.wave, 0);
  assert.equal(g.waveKills, 3); assert.equal(g.charges, 0); assert.equal(g.player.hp, 100);
  assert.ok(g.events.some(e => e.event === 'hit' && (e.data as {kind:string}).kind === 'bolt'));
});

test('unguided start enters combat without a movement or Pulse tutorial gate', () => {
  const g = new Game(); g.start(false);
  assert.equal(g.phase, 'combat'); assert.equal(g.pulseIntroduced, true);
  wait(g, 1);
  assert.ok(g.receipts.length > 0);
});

test('safe Pulse introduction preserves96HP and gives readable96 to72 before ordinary fire resumes', () => {
  const g = new Game(); g.start(true); g.wave = 1; g.setup();
  assert.equal(g.phase, 'pulse-intro');
  const anchor = g.enemies.find(e => e.family === 'anchor')!; assert.ok(g.pulseTargets().includes(anchor));
  assert.equal(g.enemies.length, 4); assert.equal(g.pulseTargets().length, 4);
  wait(g, 20);
  hp(anchor, '96'); assert.equal(g.player.hp, 100); assert.equal(g.receipts.length, 0); assert.equal(g.hazards.length, 0);
  assert.equal(g.pulse(), true); hp(anchor, '72'); assert.equal(g.phase, 'combat');
  assert.equal(g.pulseIntroduced, true); assert.equal(g.charges, 1);
  assert.equal(g.receipts.length, 4);
  assert.deepEqual(g.receipts.find(r => r.target === anchor.id), { time: 20, target: anchor.id, kind: 'pulse', before: '96', raw: '24', applied: '24', after: '72', boosted: false });
  assert.ok(g.enemies.filter(e => e.family === 'skitter').every(e => e.hp.toString() === '18'));
  assert.ok(g.receipts.filter(r => r.target !== anchor.id).every(r => r.before === '24' && r.raw === '6' && r.after === '18'));
  wait(g, .7); hp(anchor, '72');
  wait(g, .1); hp(anchor, '54');
});

test('ordinary18HP fire is unlimited and can finish a durable enemy without Pulse', () => {
  const g = fixture(); const e = enemy(g, 540, 3); g.shotCooldown = 0; g.player.invulnerable = 999;
  wait(g, 20);
  hp(e, '0'); assert.equal(g.mode, 'clear'); assert.equal(g.charges, 2);
  assert.equal(g.receipts.length, 30); assert.ok(g.receipts.every(r => r.kind === 'bolt' && r.raw === '18'));
  assert.equal(g.text().autoFire.unlimited, true);
});

test('auto-target lock stays stable until target dies or leaves its visible range', () => {
  const g = fixture(); const a = enemy(g, 96, 2), b = enemy(g, 96, 3);
  assert.equal(g.target()?.id, a.id);
  b.x = .5; assert.equal(g.target()?.id, a.id, 'closer newcomer does not jitter an existing lock');
  a.hp = new Rational(0); assert.equal(g.target()?.id, b.id);
  a.hp = new Rational(96); a.x = 1; b.x = 19;
  assert.equal(g.target()?.id, a.id, 'out-of-range lock is released');
  a.x = 19; assert.equal(g.target(), undefined);
});

test('ordinary fire reaches an enemy across the whole visible compact arena', () => {
  const g = fixture(); g.player.x = 8.3; g.player.z = 0;
  const e = enemy(g, 18, -8.2); g.shotCooldown = 0;
  g.tick(1 / 60); hp(e, '0');
  assert.equal(g.receipts.at(-1)?.kind, 'bolt'); assert.equal(g.mode, 'clear');
});

test('Pulse applies25% of each currentHP within the center radius, charging once for the whole area', () => {
  const g = fixture(); const a = enemy(g, 96, 1), b = enemy(g, 120, -2);
  const edge = enemy(g, 18, 5.4), outside = enemy(g, 144, 5.4001), dead = enemy(g, 0, .2);
  assert.equal(g.pulse(), true);
  hp(a, '72'); hp(b, '90'); hp(edge, '27/2'); hp(outside, '144'); hp(dead, '0');
  assert.equal(g.charges, 1); assert.equal(g.pulses, 1); assert.equal(g.receipts.length, 3);
  assert.deepEqual(g.receipts.map(r => r.raw), ['24','30','9/2']);
  assert.ok(g.receipts.every(r => r.kind === 'pulse' && !r.boosted));
  assert.ok(a.x > 1); assert.equal(a.stun, .8); assert.equal(a.phase, 'stunned');
});

test('two Pulse charges use updated HP exactly and ordinary fire still finishes after both are spent', () => {
  const g = fixture(); const e = enemy(g, 96, 1);
  assert.equal(g.pulse(), true); hp(e, '72');
  assert.equal(g.pulse(), false, 'holding/repeating during cooldown does not spend another charge');
  assert.equal(g.charges, 1);
  wait(g, .91); assert.equal(g.pulse(), true); hp(e, '54'); assert.equal(g.charges, 0);
  wait(g, .91); assert.equal(g.pulse(), false); hp(e, '54');
  g.shotCooldown = 0; g.player.invulnerable = 999; wait(g, 3);
  hp(e, '0'); assert.equal(g.mode, 'clear');
});

test('empty, dead, and out-of-radius Pulse attempts preserve charge and show no confirmed hit', () => {
  const g = fixture();
  assert.equal(g.pulse(), false); assert.equal(g.charges, 2); assert.equal(g.pulseCooldown, 0);
  enemy(g, 0, 1); enemy(g, 96, 5.5);
  assert.equal(g.pulse(), false); assert.equal(g.charges, 2); assert.equal(g.receipts.length, 0);
  assert.equal(g.pulses, 0); assert.equal(g.events.at(-1)?.event, 'pulse-empty');
});

test('auto-Bolt changes the named percentage base before a later Pulse', () => {
  const g = fixture(); const e = enemy(g, 96, 1); g.shotCooldown = 0;
  g.tick(1 / 60); hp(e, '78');
  assert.deepEqual(g.text().pulse.preview.map(p => [p.before,p.raw]), [['78','39/2']]);
  assert.equal(g.pulse(), true); hp(e, '117/2');
  const r = g.receipts.at(-1)!;
  assert.deepEqual([r.before,r.raw,r.applied,r.after], ['78','39/2','39/2','117/2']);
  assert.notEqual(r.raw, '24', 'spawn/max HP is not the new base');
});

test('Pulse interrupts only affected enemies and cancels their pending source warnings', () => {
  const g = fixture(); const inside = enemy(g, 144, 1), outside = enemy(g, 144, 7);
  g.beginAttack(inside); g.beginAttack(outside);
  assert.equal(g.hazards.length, 2);
  assert.equal(g.pulse(), true);
  assert.equal(inside.windup, 0); assert.equal(inside.rush, 0); assert.equal(inside.stun, .8);
  assert.ok(g.hazards.every(h => h.source === outside.id)); assert.equal(g.hazards.length, 1);
  assert.ok(outside.windup > 0); hp(outside, '144');
});

test('an emptied stage accelerates pending arrivals instead of clearing early or waiting its old timestamp', () => {
  const g = fixture(); g.pending = [
    { hp: 18, x: 1, z: 0, family: 'skitter', at: 0 },
    { hp: 18, x: -1, z: 0, family: 'skitter', at: 50 },
  ]; g.shotCooldown = 0; g.player.invulnerable = 999;
  g.tick(1 / 60);
  assert.equal(g.mode, 'playing'); assert.equal(g.waveKills, 1); assert.equal(g.pending.length, 1);
  assert.ok(g.pending[0].at <= g.waveTime + .600001);
  wait(g, .65);
  assert.equal(g.mode, 'clear'); assert.equal(g.waveKills, 2); assert.ok(g.waveTime < 1);
});

test('the true last kill clears immediately, removes dangers, heals20, and waits safely for Next', () => {
  const g = fixture(); const e = enemy(g, 18, 1); g.shotCooldown = 0; g.player.hp = 40;
  g.beginAttack(e); g.hazards[0].age = 1.399;
  g.tick(1 / 60);
  assert.equal(g.mode, 'clear'); assert.ok(g.waveTime < .02); assert.equal(g.player.hp, 60);
  assert.equal(g.hazards.length, 0); assert.equal(g.targetId, null);
  const frozen = JSON.stringify(g.text()); wait(g, 30); assert.equal(JSON.stringify(g.text()), frozen);
  g.next(); assert.equal(g.wave, 3); assert.equal(g.mode, 'playing'); assert.equal(g.charges, 2); assert.equal(g.player.hp, 60);
});

test('the final wave transitions directly to won on its final kill', () => {
  const g = fixture(WAVES.length - 1); enemy(g, 18, 1); g.shotCooldown = 0;
  g.tick(1 / 60); assert.equal(g.mode, 'won'); assert.equal(g.hazards.length, 0);
  assert.ok(g.events.some(e => e.event === 'won')); g.next(); assert.equal(g.wave, WAVES.length - 1);
});

test('contact alone causes no damage; a discrete source warning precedes each hurt and invulnerability suppresses overlap', () => {
  const g = fixture(); const e = enemy(g, 144, 0); e.attackCooldown = 999;
  wait(g, 3); assert.equal(g.player.hp, 100); assert.equal(g.hazards.length, 0);
  g.beginAttack(e); assert.equal(g.hazards[0].duration, 1.4);
  wait(g, 1.3); assert.equal(g.player.hp, 100);
  wait(g, .12); assert.equal(g.player.hp, 80); assert.equal(g.hurtCount, 1); assert.ok(g.player.invulnerable > 1.4);
  g.beginAttack(e); wait(g, 1.41); assert.equal(g.player.hp, 80, 'second overlapping impact is protected');
  wait(g, .3); g.beginAttack(e); wait(g, 1.42); assert.equal(g.player.hp, 60);
  assert.ok(g.events.filter(v => v.event === 'warning').length >= 3);
});

test('first-wave grace ignores early damage while normal combat later remains consequential', () => {
  const g = fixture(0); enemy(g, 144, 1); g.hurt('lane'); assert.equal(g.player.hp, 100);
  g.waveTime = 8; g.hurt('lane'); assert.equal(g.player.hp, 80);
});

test('pause freezes the new flow, clears keyboard/destination movement, and preserves charge', () => {
  const g = fixture(); enemy(g, 144, 1); g.setDestination(2, 1); wait(g, .1);
  g.pause(); assert.equal(g.mode, 'paused'); assert.deepEqual(g.moveInput, { x: 0, z: 0 }); assert.equal(g.destination, null);
  const before = JSON.stringify(g.text()); wait(g, 10); assert.equal(JSON.stringify(g.text()), before);
  assert.equal(g.pulse(), false); assert.equal(g.charges, 2);
  g.pause(); const time = g.time; wait(g, .1); assert.ok(g.time > time); assert.equal(g.mode, 'playing');
});

test('retry restarts only the current wave with full health/two charges and a new attempt receipt boundary', () => {
  const g = fixture(4); enemy(g, 144, 1); g.pulse();
  g.player.hp = 20; g.player.invulnerable = 0; g.hurt('burst'); assert.equal(g.mode, 'failed');
  g.retry();
  assert.equal(g.mode, 'playing'); assert.equal(g.wave, 4); assert.equal(g.retries, 1);
  assert.equal(g.player.hp, 100); assert.equal(g.charges, 2); assert.equal(g.waveTime, 0);
  assert.equal(g.pending.length, WAVES[4].spawns.length); assert.equal(g.text().receipts.length, 0);
  assert.ok(g.events.some(e => e.event === 'hit')); assert.ok(g.events.some(e => e.event === 'retry'));
});

test('historical traces snapshot nested state instead of retaining mutable resource references', () => {
  const g = fixture(); enemy(g, 96, 1);
  g.log('snapshot', { player: g.player, charge: g.charges }); const snapshot = g.events.at(-1)!;
  g.pulse(); g.hurt('burst');
  assert.deepEqual((snapshot.data as {player:typeof g.player}).player.hp, 100);
  assert.equal((snapshot.data as {charge:number}).charge, 2);
  assert.equal(g.charges, 1); assert.equal(g.player.hp, 80);
});

test('keyboard and click destination share bounded movement, with keyboard overriding a destination', () => {
  const g = fixture(); enemy(g, 540, 1); g.player.invulnerable = 999;
  g.setDestination(100, 100); assert.ok(g.destination);
  assert.ok(Math.hypot(g.destination!.x / 8.4, g.destination!.z / 6.25) <= 1.00000001);
  wait(g, .5); assert.ok(g.player.x > 0 && g.player.z > 0);
  g.move(-1, 0); assert.equal(g.destination, null); wait(g, .2);
  g.move(1, 1);
  for (let i = 0; i < 180; i++) { g.tick(1 / 60); assert.ok(Math.hypot(g.player.x / 8.4, g.player.z / 6.25) <= 1.00000001); }
  const old = g.destination; g.setDestination(NaN, Infinity); assert.equal(g.destination, old);
});

test('eight finite formations have staged positive HP, changed placements, and no ammo/duration gates', () => {
  assert.equal(WAVES.length, 8);
  assert.equal(new Set(WAVES.map(w => JSON.stringify(w.spawns))).size, 8);
  for (const w of WAVES) {
    assert.ok(!('duration' in w) && !('ammo' in w));
    assert.ok(w.spawns.length > 0);
    for (const [i,s] of w.spawns.entries()) {
      assert.ok(Number.isInteger(s.hp) && s.hp > 0); assert.ok(s.at >= 0);
      assert.ok(Math.hypot(s.x / 8.4, s.z / 6.25) <= 1.00000001);
      if (i) assert.ok(s.at >= w.spawns[i - 1].at);
    }
  }
  assert.ok(WAVES.at(-1)!.spawns.some(s => s.boss && s.hp === 720));
});
