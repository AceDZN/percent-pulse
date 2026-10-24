# Percent Pulse rebuild — move, blast, Pulse

24 October 2026. The owner's actual play feedback is the reason for this rebuild: unclear goal, confusing controls, boring flow and mechanical difficulty. Passing v1 automation did not establish usability or enjoyment. This plan supersedes the v1 fixed-ammunition tables, mandatory containment timers, manual aim, dash and boost controls.

## Design thesis

Move around a compact, readable 3D arena while the blaster handles aim and ordinary fire. Press Space or the large Pulse button to release a 25%-of-current-HP shockwave that also pushes enemies away. Clear the enemies, celebrate immediately, enter a new pattern. A poor Pulse is less efficient, never an ammunition dead end.

Visual thesis: big cyan combatant and faceted magenta threats on a close, calm slate platform, with warm warnings and a satisfying cyan shock ring. Content plan: a playable ten-second opening, one safe Pulse introduction, short escalating waves, a concise clear/retry screen. Interaction thesis: visible movement lean; anticipated enemy attacks; enemy shove, hit recoil and burst on defeat; immediate last-kill celebration.

## Required controls

- WASD/arrows **or** click/hold on the floor: move. A touch stick serves the same action.
- Space **or** the large Pulse control: special action. No manual aim, weapon switch, right-click attack, dash or boost to learn.
- Escape/pause; settings for volume, reduced effects and remapping.

Ordinary Bolts automatically target a clearly marked nearby threat and deal exactly18HP, with unlimited ammunition. A stable target remains selected until it dies or becomes unavailable. Pulse affects nearby enemies inside a visible radius, removing one quarter of each target's HP at impact and briefly shoving/stunning them. Two charges refill on each wave. This creates a simple positioning/rescue choice: use it against urgent small attackers, catch multiple enemies, or save for an announced large arrival. It is not presented as a deep optimal-strategy puzzle.

## First thirty seconds

1. Start puts the player directly in the arena. One instruction: move with arrows/WASD or click the floor. Only movement is introduced.
2. After the first movement, a few slow enemies approach. The marked target and automatic18HP shot demonstrate the attack without aiming. The first seconds are forgiving.
3. The last kill immediately clears the wave. No survive-the-empty-arena countdown remains.
4. A safe large target introduces Pulse: one clear Space/button prompt, no damage while that introductory action is pending. A confirmed first hit shows96→72 and the actual25%×96=24 receipt. Then normal play resumes.

## Pacing and recovery

Eight short formations with staged arrivals, two enemy families, a final large sentinel. New arrivals provide active combat variety rather than mandatory elapsed-time gates. The run is intentionally shorter than v1 if the player clears quickly; the goal is a lively2–4minute slice, not filling five minutes with waiting. Enemies use discrete, clearly telegraphed attacks. Contact alone does not drain HP. Damage removes one of five visible shield segments, followed by generous invulnerability. A wave clear heals a segment. Retry restarts only the current wave immediately and restores resources. There is no resource-only failure.

## Mockup-first workflow

Generate and inspect three actual imagegen references before implementation: first seconds, Pulse combat, immediate wave clear. Save exact prompts and identify them as generated mockups. Derive camera/actor scale, HUD and feedback from them. Reuse the existing Chrome-Tripo sentinel and licensed font; no extra credit spend during flow validation. Build actual interactive3D, then compare real captures at the same viewport. Reference art never becomes a game background.

## Exact math and acceptance

Keep BigInt rational damage. Capture currentHP atomically; apply min(raw,currentHP); never round state. Percentage-only damage cannot silently kill. The live preview may change because auto-fire changes the base; the post-hit receipt is authoritative. Ordinary18HP and Pulse25% stay fixed throughout this first rebuild. Old boost helpers can remain as tested mathematical API, but no boost is shipped in the v2 player flow.

Acceptance observations: movement is the only opening instruction; the first attack needs no aim/click; Pulse uses one consistent action; ordinary play never requires simultaneous mouse aiming and keyboard movement; last kill clears without a survival timer; empty arena never keeps spawning dangers; damage has a visible prior warning and a discrete source; a failed action cannot strand resources; retry preserves wave progress; actors and threats remain readable on desktop/tablet; actual scenes are compared with the generated mocks. Independent QA challenges these conditions. Human play feedback is still needed before claiming it is fun.
