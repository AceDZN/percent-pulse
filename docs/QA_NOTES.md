# Independent math and playability QA

Reviewer role: independent math/playability contributor. The gameplay lead owns integration and all Git actions; this reviewer writes only assigned curriculum/tests/QA evidence files.

## Reviewed before implementation

- Read `AGENTS.md`, `docs/BUILD_HANDOFF.md`, `docs/CREW_COMMON.md`, and `docs/USER_REQUEST.md`.
- Read actual saved Workbook blocks for percent meaning, percent change, and consecutive percent changes. See `CURRICULUM.md` for exact module routes, block evidence, and game mappings.
- Independently verified all five handoff allocations using exact fractions. Encounter 3 leaves `189/4` after two Pulses; encounter 5 leaves `135/2`.
- Pure multiplier commutativity is explicitly present in the saved consecutive-percent-changes module. Mixed flat/percent order dependence is valid because a flat subtraction is an added operation.

## Required implementation checks

- [ ] Exact `96 → 72 → 54`, `72 HP` crossover, mixed-order witness, commuting pure factors.
- [ ] Boost multiplies unboosted raw damage and waits for a confirmed valid hit.
- [ ] Fractions, overkill clamp, no percent-only kill threshold.
- [ ] Invalid/dead target consumes neither ammo nor boost; simultaneous impacts serialize.
- [ ] All encounter witnesses replay through state rules and preserve finite ammunition.
- [ ] Real input combat, miss/retry, failure/recovery, pause/restart.
- [ ] Encounter 5 begins unhinted; optional help use recorded truthfully.
- [ ] Hebrew/LTR receipts, resizing, edge aim, focus release, context-menu suppression.
- [ ] Production build, console/network, actual visible Tripo model.

## Evidence log

Implementation and browser evidence pending. No playability, performance, learning, or completion claim is made at this stage.

### 24 October 2026 — exact model and state checks

`npm test` passed **21/21 tests** after adding `tests/math.test.ts` and `tests/game.test.ts`.

Exact model checks: rational normalization/sign/zero denominator; `96 → 72 → 54`; unboosted `72 HP` crossover; mixed order `57` versus `123/2`; pure factor commutativity and `100 → 96`; boosted raw damage `27`/`36`; fractional overkill; zero-HP no-op; 160 percentage-only hits remaining positive; serialized current-HP effects; all five finite-ammunition witnesses.

State checks use public `Game` actions with targeted aim, fixed ticks, and encounter fixtures. They do not inject victory. They cover misses and dead-target rays preserving ammunition/boost; boost expiration on a confirmed hit; cooldown blocking duplicate same-frame commands; pause freezing state; no-input damage/failure and quick retry; all five allocations through confirmed-hit rules; wrong order leaving exactly `63/8 HP` and recovering initial resources; unhinted transfer state/help recording; diagonal normalization, bounds, and dash cooldown.

The title and browser application were not yet available when these checks ran. Browser UI/Chrome/model/performance evidence remains pending.

### Issues raised with integration lead

1. **Unwinnable positive HP with only Pulses remaining.** Current state fails only when both ammo counters are zero. If all Bolts are spent while a living enemy remains and one or more Pulses are unused, no finite percentage-only sequence can kill it. The state can explain this immediately (or offer a clearly visible current-encounter retry) rather than leave the player waiting. Lead notified.
2. **Negative HP API contract.** The resolver's shipped state callers clamp to nonnegative HP, but an external call with negative HP produces negative applied damage. Recommend rejecting negative HP explicitly. Lead notified; no reachable gameplay failure established.
3. **Pacing requires actual play review.** Mandatory containment cycles of 35/62/62/62/75 seconds with only 1–8 required enemy hits can leave substantial dodge-only time. Floor threats must keep decisions readable and active; arithmetic feasibility alone does not establish balanced or engaging combat.
