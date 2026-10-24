# Curriculum and rule provenance

Percent Pulse is an original arena combat game for Hebrew-speaking learners aged about 13–14. Its numerical relationships are informed by the saved Workbook modules below; Workbook has not validated the game, its balance, or learning outcomes. Combat fiction, HP values, attack names, allocation puzzles, and receipts are newly authored.

## Sources actually reviewed

The independent QA reviewer read the saved JSON blocks under `/Users/acedzn/idea-plotter/reports/math-games-2026-10-24/curriculum/` on 24 October 2026. The exact module routes come from each snapshot's `canonicalUrl`. Block indices below are zero-based and identify the reviewed source evidence without redistributing the source content.

| Source | Reviewed evidence | Relationship used in the game |
| --- | --- | --- |
| [מהו אחוז](https://math.workbook.co.il/grade-8/chapter-5/percent-meaning) | `percent-meaning.json`, `blocks[7]` concept explainer; `blocks[25]` named-base checkpoint; `blocks[38]` percentage representations | A percent is a ratio with a named whole. `25% = 1/4`; a Pulse removes one quarter of the target's current HP. |
| [אחוז שינוי](https://math.workbook.co.il/grade-8/chapter-5/percent-change) | `percent-change.json`, `blocks[7]` concept explainer; `blocks[24]` old-value checkpoint; `blocks[47]` wrong-denominator comparison | Relative change uses the pre-change value as its denominator. A confirmed Pulse's `before` HP is its percentage base. |
| [שינויים עוקבים](https://math.workbook.co.il/grade-8/chapter-5/consecutive-percent-changes) | `consecutive-percent-changes.json`, `blocks[7]` concept explainer; `blocks[25]` updated-base checkpoint; `blocks[30]` successive discounts; `blocks[38]` explicit commutativity | Successive changes multiply factors. Two Pulses leave `H × 3/4 × 3/4`, not `H × 1/2`. Pure scalar factors commute; their intermediate values can differ. |

## Game action, consequence, and misconception checks

| Action | Authoritative relationship | Concrete witness / misconception check |
| --- | --- | --- |
| Hit with a Bolt | Raw damage `18 HP`, independent of HP | At `96 HP`, Bolt leaves `78`; at `18 HP`, it kills. Flat damage does not mean “18%.” |
| Hit with a Pulse | Raw damage `before × 1/4`; remaining HP `before × 3/4` | `96 → 72 → 54`: second Pulse deals `18`, not another `24`. Its base is `72`, not maximum or spawn HP. |
| Compare immediate unboosted damage | `H/4 = 18` exactly at `H = 72` | Above `72`, Pulse has greater immediate raw damage; below it, Bolt does. This is not a universal ammunition, cooldown, survival, or optimal-strategy rule. |
| Choose mixed attack order | Pulse then Bolt: `3H/4 − 18`; Bolt then Pulse: `3(H − 18)/4` before overkill clamping | From `100`, the results are `57` and `61.5`. The `4.5` difference comes from the added flat subtraction. Do not claim all percentage sequences are order-sensitive. |
| Inspect pure successive factors in optional explanation | `H × 4/5 × 6/5 = H × 6/5 × 4/5 = 24H/25` | At `100`, both orders yield `96`, so `+20%` and `−20%` do not cancel. This optional example does not add a new combat mechanic. |
| Arm the one next-confirmed-hit boost | Multiply the attack's unboosted raw damage by `3/2` | Bolt `18 → 27`; at `96 HP`, Pulse raw damage `24 → 36`, equivalent to `37.5%` of that captured HP. A “+50% damage” boost is not `+50 percentage points` or `50% of target HP`. |
| Finish a damaged enemy | Applied damage `min(raw damage, before HP)`; after `max(0, before − raw)` | A Bolt against `1/4 HP` applies `1/4`, although raw damage is `18`. The receipt distinguishes raw and applied values. |
| Miss or aim at a dead/invalid target | No confirmed-hit ammunition or boost is consumed; a miss still costs time/cooldown | No “ghost hit” should spend the only feasible finisher. Simultaneous confirmed impacts must serialize against updated HP. |
| Keep using percentages alone | For finite `n`, `H_n = H_0 × (3/4)^n > 0` when `H_0 > 0` | No hidden low-HP death threshold; display rounding must not turn positive rational state into zero. |

## Encounter allocation witnesses

These witnesses prove the listed initial resources can remove the listed HP. They do not prove a combat encounter is balanced or pleasant to play. `P` means unboosted Pulse and `B` means unboosted Bolt unless marked.

| Encounter | Initial targets; available resources | Feasible exact allocation |
| --- | --- | --- |
| 1 — first impact | `18`; `B2 / P1` | `18 − 18 = 0` using one Bolt. |
| 2 — split threats | `96 + 18`; `B4 / P2` | Anchor `96 → 72 → 54 → 36 → 18 → 0` (`PPBBB`); skitter `18 → 0` (`B`). |
| 3 — closing window | `84 + 54`; `B6 / P2` | Anchor `84 → 63 → 189/4 → 117/4 → 45/4 → 0` (`PPBBB`); skitter `54 → 36 → 18 → 0` (`BBB`). Last anchor Bolt applies `45/4`. |
| 4 — power spike | `96 + 27`; `B4 / P2`; one next-hit boost | First clear the anchor with `PPBBB` as above. Arm the boost before the remaining Bolt: `27 → 0`, raw/applied damage `27`. Arming the boost earlier changes its recipient and is a real choice. |
| 5 — transfer pattern | `120 + 36`; `B6 / P2` | Anchor `120 → 90 → 135/2 → 99/2 → 63/2 → 27/2 → 0` (`PPBBBB`); skitter `36 → 18 → 0` (`BB`). Last anchor Bolt applies `27/2`. |

Encounter 5 should begin with expected-damage preview off and no highlighted weapon. Optional help use and retries can be reported in anonymous local events; successful repeated or hinted actions must not be described as first unaided success or proof of learning.

## Numerical and language contract

- HP and attack calculations use exact rational state. Rounded decimal display is presentation only, never input to damage or death checks.
- Positive percentage bases are captured atomically immediately before each confirmed hit; same-frame hits use serial updated state.
- Hebrew guidance and navigation use `lang="he"`, `dir="rtl"`; formulas, numbers, fractions, weapon symbols, and HP units are isolated LTR.
- “חיים נוכחיים” names current HP; “בסיס האחוז” names the whole; “נזק בסיסי” names the unboosted raw attack damage when explaining the boost.
- QA automation checks numerical consequences and usability. It does not establish student mastery, enjoyment, learning gains, or Workbook endorsement.
