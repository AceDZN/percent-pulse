# Curriculum and rule provenance

Percent Pulse is an original arena combat game for Hebrew-speaking learners aged about 13–14. Its numerical relationships are informed by the saved Workbook modules below; Workbook has not validated the game, its balance, or learning outcomes. Combat fiction, HP values, attack names, wave formations, and receipts are newly authored.

## Sources actually reviewed

The independent QA reviewer read the saved JSON blocks under `/Users/acedzn/idea-plotter/reports/math-games-2026-10-24/curriculum/` on 24 October 2026. The exact module routes come from each snapshot's `canonicalUrl`. Block indices below are zero-based and identify the reviewed source evidence without redistributing the source content.

| Source | Reviewed evidence | Relationship used in the game |
| --- | --- | --- |
| [מהו אחוז](https://math.workbook.co.il/grade-8/chapter-5/percent-meaning) | `percent-meaning.json`, `blocks[7]` concept explainer; `blocks[25]` named-base checkpoint; `blocks[38]` percentage representations | A percent is a ratio with a named whole. `25% = 1/4`; a Pulse removes one quarter of the target's current HP. |
| [אחוז שינוי](https://math.workbook.co.il/grade-8/chapter-5/percent-change) | `percent-change.json`, `blocks[7]` concept explainer; `blocks[24]` old-value checkpoint; `blocks[47]` wrong-denominator comparison | Relative change uses the pre-change value as its denominator. A confirmed Pulse's `before` HP is its percentage base. |
| [שינויים עוקבים](https://math.workbook.co.il/grade-8/chapter-5/consecutive-percent-changes) | `consecutive-percent-changes.json`, `blocks[7]` concept explainer; `blocks[25]` updated-base checkpoint; `blocks[30]` successive discounts; `blocks[38]` explicit commutativity | Successive changes multiply factors. Two Pulses leave `H × 3/4 × 3/4`, not `H × 1/2`. Pure scalar factors commute; their intermediate values can differ. |

## Current v2 action mapping

The rebuild deliberately reduces simultaneous control and resource demands. It preserves exact changing-base consequences without claiming that an automatic blaster plus a limited shockwave is an optimal-ammunition puzzle.

| Action | Authoritative relationship | Concrete witness / misconception check |
| --- | --- | --- |
| Move while the blaster fires automatically | Ordinary raw damage is `18 HP`, independent of the target's HP | `96 → 78`; `18 → 0`. This is flat damage, not “18%.” Unlimited ordinary shots remain a finisher after Pulse charges are spent. |
| Release an area Pulse | For each live enemy center within radius 5.4: raw damage `before × 1/4`; remaining HP `before × 3/4` | The safe wave-two formation changes one anchor `96 → 72` and three skitters `24 → 18` in the same activation, spending one charge. Each target has its own percentage base. |
| Release another Pulse | Capture the current HP atomically again, without rounding | Pure witness `96 → 72 → 54`: the second hit deals `18`, not another `24`. Automatic shots may intervene in actual play; the receipt then names the actual updated base. |
| Catch a warning with Pulse | Numerical damage uses current HP; shove/stun/interrupt are separate explicit combat rules | A smaller enemy can still be a useful Pulse recipient because it is threatening the player. “Above 72HP” describes immediate raw damage comparison only, not a universal best action. |
| Compare immediate raw damage | `H/4 = 18` at exactly `H = 72` | Above 72, a single Pulse's raw damage exceeds one ordinary shot; below it, the shot is larger. Area coverage, cooldown and escape space also matter to play. |
| Read mixed attack receipts | Pulse then Bolt: `3H/4 − 18`; Bolt then Pulse: `3(H − 18)/4`, before overkill clamping | From 100, results are 57 and 61.5. The flat subtraction creates this difference; pure percentage factors themselves commute. |
| Finish a damaged enemy | Applied damage `min(raw, before)`; remaining HP never below zero | An 18HP shot against `1/4 HP` applies `1/4`, although raw damage remains 18. No hidden rounding-to-death threshold is used. |
| Try Pulse with no eligible target | No hit and no charge spent | Ordinary fire remains available; poor range/timing cannot make a wave mathematically unwinnable. A visible ring and button state communicate eligibility. |
| Use percentages alone | For finite `n`, `H_n = H_0 × (3/4)^n > 0` for positive initial HP | The exact core does not silently kill positive fractional HP. The ordinary blaster supplies finishing damage. |

Pure-factor examples (`100 × 4/5 × 6/5 = 96` in either order), the mixed-order witness and historical boost arithmetic remain covered by the pure math suite. They are not additional controls or a claimed optional lesson screen in v2. The shipped boost action and five finite-ammunition tables were removed; their old test witnesses are historical API checks only.

## Numerical and language contract

- HP and damage use exact rational state. Rounded decimal display is presentation only and never determines damage or death.
- Current HP is captured immediately before each confirmed hit. Serialized hits use the updated state. The post-hit receipt is authoritative because automatic fire can change the base between actions.
- Hebrew uses `lang="he"`, `dir="rtl"`; formulas, fractions and numbers use isolated LTR elements. The live receipt presents `25% × before = raw` and `before → after`.
- “החיים הנוכחיים” names the percentage whole. Two charges per wave limit the special action; ordinary shots are unlimited.
- No survival countdown, ammunition failure, arithmetic answer field or mastery gate is shipped. The changed later formations introduce more threats, not a claim of an unhinted mathematical transfer assessment.
- QA checks consequences, controls and recovery. It does not establish mastery, enjoyment, learning gains or Workbook endorsement.
