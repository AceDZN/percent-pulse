import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, ENCOUNTERS } from '../src/game.ts';
import { Rational, type AttackKind } from '../src/math.ts';

const wait = (g: Game, seconds: number) => {
  for (let remaining = seconds; remaining > 1e-9; remaining -= 1 / 60) g.tick(Math.min(1 / 60, remaining));
};
const fixture = (encounter = 0) => {
  const g = new Game();
  g.start();
  if (encounter) { g.encounter = encounter; g.setup(); }
  return g;
};
const aim = (g: Game, enemyIndex: number) => {
  const target = g.enemies[enemyIndex];
  g.aim = { x: target.x, z: target.z };
  return target;
};
const hit = (g: Game, enemyIndex: number, kind: AttackKind) => {
  if (g.cooldown > 0) wait(g, g.cooldown + 1 / 60);
  const target = aim(g, enemyIndex);
  assert.equal(g.target()?.id, target.id, 'fixture ray is not occluded by another target');
  assert.equal(g.fire(kind), true, 'confirmed hit through public input rule');
};

test('a miss costs cooldown but no finite ammunition or armed boost', () => {
  const g = fixture(3);
  g.toggleBoost();
  g.aim = { x: g.player.x, z: g.player.z };
  assert.equal(g.fire('pulse'), false);
  assert.deepEqual(g.ammo, { bolt: 4, pulse: 2 });
  assert.deepEqual(g.boost, { available: true, armed: true });
  assert.ok(g.cooldown > 0);
  assert.equal(g.receipts.length, 0);
  assert.equal(g.events.at(-1)?.event, 'miss');
});

test('the boost expires on its next valid confirmed hit only', () => {
  const g = fixture(3);
  g.toggleBoost();
  hit(g, 1, 'bolt');
  assert.equal(g.enemies[1].hp.toString(), '0');
  assert.equal(g.receipts.at(-1)?.raw, '27');
  assert.equal(g.receipts.at(-1)?.boosted, true);
  assert.deepEqual(g.boost, { available: false, armed: false });
  hit(g, 0, 'pulse');
  assert.equal(g.enemies[0].hp.toString(), '72');
  assert.equal(g.receipts.at(-1)?.boosted, false);
});

test('a dead-target ray never consumes another confirmed-hit charge', () => {
  const g = fixture();
  const dead = aim(g, 0);
  assert.equal(g.fire('bolt'), true);
  assert.equal(dead.hp.toString(), '0');
  wait(g, .6);
  g.aim = { x: dead.x, z: dead.z };
  assert.equal(g.fire('bolt'), false);
  assert.deepEqual(g.ammo, { bolt: 1, pulse: 1 });
  assert.equal(g.receipts.length, 1);
  assert.equal(g.kills, 1);
});

test('same-frame fire commands respect cooldown and cannot duplicate a stale hit', () => {
  const g = fixture(1);
  aim(g, 0);
  assert.equal(g.fire('pulse'), true);
  assert.equal(g.fire('pulse'), false);
  assert.equal(g.enemies[0].hp.toString(), '72');
  assert.equal(g.ammo.pulse, 1);
  assert.equal(g.receipts.length, 1);
  wait(g, .9);
  aim(g, 0);
  assert.equal(g.fire('pulse'), true);
  assert.equal(g.enemies[0].hp.toString(), '54');
  assert.equal(g.receipts[1].before, '72');
});

test('pause freezes relevant simulation, clears movement, and resumes without a reset', () => {
  const g = fixture(1);
  g.move(1, 1);
  g.dash();
  wait(g, .1);
  g.pause();
  assert.equal(g.mode, 'paused');
  assert.deepEqual(g.moveInput, { x: 0, z: 0 });
  const frozen = JSON.stringify(g.text());
  wait(g, 10);
  assert.equal(JSON.stringify(g.text()), frozen);
  assert.equal(g.fire('bolt'), false);
  const time = g.time, x = g.player.x;
  g.pause();
  wait(g, .1);
  assert.ok(g.time > time);
  // Dash can still finish its previously committed movement after resuming.
  assert.ok(Number.isFinite(g.player.x));
  assert.ok(g.player.x >= x);
  assert.equal(g.encounter, 1);
});

test('no-input play can fail and retry restores the encounter with a truthful retry event', () => {
  const g = fixture(1);
  for (let i = 0; i < 60 * 40 && g.mode === 'playing'; i++) g.tick(1 / 60);
  assert.equal(g.mode, 'failed');
  assert.equal(g.player.hp, 0);
  assert.ok(g.reason.length > 0);
  assert.ok(g.events.some(event => event.event === 'hurt'));
  const oldTime = g.time;
  g.retry();
  assert.equal(g.mode, 'playing');
  assert.equal(g.encounter, 1);
  assert.equal(g.retries, 1);
  assert.equal(g.elapsed, 0);
  assert.equal(g.time, oldTime);
  assert.equal(g.player.hp, 100);
  assert.deepEqual(g.ammo, { bolt: 4, pulse: 2 });
  assert.deepEqual(g.enemies.map(e => e.hp.toString()), ['96', '18']);
  assert.ok(g.events.some(event => event.event === 'retry'));
  assert.equal(g.reason, '');
});

test('all five handoff allocations replay through real confirmed-hit state rules', () => {
  const allocations: AttackKind[][][] = [
    [['bolt']],
    [['pulse', 'pulse', 'bolt', 'bolt', 'bolt'], ['bolt']],
    [['pulse', 'pulse', 'bolt', 'bolt', 'bolt'], ['bolt', 'bolt', 'bolt']],
    [['pulse', 'pulse', 'bolt', 'bolt', 'bolt'], ['bolt']],
    [['pulse', 'pulse', 'bolt', 'bolt', 'bolt', 'bolt'], ['bolt', 'bolt']],
  ];
  for (let encounter = 0; encounter < ENCOUNTERS.length; encounter++) {
    const g = fixture(encounter);
    // Eliminate pursuing secondary threats first; target order is a combat choice.
    const targets = g.enemies.length === 2 ? [1, 0] : [0];
    for (const target of targets) {
      if (encounter === 3 && target === 1) g.toggleBoost();
      for (const kind of allocations[encounter][target]) hit(g, target, kind);
    }
    assert.ok(g.enemies.every(e => e.hp.compare(new Rational(0)) === 0), `encounter ${encounter + 1} cleared HP`);
    assert.ok(g.ammo.bolt >= 0 && g.ammo.pulse >= 0);
    assert.equal(g.mode, 'playing', 'survival cycle still has meaningful time remaining');
    assert.equal(g.kills, g.enemies.length);
    assert.equal(g.receipts.filter(r => r.boosted).length, encounter === 3 ? 1 : 0);
  }
});

test('a wrong mixed order leaves exact positive HP and retry recovers resources', () => {
  const g = fixture(1);
  hit(g, 1, 'bolt');
  for (const kind of ['bolt', 'pulse', 'pulse', 'bolt', 'bolt'] as const) hit(g, 0, kind);
  assert.equal(g.enemies[0].hp.toString(), '63/8');
  assert.equal(g.mode, 'failed');
  assert.deepEqual(g.ammo, { bolt: 0, pulse: 0 });
  assert.equal(g.receipts.at(-1)?.after, '63/8');
  g.retry();
  assert.deepEqual(g.ammo, { bolt: 4, pulse: 2 });
  assert.equal(g.enemies[0].hp.toString(), '96');
});

test('transfer starts with changed values, preview off, and no automatic hint use', () => {
  const g = fixture(4);
  assert.deepEqual(g.enemies.map(e => e.hp.toString()), ['120', '36']);
  assert.deepEqual(g.ammo, { bolt: 6, pulse: 2 });
  assert.equal(g.preview, false);
  assert.equal(g.hintUses, 0);
  assert.equal(g.events.filter(e => e.event === 'help').length, 0);
  g.help();
  assert.equal(g.hintUses, 1);
  assert.equal(g.events.at(-1)?.event, 'help');
});

test('movement normalizes diagonals, respects arena bounds, and dash grants a finite cooldown', () => {
  const cardinal = fixture(), diagonal = fixture();
  cardinal.move(1, 0); diagonal.move(1, 1);
  wait(cardinal, .5); wait(diagonal, .5);
  const straightDistance = Math.hypot(cardinal.player.x, cardinal.player.z - 7);
  const diagonalDistance = Math.hypot(diagonal.player.x, diagonal.player.z - 7);
  assert.ok(Math.abs(straightDistance - diagonalDistance) < 1e-9);
  diagonal.dash();
  assert.equal(diagonal.dashCount, 1);
  assert.ok(diagonal.player.invulnerable > 0);
  diagonal.dash();
  assert.equal(diagonal.dashCount, 1);
  wait(diagonal, 4);
  assert.ok(Math.abs(diagonal.player.x) <= 16.1 && Math.abs(diagonal.player.z) <= 11.1);
});

test('spending all finishers explains an unwinnable percentage-only remainder immediately', () => {
  const g = fixture(1);
  // All Bolts into the 96-HP anchor leave 24 HP. Both percentage charges remain,
  // but neither a finite normal nor boosted sub-100% attack can reach zero.
  for (let i = 0; i < 4; i++) hit(g, 0, 'bolt');
  assert.equal(g.enemies[0].hp.toString(), '24');
  assert.deepEqual(g.ammo, { bolt: 0, pulse: 2 });
  assert.equal(g.mode, 'failed');
  assert.match(g.reason, /אחוז/);
  assert.match(g.reason, /אפס/);
  g.retry();
  assert.deepEqual(g.ammo, { bolt: 4, pulse: 2 });
  assert.equal(g.mode, 'playing');
});

test('retry scopes visible receipts to the current attempt while preserving historical events', () => {
  const g = fixture();
  hit(g, 0, 'bolt');
  assert.equal(g.text().receipts.length, 1);
  g.pause(); g.retry();
  assert.equal(g.text().receipts.length, 0, 'previous attempt is not presented as current damage');
  assert.ok(g.events.some(e => e.event === 'hit'), 'history remains available to the local trace');
  hit(g, 0, 'pulse');
  assert.equal(g.text().receipts.length, 1);
  assert.equal(g.text().receipts[0].kind, 'pulse');
  assert.equal(g.text().receipts[0].before, '18');
});

test('the arena constraint is an ellipse rather than a larger invisible rectangle', () => {
  const g = fixture();
  g.move(1, 1);
  for (let i = 0; i < 180; i++) {
    g.tick(1 / 60);
    assert.ok((g.player.x / 16.1) ** 2 + (g.player.z / 11.1) ** 2 <= 1 + 1e-12);
  }
  const measure = (g.player.x / 16.1) ** 2 + (g.player.z / 11.1) ** 2;
  assert.ok(measure > .999, 'movement reaches the visible ellipse boundary');
});

test('arc threats respect forward angle, radial band, and angle wraparound', () => {
  const sample = (x: number, z: number, heading = 0) => {
    const g = fixture();
    // Isolate the geometric hazard subsystem from unrelated enemies and spawns.
    g.enemies = []; g.nextHazard = Infinity;
    g.player.x = x; g.player.z = z; g.player.invulnerable = 0;
    g.hazards = [{ id: 0, x: 0, z: 0, radius: 5, angle: heading, width: 2.4, kind: 'arc', charge: 0, age: 1.65, duration: 1.65, hit: false }];
    g.tick(1 / 60);
    return g.player.hp;
  };
  assert.equal(sample(0, 5), 80, 'front of arc is dangerous');
  assert.equal(sample(0, -5), 100, 'rear is outside the sector');
  assert.equal(sample(0, 0), 100, 'center is outside its radial band');
  assert.equal(sample(5, 0), 100, 'side is beyond the 0.85 PI angular span');
  assert.equal(sample(0, 6.5), 80, 'player radius overlaps the outer edge');
  assert.equal(sample(0, 6.8), 100, 'outside the radial edge plus player margin');
  const justInside = Math.PI * .425 - .01, justOutside = Math.PI * .425 + .01;
  assert.equal(sample(5 * Math.sin(justInside), 5 * Math.cos(justInside)), 80);
  assert.equal(sample(5 * Math.sin(justOutside), 5 * Math.cos(justOutside)), 100);
  const wrapped = -Math.PI + .02;
  assert.equal(sample(5 * Math.sin(wrapped), 5 * Math.cos(wrapped), Math.PI - .02), 80, 'heading wraps across minus/plus PI');
});
