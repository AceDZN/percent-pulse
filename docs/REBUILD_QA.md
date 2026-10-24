# Percent Pulse rebuild — independent friction and math review

Planning review, 24 October 2026. Reviewed current `src/game.ts`, `src/main.ts`, the saved actual gameplay evidence, `PLAYTEST.md`, and the owner's first-hand rejection: unclear purpose, strange controls/flow, boring pacing, and excessive difficulty unrelated to mathematics. That feedback is the priority for this rebuild. The prior 27 numerical tests establish arithmetic/state behavior; a complete automated replay supplies no evidence that the interaction is clear or enjoyable to a new player.

**Recommended direction, pending the owner's control preference and the lead's mockup/interaction contract:** movement arcade with automatic ordinary fire and aim, one deliberate Pulse action, and immediate enemy-clear progression. This document changes no game code or tests. The lead generates new gameplay mockups before implementation. Reuse the existing repository, exact math engine, and licensed imported Tripo model; no additional model spend is proposed.

## Friction in the current build

| Observed design / source evidence | Likely interaction cost | Rebuild recommendation |
| --- | --- | --- |
| Main input combines movement, ground-plane mouse aim, left Bolt, right/Q Pulse, Space dash, then E boost. Mobile has three action buttons. | The player must learn several mappings while identifying a small target and interpreting new damage/resource rules. | Movement plus one large Pulse action. Ordinary fire/aim is automatic. Dash and boost stay out of the first slice. |
| Ground-plane projection and narrow target rays require manual aiming at actors viewed from an elevated camera. | Looking at an enemy and successfully hitting it involve separate mechanical precision. | A stable, visible auto-target bracket. Ordinary fire and Pulse use the same target. |
| Encounters require both dead enemies and 35/62/62/62/75 seconds of survival. The verified campaign has 29 hits across 296 active seconds. | Clearing enemies does not end the encounter; much of play continues without an attack decision. | The last enemy's death ends the wave immediately, cancels pending dangers, and gives a 0.6–1 second transition. No mandatory survival clock or minimum campaign duration. |
| Finite ordinary ammunition can cause immediate failure, including a percentage-only remainder that cannot reach zero. | One inefficient choice can invalidate the encounter and require replaying its controls. | Unlimited ordinary Bolts. A poorly spent Pulse reduces efficiency, never makes the wave mathematically unwinnable. |
| Contact damage can repeat after 0.9 seconds outside windup; floor sweeps, arcs and bursts add concurrent threats. Idle encounter 1 can kill in about 11 seconds. | The cause of damage is difficult to distinguish while the player is still discovering controls. | First teach one clear enemy windup. Use contact separation/soft push, discrete warned attacks, generous recovery, and no overlapping attack patterns in the first 30 seconds. |
| Full-arena framing makes actors small, especially in portrait. HP/target/receipt/resource messages compete for space. | The world action and the next useful action receive less attention than the interface. | Compact arena, closer camera, larger actors, one target HP bar, one Pulse control, simple player health. Keep receipts outside the action on small screens. |
| Eight-second interludes and modal receipt logs interrupt the campaign. | The player must repeatedly confirm or wait after already achieving the objective. | Brief in-world clear feedback and automatic next wave; pause/replay detail stays optional. |

## A small, legible combat loop

Move to stay safe and influence the nearest target → the hero visibly fires ordinary Bolts → press Pulse when its current target is worth the charge or needs interrupting → see an immediate hit/HP consequence → clear the enemies and enter the next short wave.

- Desktop: WASD or arrows move; one large key/button activates Pulse. Touch: one movement stick and one Pulse button. The mouse is optional for the recommended arcade variant.
- Use one consistent auto-target rule with stable lock/hysteresis, a clear bracket, and generous visible range. Avoid hidden differences between a gun target and a “smart” Pulse target. Invalid/dead targets preserve the charge.
- Start with unlimited `18 HP` Bolts and one `25% of current HP` Pulse per wave, automatically restored at a clear. Ordinary fire continues to make every wave finishable even if Pulse is unused or inefficient.
- Show three simple player-health segments/hearts, a clear hurt reaction, separation, and about 1.5 seconds of recovery. Player-health presentation is separate from the enemy percentage calculation.
- A wrong movement/Pulse choice should cost a visible, recoverable amount of health or time. Retry restarts only the current short wave, restores health/charge, and gives safe re-entry. No lives pool or campaign reset.
- Ordinary enemies should be readable before they attack. Introduce one warning shape at a time. Later waves vary approach direction, spacing, target HP and enemy behavior; they do not lengthen a countdown.

## The mathematical choice needs an honest contract

With unlimited automatic `18 HP` attacks and a free damage-only `25%` ability, **using Pulse early on the largest current-HP target is usually the strongest damage choice**. Automatically selecting that target for the player makes the choice even less substantial. This can still be a satisfying, understandable power move; it should not be described as a deep mathematical strategy system.

Examples below hold ordinary-shot damage at 18 and ignore any intervening attacks:

| Current HP when Pulse lands | Pulse damage | Remaining HP | Bolts without / after Pulse |
| --- | --- | --- | --- |
| 144 | 36 | 108 | 8 / 6 |
| 108 | 27 | 81 | 6 / 5 |
| 72 | 18 | 54 | 4 / 3 |
| 36 | 9 | 27 | 2 / 2 |
| 18 | 4.5 | 13.5 | 1 / 1 |

The final two rows explain why a large-looking percentage hit need not save an ordinary shot. They also show that the `72 HP` equality compares **immediate unboosted raw damage**; Pulse is an additional ability here, not a replacement for a Bolt, so that equality is not an automatic “do not press below 72” rule.

Two coherent options:

1. **Simplest damage-only arcade.** Keep Pulse as a clear power move; vary target HP and show its changing base. Prioritize clarity and action over pretending every use is a difficult choice. An announced larger enemy arriving later in the same wave can give a gentle “use now or save” decision, with no irreversible penalty.
2. **Recommended if a real timing tradeoff is wanted.** Pulse also briefly interrupts/pushes its marked target, explicitly stated and visibly animated. Spend early on a 144-HP brute for 36 damage, or save it to stop an urgent smaller attacker. The rescue window must be broad and optional; survival must not demand a precise interrupt or another button. The extra rule supplies the tradeoff and must not be attributed to percentage arithmetic alone.

Do not add targeting wheels, timed arithmetic, extra weapon modes, or a second emergency key to manufacture depth. If the owner chooses the mouse-focused or tactical variant, revisit this input recommendation before implementation rather than quietly retaining both systems.

### Preserve these exact rules

Pulse captures its target's **current** HP immediately before its confirmed hit. Auto-fire may change that HP before the player presses Pulse. A live preview is provisional; the actual receipt names the captured base. For example `25% × 144 = 36` leaves `108`; if a Bolt already changed the base to `126`, the correct Pulse is `31.5`, leaving `94.5`.

Keep exact rational state, nonnegative HP, `applied = min(raw, before)`, and raw/applied distinctions. Same-frame auto/Pulse impacts serialize deterministically. A clear target must not silently switch during a Pulse confirmation. Preserve invalid-target conservation and historical event snapshots. Keep formulas LTR within Hebrew UI. Existing exact arithmetic tests remain useful; obsolete finite-ammo/duration tests should be replaced only after the new contract is settled.

## Proposed first 30 seconds

These are pacing goals, not timed gates:

- **0–3 seconds:** one short message: “זוזו. הירי אוטומטי.” The controllable hero and its target are large and visible. The first ordinary shot occurs without discovering a fire input. A single easy enemy can be defeated before any complex warning.
- **3–8 seconds:** an immediate clear and short transition. A second gentle threat demonstrates movement with one generous warning. No dash, boost, ammo puzzle, modal lesson, or compulsory damage.
- **8–18 seconds:** a slow durable enemy gives Pulse time to be noticed. One Pulse control says what it does and lights up. A hit gives a readable current-base receipt and a conspicuous HP drop. Ordinary fire still completes the wave if the player ignores it. Do not freeze indefinitely waiting for the “right” answer.
- **18–30 seconds:** a small mixed encounter offers the first rescue-versus-damage decision if the interrupt option is selected. End on its actual clearance. The player can already retry a short wave or continue; avoid stretching it to a portfolio duration quota.

Do not guarantee a particular base in an onboarding message while auto-fire is changing it. A mockup may show the exact `144 → 108` impact moment, but implementation must show the actual base when the button is used.

## Mockups to review before code

Ask the lead's image targets to show actual intended gameplay states: (A) ordinary automatic attack with no manual-fire control; (B) the deliberate Pulse impact with its exact base/receipt and one unmistakable action button; (C) touch layout with only movement and Pulse, keeping the target visible. HUD should communicate player health, enemies remaining, and Pulse ready/used. Avoid old ammo counters, survival clocks, tiny distant actors, and a large blocking lesson panel. The generated images remain design references; actual browser captures must later demonstrate the same action/consequence.

## Observable acceptance for the next prototype

- A fresh run visibly auto-targets and auto-fires without mouse aim or a fire key. The player can finish the opening wave using movement alone.
- The first screen gives one movement instruction and one Pulse action; a new player can explain those controls from the screen. Observe their first attempt without coaching before treating this as successful UX.
- Clearing the last target produces clear feedback within one simulation step and the next wave within about one second. No damage lands from leftover hazards after clearance.
- A failed/unused Pulse never softlocks ordinary progress. Retry restores the current wave in one action.
- The auto-target bracket stays stable enough to predict the next Pulse, and every receipt agrees with actual current HP and serialized impacts.
- The first 30 seconds show no overlapping warnings or required dash. Damage has a visible cause and a forgiving recovery interval.
- Desktop/tablet/portrait screenshots show large readable actors, an unobscured target, and the same simple input model. Touch aiming must not trigger an unintended ordinary shot.
- Pause, focus recovery, restart, resize, malformed settings, exact fractions, and event history still work. Test new flow through real controls after its contract exists; retain the rational model witnesses.
- Collect the owner's next first-person reaction to the small prototype before expanding content. Automated completion can verify these observable behaviors; it cannot demonstrate that the rebuild is fun or that anyone learned mathematics.
