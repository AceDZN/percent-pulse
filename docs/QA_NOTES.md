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

### 24 October 2026 — fixes and independent regression recheck

`npm test` now passes **26/26 tests**. The lead fixed the first two reported issues: negative HP is rejected, and spending the last Bolt while positive enemy HP remains immediately explains that percentage-only attacks cannot reach zero. Added regressions cover both.

Further QA findings fixed in source and covered where appropriate:

- Retry receipts now have an attempt boundary. The prior attempt's killing Bolt no longer appears as damage in a new attempt where no shot landed. Historical local events remain available. State regression passes.
- The unavailable boost control is hidden reliably with explicit `[hidden]` styling.
- Canvas touch aim no longer automatically fires a Bolt; explicit touch buttons choose the attack. Input clearing also resets the captured virtual stick.
- Deterministic stepping now forces HUD synchronization, addressing the old 90 ms DOM throttle during immediate captures.
- A local favicon was added after the independent Chrome run identified its precise 404 URL.
- New geometric regressions verify the player boundary's ellipse equation, forward arc versus safe rear/center/side, inner/outer radial margins, angular edges, and `−π/+π` wraparound. They isolate the geometric subsystem from unrelated enemy damage; they are not gameplay victory evidence.

### Production action-client evidence

Ran the installed `/Users/acedzn/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js` against `http://localhost:4182` with actual Start → arrow movement → Space dash input. Inspected `artifacts/qa-production-input/shot-0.png` and `state-0.json`: live encounter 1 at 1.02 s, player x = 7.98 after movement/dash, HP 100, dash count 1, cooldown about 1.97 s, and `Tripo pulse-sentinel.glb loaded`. No errors artifact was emitted. This was the earlier rectangular arena build, before the generated-reference visual revision.

A supplemental Google Chrome channel UI run confirmed malformed-setting recovery, a mouse Bolt receipt `18 → 0`, unavailable boost hidden, and Escape pause/resume preserving player state. It also visibly reached no-input failure and displayed its retry panel. An immediate visibility assertion preceded the old HUD throttle, so the first supplemental run stopped before clicking that failure-panel button; it is not a complete UI pass. The next attempt encountered slow startup under host load and the old favicon 404. Final stable-build UI recheck remains pending; `tests/browser-ui-qa.mjs` records the exact actions and diagnostics.

### Generated target review before revision

Inspected `docs/visual-targets/gameplay-v1.png` as a generated design target, never as a gameplay capture. Compared with the actual production input capture and the lead's early `docs/evidence/pulse-72.png`.

Matching elements: elevated arena view, cyan player/flat attack versus magenta enemies/percentage attack, visible reticle, numerical HP and finite attack controls. Material differences raised with the lead: circular stone floor/perimeter and deep environment versus a rectangular grid slab; much larger/readable target silhouettes; current/max HP bars; nearby receipt; bottom-corner HUD hierarchy. The early Pulse screenshot also had stale fixed HUD text despite correct 72-HP mesh/state. The lead is revising these and synchronizing capture. Final comparable review belongs in `docs/VISUAL_REVIEW.md` after the revised live screenshot is available.
