> **Historical v1 evidence.** Current rebuild results are in [PLAYTEST.md](../PLAYTEST.md), [REBUILD_QA.md](REBUILD_QA.md) and [v2 visual review](rebuild-v2/VISUAL_REVIEW.md).

# Independent math and playability QA

**Final status:** **27/27 math/state tests** and **11/11 independent production UI checks passed**. The final portrait rendering recheck also passed after the fixes below. Native focus loss under browser automation remains unverified; it is not reported as a pass.

The independent reviewer owns curriculum, math/state tests, control checks, and visual review. The lead owns game integration, production builds, all Git actions, and the complete adaptive five-encounter browser replay. No automation establishes enjoyment, student mastery, learning gains, or Workbook endorsement.

## Verified numerical and state rules

`npm test` passes 27 tests across `tests/math.test.ts` and `tests/game.test.ts`:

- Exact rational normalization and arithmetic; `96 → 72 → 54`; `72 HP` immediate unboosted crossover.
- Mixed flat/percentage order `57` versus `123/2`; pure-factor commutativity and `100 → 96` for `−20% / +20%`.
- Boosted raw damage `27`/`36`; raw versus applied fractional overkill; no damage/boost use on zero HP; invalid negative HP rejection.
- 160 percentage-only hits remain strictly positive; serialized updated-HP effects; cooldown prevents duplicate same-frame fire commands.
- All five finite-ammunition witnesses replay through confirmed-hit state rules. Misses/dead rays preserve ammo and boost; a real next valid hit consumes the boost.
- Wrong order leaves exactly `63/8 HP`; running out of finishing Bolts explains why remaining percentage-only shots cannot reach zero; retry restores resources.
- Pause freezes relevant state, retry scopes displayed receipts to the current attempt, and local historical events remain available. Event payloads are snapshots: later ammunition use cannot rewrite an encounter-start record.
- Diagonal movement, dash cooldown, ellipse bounds, and arc forward/rear/radial/angular/wraparound geometry.
- Transfer starts at `120 + 36`, `B6/P2`, preview off, no automatic help use, with a distinct initial formation: anchor `(-6,-3)`, skitter `(7,-6)`.

Read the actual saved Workbook modules and evidence mapping in [CURRICULUM.md](../CURRICULUM.md). Pure multiplier commutativity is explicitly present in the reviewed source; mixed flat/percentage order dependence is an original game application.

## Independent production controls

`node tests/browser-ui-qa.mjs` completed **11 checks** against `http://localhost:4182` in Google Chrome, using **1280×720** desktop and **390×844** portrait viewports:

1. Malformed saved settings recover to valid defaults.
2. Real mouse Bolt confirms `18 → 0`, spends one charge, and unavailable boost stays hidden.
3. Escape pause/resume freezes simulation and preserves player position.
4. No-input failure and the visible retry button restore HP/ammunition; a new attempt's empty log contains no prior attempt's hit.
5. Actual settings controls mute audio, reduce effects, remap Bolt to K, and the remapped key fires successfully.
6. Right-click Pulse changes exact HP and suppresses the browser context menu.
7. Portrait resize preserves progress, and viewport-edge aiming remains finite; receipt height stays below 180 px.
8. F enters/exits fullscreen without resetting gameplay.
9. Blur handler pauses, clears a held movement key, and resumes without continuing that stale input. **Method: explicit blur event**, because headless tab switching emitted no observable focus loss.
10. Actual touch aim preserves ammo, explicit Pulse changes `18 → 27/2`, CDP touch movement drives the virtual stick, and touch dash activates.
11. No page/console errors, failed resource responses, or external runtime requests in this run.

These control/visual results are retained after the final event-snapshot fix because it changes only copied trace payloads, not gameplay or rendering. Earlier raw traces may contain the corrected historical ammo alias; the new nested-resource regression directly covers that defect.

Raw action report/captures are in ignored `artifacts/qa-ui/`; the reproducible test script is committed. Browser metadata identifies the real Chrome channel; no unmeasured GPU or FPS claim is inferred from a launch flag.

The installed develop-web-game action client was also run and visually inspected beyond the title screen. A production Start → arrow movement → Space dash sequence reached live encounter 1, dash count 1, HP 100, and a loaded Tripo model, with no errors artifact. The lead and visual contributor repeated the installed-client/native-Chrome checks on the final scene; see [PLAYTEST.md](../PLAYTEST.md).

## Visual findings fixed and rechecked

The crew found these concrete issues during development; the lead fixed them and independent QA checked the relevant consequences:

| Finding | Fix / recheck |
| --- | --- |
| Positive HP stranded with only percentage attacks | Immediate truthful failure explanation; exact state regression passes. |
| Negative HP could yield negative applied damage | Explicit rejection; regression passes. |
| Encounter-start ammunition referenced mutable live resources | `Game.log` copies payloads with `structuredClone`; an independent focused regression confirms initial `B2/P1` remains unchanged after a real Bolt reduces live ammo to `B1/P1`. |
| Retry displayed an earlier attempt's killing receipt | Attempt boundary for text/HUD/replay; state and actual failure-panel checks pass. |
| Hidden boost control overrode the HTML hidden attribute | Explicit hidden styling; actual UI check passes. |
| Touch aim automatically fired Bolt | Touch aim-only path plus explicit attack buttons; actual touch check passes. |
| Captured touch stick survived input clearing | Input clearing resets captured touch state; movement/recovery checks pass. |
| Deterministic capture had stale HUD | Time hook forces HUD update; actual 72/96 receipt screenshot agrees with state. |
| Missing favicon returned 404 | Local icon; final UI request/error checks are clean. |
| Settings interlude could advance behind its modal | Simulation freezes while settings is open. |
| Encounter 5 reused an earlier formation | Distinct `(-6,-3)/(7,-6)` positions; independent screenshot review and lead full replay agree. |
| Portrait receipt stretched across the arena | Remove conflicting bottom anchoring; height regression passes. |
| Portrait camera was beyond fixed fog limits | Camera-relative fog preserves desktop and reveals the portrait floor/actors. |
| Portrait receipt covered the live target | Phone receipt docks above the arena; final portrait regression checks target is not covered. |

`node tests/browser-portrait-qa.mjs` rechecked the final **390×844 touch viewport** through Start, touch aim, and Pulse. Exact remaining HP is `27/2`, the receipt is bounded and does not contain the target's screen point, and there are no console/page errors. The reviewer opened the actual before/after images. The final published capture is [touch-portrait.png](evidence/touch-portrait.png).

The canonical generated target and actual 1672×941 hit/arc/boost/recovery captures were opened and compared. See [VISUAL_REVIEW.md](VISUAL_REVIEW.md) for corrected composition and remaining asset/feedback differences. The generated target is never used as implementation evidence.

## Full-flow evidence and limits

The lead's final real-keyboard/mouse adaptive replay completed all five encounters after the changed transfer formation and focus watchdog: **296.08 active seconds + 32 interlude seconds**, **29 confirmed shots**, **0 retries**, **0 help uses**, and no console errors, failed responses, or external requests. This reviewer independently checked the saved hit/boost/failure/transfer images against the numerical rules. Full replay implementation and report scope are in [PLAYTEST.md](../PLAYTEST.md).

Native Chrome focus retesting by the visual contributor did **not** show the pause overlay after switching to its own blank tab and back, including a short batch intended to reduce tool latency. Browser/debugger focus emulation may affect that observation. Source blur/visibility handlers, a focus watchdog, and the explicit blur-handler test are present, but native focus loss is **unverified / observed no pause under this instrumentation**. Ordinary Escape pause is verified. No native-focus pass is claimed.

The generated anchor is static, the procedural player/skitter are simpler than the reference, and clearing targets leaves substantial dodge-only survival time. These are visible scope/pacing limits. Automated completion does not establish human fun or educational outcomes. Early HMR/rebuild races, RAF-polling stalls, and old 404 diagnostics are historical failures that were diagnosed and rechecked; they are not folded into a false uninterrupted first-pass claim.
