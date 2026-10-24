import test from 'node:test';
import assert from 'node:assert/strict';
import { BOLT, Rational, resolveStrike, type AttackKind } from '../src/math.ts';

const q = (n: bigint | number, d: bigint | number = 1) => new Rational(n, d);
const exact = (actual: Rational, n: bigint | number, d: bigint | number = 1) => {
  const expected = q(n, d);
  assert.equal(actual.n, expected.n, 'exact numerator');
  assert.equal(actual.d, expected.d, 'exact denominator');
};
const strike = (hp: Rational, kind: AttackKind, boosted = false) => resolveStrike(hp, kind, boosted);
const sequence = (initial: number, attacks: AttackKind[]) => {
  const receipts = [];
  let hp = q(initial);
  for (const kind of attacks) {
    assert.ok(hp.compare(q(0)) > 0, 'witness never spends a confirmed hit on a dead target');
    const receipt = strike(hp, kind);
    receipts.push(receipt);
    hp = receipt.after;
  }
  return { hp, receipts };
};

test('rational normalization keeps exact state with positive denominators', () => {
  exact(q(96, 4), 24);
  exact(q(-6, -8), 3, 4);
  exact(q(0, -8), 0);
  assert.throws(() => q(1, 0), /denominator/i);
  exact(q(1, 3).add(q(1, 6)), 1, 2);
  exact(q(1, 3).sub(q(1, 6)), 1, 6);
  exact(q(2, 3).mul(q(9, 4)), 3, 2);
  assert.equal(q(5, 7).compare(q(10, 14)), 0);
  assert.equal(q(5, 7).compare(q(3, 4)), -1);
  assert.equal(q(3, 4).compare(q(5, 7)), 1);
});

test('Pulse captures updated current HP: 96 to 72 to 54', () => {
  const first = strike(q(96), 'pulse');
  exact(first.before, 96);
  exact(first.base, 96);
  exact(first.raw, 24);
  exact(first.applied, 24);
  exact(first.after, 72);
  const second = strike(first.after, 'pulse');
  exact(second.before, 72);
  exact(second.base, 72);
  exact(second.raw, 18);
  exact(second.after, 54);
});

test('72 HP is only the unboosted immediate-damage crossover', () => {
  exact(BOLT, 18);
  assert.equal(strike(q(72), 'pulse').raw.compare(strike(q(72), 'bolt').raw), 0);
  assert.equal(strike(q(73), 'pulse').raw.compare(BOLT), 1);
  assert.equal(strike(q(71), 'pulse').raw.compare(BOLT), -1);
  // A boost is a separate modifier; the same immediate crossover holds only
  // when comparing equally boosted attacks, never a universal strategy claim.
  exact(strike(q(72), 'pulse', true).raw, 27);
  exact(strike(q(72), 'bolt', true).raw, 27);
});

test('flat and percentage strikes have the specified mixed-order witness', () => {
  exact(sequence(100, ['pulse', 'bolt']).hp, 57);
  exact(sequence(100, ['bolt', 'pulse']).hp, 123, 2);
  exact(sequence(100, ['bolt', 'pulse']).hp.sub(sequence(100, ['pulse', 'bolt']).hp), 9, 2);
});

test('pure percentage factors commute and opposite percentages do not cancel', () => {
  const down = q(4, 5), up = q(6, 5);
  const downThenUp = q(100).mul(down).mul(up);
  const upThenDown = q(100).mul(up).mul(down);
  exact(downThenUp, 96);
  assert.equal(downThenUp.compare(upThenDown), 0);
  assert.notEqual(downThenUp.compare(q(100)), 0);
  exact(q(96).mul(q(3, 4)).mul(q(3, 4)), 54);
});

test('next-hit boost scales raw attack damage by 3/2', () => {
  const bolt = strike(q(96), 'bolt', true);
  exact(bolt.raw, 27);
  exact(bolt.after, 69);
  assert.equal(bolt.boosted, true);
  const pulse = strike(q(96), 'pulse', true);
  exact(pulse.base, 96);
  exact(pulse.raw, 36);
  exact(pulse.after, 60);
  assert.equal(pulse.raw.compare(q(96).mul(q(3, 8))), 0);
});

test('fractional HP and overkill preserve raw versus applied damage', () => {
  const fractional = strike(q(189, 4), 'pulse');
  exact(fractional.raw, 189, 16);
  exact(fractional.after, 567, 16);
  const finisher = strike(q(1, 4), 'bolt', true);
  exact(finisher.raw, 27);
  exact(finisher.applied, 1, 4);
  exact(finisher.after, 0);
  assert.equal(finisher.boosted, true);
});

test('a dead target returns no damage and does not report boost use', () => {
  for (const kind of ['bolt', 'pulse'] as const) {
    const receipt = strike(q(0), kind, true);
    exact(receipt.before, 0);
    exact(receipt.raw, 0);
    exact(receipt.applied, 0);
    exact(receipt.after, 0);
    assert.equal(receipt.boosted, false);
  }
});

test('finite sub-100% strikes cannot silently kill positive exact HP', () => {
  let hp = q(96);
  for (let i = 0; i < 160; i++) {
    hp = strike(hp, 'pulse').after;
    assert.ok(hp.compare(q(0)) > 0, `positive HP survives Pulse ${i + 1}`);
  }
  exact(hp, 96n * 3n ** 160n, 4n ** 160n);
});

test('serialized same-frame impacts use updated HP rather than a stale snapshot', () => {
  const first = strike(q(96), 'pulse');
  const second = strike(first.after, 'pulse');
  exact(second.after, 54);
  exact(first.applied.add(second.applied), 42);
  assert.notEqual(second.after.compare(q(48)), 0, 'not two stale 24-HP hits');
});

test('all five finite-ammunition encounter witnesses are exact and feasible', () => {
  const witnesses: { id: number; bolt: number; pulse: number; targets: { hp: number; attacks: AttackKind[]; boost?: boolean }[] }[] = [
    { id: 1, bolt: 2, pulse: 1, targets: [{ hp: 18, attacks: ['bolt'] }] },
    { id: 2, bolt: 4, pulse: 2, targets: [{ hp: 96, attacks: ['pulse', 'pulse', 'bolt', 'bolt', 'bolt'] }, { hp: 18, attacks: ['bolt'] }] },
    { id: 3, bolt: 6, pulse: 2, targets: [{ hp: 84, attacks: ['pulse', 'pulse', 'bolt', 'bolt', 'bolt'] }, { hp: 54, attacks: ['bolt', 'bolt', 'bolt'] }] },
    { id: 4, bolt: 4, pulse: 2, targets: [{ hp: 96, attacks: ['pulse', 'pulse', 'bolt', 'bolt', 'bolt'] }, { hp: 27, attacks: ['bolt'], boost: true }] },
    { id: 5, bolt: 6, pulse: 2, targets: [{ hp: 120, attacks: ['pulse', 'pulse', 'bolt', 'bolt', 'bolt', 'bolt'] }, { hp: 36, attacks: ['bolt', 'bolt'] }] },
  ];
  for (const encounter of witnesses) {
    let bolt = encounter.bolt, pulse = encounter.pulse;
    for (const target of encounter.targets) {
      let hp = q(target.hp);
      for (const [index, kind] of target.attacks.entries()) {
        if (kind === 'bolt') assert.ok(bolt-- > 0, `encounter ${encounter.id}: Bolt budget`);
        else assert.ok(pulse-- > 0, `encounter ${encounter.id}: Pulse budget`);
        const receipt = strike(hp, kind, Boolean(target.boost && index === 0));
        assert.ok(receipt.before.compare(q(0)) > 0);
        hp = receipt.after;
      }
      exact(hp, 0);
    }
    assert.ok(bolt >= 0 && pulse >= 0);
  }
});

test('invalid negative HP is rejected rather than producing negative applied damage', () => {
  for (const kind of ['bolt', 'pulse'] as const) {
    assert.throws(() => strike(q(-1), kind, true), /nonnegative|negative/i);
  }
});
