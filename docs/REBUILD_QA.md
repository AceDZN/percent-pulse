# Percent Pulse v2 — independent rebuild QA

24 October 2026. The owner's actual play feedback—unclear goal, awkward controls, boring pacing, and mechanical difficulty—is the reason for this rebuild. V1's passing numerical tests and automated completion are historical engineering evidence, not evidence that the owner found it usable or enjoyable.

**Current v2 status:** **33/33 unit checks pass**: 21 replacement game/flow tests and 12 retained exact-math checks. **13/13 independent Chrome action checks and 4/4 final UI follow-up checks also pass**, with no page/console errors, failed resource responses, or external runtime requests. Desktop, tablet, and portrait captures were opened and inspected. No v1 browser pass is counted as v2 verification.

The independent reviewer owns this document, replacement `tests/game.test.ts`, and subsequent v2 browser checks. The lead owns game/UI integration, generated mockups, builds, and all Git actions. No new model generation/spend is required; the existing imported Tripo model and licensed font are reused.

## Mockups inspected before implementation

Opened all three generated targets before the v2 state/UI implementation was integrated:

- [opening.png](rebuild-v2/mockups/opening.png): large visible hero/enemies, automatic ordinary fire, one movement instruction, five health segments.
- [combat.png](rebuild-v2/mockups/combat.png): one Pulse action, visible shockwave/knockback, named current-HP receipt, two charge indicators.
- [clear.png](rebuild-v2/mockups/clear.png): immediate enemy-clear feedback and one continuation action.

Prompts and provenance are saved beside those images. The targets are generated design references, not actual gameplay evidence. Their numbers must yield to the authoritative rules: a skitter labeled 18 after an in-range Pulse could have started at 24; an 18-HP skitter hit by 25% must instead show 13.5.

## Friction being removed

| V1 evidence | Accepted v2 change |
| --- | --- |
| Movement, manual ground-plane aim, two attacks, dash, later boost; three mobile actions | Movement with WASD/arrows or floor-click destination; one deliberate Pulse action. Ordinary aim/fire is automatic. |
| 29 required hits across 296 active seconds, including 35–75 second survival gates after enemies died | Clear when all assigned enemies and pending stages are dealt with. No minimum survival duration. Empty-stage arrivals accelerate to within 0.6 seconds. |
| Finite ordinary ammo could invalidate the encounter | Unlimited 18 HP ordinary fire. Pulse efficiency cannot create a resource dead end. |
| Repeated contact damage while learning several threat systems | Contact alone is harmless. Enemy-owned lane/burst warnings precede discrete 20 HP impacts, followed by generous invulnerability. |
| Small distant actors and dense competing HUD blocks | Compact arena, closer camera, larger silhouettes, one Pulse control, simpler health/wave feedback. Requires actual capture review. |
| Long interludes and repeated progress confirmation | Immediate clear state, safe celebration, manual Next/Space at the player's pace; no mandatory interlude countdown. |

## Accepted v2 contract

- Ordinary Bolts automatically hit a stable marked target across the visible compact arena (18-unit range) for exactly 18 HP, with no ammo counter or aim/fire input.
- Pulse removes 25% of **each affected target's current HP**. Affected targets are live enemy centers within radius 5.4, inclusive. A successful area activation spends one charge regardless of target count, shoves/stuns those enemies, and cancels their pending warnings.
- Wave 1 is movement-only onboarding with no Pulse charges/UI. Waves 2–8 restore two charges each. Empty/dead/out-of-range attempts preserve charges.
- Guided opening waits safely for 0.45 units of first movement. Guided wave 2 places a 96 HP anchor plus three 24 HP skitters already inside range and suppresses auto/enemy attacks until the first valid Pulse. That area hit gives 96→72 and 24→18 on each skitter, followed by a 0.75 second auto-shot delay. Unguided play skips those gates.
- Player HP is 100, represented by five segments; each discrete hit costs 20. First-wave grace lasts 8 combat seconds. A clear heals 20, capped at 100.
- Retry restores full health/charges for the current wave. It does not reset campaign progress. Attempt receipts are scoped; historical event payloads are immutable snapshots.
- Eight finite formations use staged arrivals and changed placements, ending with a 720 HP sentinel. The plan aims for a short active slice rather than filling the old five-minute quota.

## Independent contract review

The initial review raised four issues that the state implementation addresses: a first Pulse pressed without a target, an immediate auto-Bolt obscuring 96→72, an empty-stage wait, and a false early clear while staged enemies remain. The tests below cover their consequences.

The browser pass specifically checked these integration concerns:

1. Space must be edge-triggered: holding it must not spend both charges or advance a clear from the same held press.
2. The Pulse radius/affected centers must be legible. The ordinary target bracket marks auto-fire, while Pulse affects the nearby set; do not imply it hits only the bracketed enemy.
3. A named last-Pulse receipt needs reading priority over rapid ordinary-shot effects. Its captured base is historical; auto-fire may already have changed current HP again.
4. The first movement instruction must explain floor-click movement as clearly as keyboard movement. No manual aiming or hidden ordinary-fire input should remain in the UI.

## Unit results — 33/33 pass

Ran `npm test` after replacing obsolete v1 game assertions. The first run revealed that the current opening intentionally starts with zero Pulse charges; expectations were aligned with that move-only onboarding. The subsequent suite passed all 33 checks.

| V2 state group | Verified consequence |
| --- | --- |
| Opening / no aim | Waiting before first movement spawns no danger; movement unlocks automatic combat; first wave clears without any fire/Pulse/aim action. |
| Safe Pulse introduction | The four targets stay unchanged during the safe prompt; first Pulse deals 24/leaves 72 on the anchor and 6/leaves 18 on each skitter; auto-fire does not alter that result for 0.7 seconds, then resumes. |
| Unlimited ordinary play | A 540 HP enemy is removed by 30 ordinary 18 HP hits without spending Pulse or encountering ammo failure. |
| Stable target | A closer newcomer does not jitter a valid lock; death/range loss releases it; an enemy across the full compact arena is still automatically attacked. |
| Area/radius math | 96→72, 120→90, 18→13.5 for affected centers, including the exact 5.4 boundary; a 5.4001 center and a dead target remain unchanged; one charge is spent. |
| Two charges / recovery | Two isolated Pulses give 96→72→54; cooldown/repetition cannot spend extra; ordinary fire finishes after both charges are gone. |
| Invalid activation | Empty/dead/out-of-range attempts consume no charge and create no confirmed-hit receipt. |
| Changed base under auto-fire | A Bolt makes 96→78; the later Pulse uses 78, dealing 19.5 and leaving 58.5, not using the old 96 base. |
| Interrupt / source ownership | Only affected enemies are stunned and only their warnings are cancelled; an unaffected enemy's warning remains. |
| Pending stages / immediate clear | An emptied stage accelerates its next arrival to ≤0.6 s without premature clear; the true last kill clears in the next fixed step, removes dangers, heals 20 and waits safely for Next. |
| Failure / final outcome | Final-wave last kill goes directly to won; retry restores only the current wave and clears its displayed attempt log. |
| Damage readability | Contact alone does no damage; a discrete source warning precedes the hit; invulnerability suppresses overlapping impacts; first-wave grace is honored. |
| Pause / movement / traces | Pause freezes state and clears destination/input; keyboard overrides click movement; ellipse bounds and non-finite destination rejection hold; historical nested state is copied. |
| Content metadata | Eight distinct finite formations have positive HP, ordered stages, valid placements, a final boss, and no ammo/duration gates. |

The retained 12 mathematical checks still cover rational arithmetic, 96→72→54, the unboosted 72 HP raw-damage equality, mixed versus pure operations, fractions/overkill, percentage-only positivity, and invalid HP. They include legacy v1 ammo witnesses and an unused boost API as arithmetic fixtures. Those fixtures are not claims about v2's content, shipped controls, or eight-wave balance.

## Mathematical meaning in the simpler loop

Unlimited automatic 18 HP fire makes an early percentage hit on high current HP efficient. V2 adds positioning and rescue value through area coverage and interruption. Examples without intervening attacks: 144 HP takes 36 damage and leaves 108; 36 HP takes 9 and leaves 27; two nearby 144/36 HP targets take 36/9 in one activation. Catching several targets or stopping a warned attack can matter even when a small target's percentage damage does not save an ordinary shot.

The 72 HP equality compares immediate unboosted raw damage. Pulse is an additional area/interrupt ability in v2, so that equality is not a universal cutoff for pressing it. Do not present the mechanic as a deep optimal-strategy puzzle or infer learning gains.

Actual hit receipts must capture current HP atomically and preserve exact rational state. A preview is provisional under automatic fire. Same-frame hits serialize; applied damage is clamped; a percentage-only strike never silently kills positive HP. These rules remain independent of decorative geometry.

## Independent Chrome action results — 13/13 pass

Ran `node tests/rebuild-browser-qa.mjs` against the stable production preview at `http://localhost:4182/`, Chrome 155.0.8059.85. The harness uses actual keyboard, mouse, and CDP touch input plus the documented fixed-step `advanceTime` hook. No HP, resources, formations, waves, or wins were injected. Screenshot capture waits for CSS fades while the game clock remains frozen; these images are actual rendered gameplay, not generated references.

| Action check | Observed result |
| --- | --- |
| Guided opening and malformed saved settings | Corrupt settings fall back safely. Twenty simulated seconds before movement preserve 100 HP, no enemies, and a movement-only coach; Pulse is hidden. |
| Movement, automatic ordinary fire | A short ArrowRight press unlocks combat. Confirmed ordinary hits occur with no aim or fire input. |
| Immediate clear and safe continuation | Wave 1 ends at 2.37 active seconds in this route; no danger remains, and another 20 simulated seconds do not advance its clear state. |
| Held Next / safe Pulse gate | Holding Space to enter wave 2 does not activate Pulse. The 96 HP anchor and three 24 HP skitters remain unchanged and harmless until a fresh press. |
| One deliberate area Pulse | One Space press spends one charge: anchor 96→72 and each skitter 24→18. The receipt shows `25% × 96 = 24`. Holding/repeating the key does not spend the second charge. |
| Settings, destination, latest current base | Mute, reduced motion, and remapping Pulse to P persist. Clicking the floor sets a destination; a later Pulse receipt replaces the earlier larger hit using that latest activation's actual current base. |
| No charge dead end / held clear guard | Unlimited ordinary fire completes wave 2 after both charges are spent. A held special key does not skip the clear. |
| Movement mode | ArrowLeft overrides a floor destination without switching to an aiming mode. |
| Pause, viewport, fullscreen | Escape freezes time and position; resume, tablet/portrait resize, and fullscreen entry/exit preserve progress. |
| Explicit blur handler | A **synthetic blur event** pauses and clears held movement; resume does not leave the player moving. Native foreground/tab focus behavior is not established by this check. |
| Genuine failure and checkpoint recovery | With no further movement/Pulse input, ordinary play clears waves 3 and 4, then loses on wave 5. Retry stays on wave 5 and restores 100 HP, two charges, and an empty attempt receipt list. |
| Touch opening and Pulse | Actual CDP touch-stick gestures unlock movement, ordinary fire clears wave 1, and taps on Next/Pulse produce the same four-target 96→72 / 24→18 result at 768×1024. Resizing to 390×844 preserves the state; receipt bounds do not cover a live enemy center. |
| Runtime/resources | No page errors, console errors, HTTP failures, or external runtime requests. The imported Tripo model reports loaded during gameplay. |

Compact machine-readable results and actual screenshots:

- [QA report](rebuild-v2/actual/qa-report.json)
- [Desktop first area Pulse](rebuild-v2/actual/qa-desktop-pulse.png)
- [Actual failed-wave retry prompt](rebuild-v2/actual/qa-retry-prompt.png)
- [Touch tablet Pulse](rebuild-v2/actual/qa-tablet-pulse.png)
- [Touch portrait Pulse](rebuild-v2/actual/qa-portrait-pulse.png)

The lead separately reports a successful eight-wave action replay: 114.85 game-clock seconds, 48 kills, 11 Pulses, no retries, and no runtime/resource errors. That campaign run is separate from this independent controls/recovery pass. It establishes a feasible route through the finite formations, not a predicted human completion time.

## Visual observations and remaining acceptance

The opened desktop/tablet captures show the larger cyan hero, imported magenta anchor, single large Pulse action, five health segments, correct 72/96 and 18 HP labels, and a readable named percentage receipt. The generated targets were inspected before implementation and remain design references; actual-capture comparison is documented in [the v2 visual review](rebuild-v2/VISUAL_REVIEW.md).

Final portrait framing keeps the playable area and reachable large controls visible. That decision reduces actor and HP-label size compared with desktop/tablet, so phone legibility remains a real limitation for a human check. The receipt is parked above the arena and does not obscure live centers in the captured first Pulse. The clear card overlaps part of the lower hero. The player/skitters remain procedural models; the imported sentinel is visible. This is a recognizable implementation of the planned composition, not pixel identity with the generated art.

The first capture review found keyboard-shaped coaching on touch and a production bundle still showing the selected anchor's ground ring cyan outside Pulse range. The final source build corrects both. The refreshed captures show larger HP labels, pink ground rings after the shove puts all centers outside 5.4, and separate white automatic-target brackets. This removes the observed mismatch; the numerical hit state was already correct.

## Final UI follow-up — 4/4 pass

After the final copy/button and scene build, ran `node tests/rebuild-ui-followup.mjs` against the same production preview. This narrow follow-up preserved the original 13-check results and did not repeat the full campaign.

1. A remapped desktop up key (`I`) appears in the movement coach and actually unlocks ordinary combat.
2. Enter on the focused Pulse button activates exactly one area Pulse: anchor 96→72, three skitters 24→18, one charge spent, and the current-base receipt `25% × 96 = 24`.
3. Touch coaching names the visible stick/floor and Pulse button, without a keyboard-only glyph. Actual touch gestures and taps still produce the same four-target result at tablet size; portrait resize preserves it.
4. No page/console errors, failed responses, or external runtime requests occurred.

Opened and inspected every new capture. [Final follow-up report](rebuild-v2/actual/qa-ui-followup-report.json) preserves the actual pre/post-relevant state. The desktop/tablet/portrait Pulse PNGs linked above were refreshed from this final build; the failure/retry prompt remains evidence from the earlier full controls pass. [Touch movement coach](rebuild-v2/actual/qa-touch-coach.png) and [touch Pulse introduction](rebuild-v2/actual/qa-touch-pulse-intro.png) show the corrected instructions.

Observe the owner's first attempt without coaching: can they tell that movement is the primary task, ordinary fire is automatic, and Pulse is the single special action? Their next reaction guides expansion. Automated completion verifies consequences and controls; it cannot establish that the rebuild is fun or produces learning gains.

Final lead framing follow-up: the narrow-screen camera was pulled back to keep movement-boundary player centers in view. The four UI follow-up checks were rerun after that build, and all desktop/tablet/portrait follow-up images above were refreshed. Eight actual directional-input cases across 390×844 and 768×1024 passed; the minimum sampled horizontal player-center margin was 34.24px. See [edge report](rebuild-v2/actual/narrow-camera-report.json), [phone edge capture](rebuild-v2/actual/portrait-edge.png) and [tablet edge capture](rebuild-v2/actual/tablet-edge.png). This improves edge visibility while making phone actors smaller; it is not a claim about real-device comfort.
