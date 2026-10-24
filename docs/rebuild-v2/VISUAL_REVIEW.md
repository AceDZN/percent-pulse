# V2 visual comparison

24 October 2026. This review compares the saved imagegen targets with the actual interactive Three.js rebuild. The targets were generated, saved and inspected before the scene rewrite; their prompts and hashes are in [mockups/manifest.json](mockups/manifest.json), and the pre-implementation checkpoint is `b5e6471`. They are design references, not gameplay evidence.

## Comparable states

The primary production captures use **1672×941**, the same dimensions as the mockups. The adjacent JSON files record actual game state. The visual contributor also repeated the opening, clear and guided Pulse sequence in a fresh Chrome-channel production page at **1536×864**, using real keyboard/button inputs and deterministic time stepping, without inserting enemies or changing HP.

| Moment | Generated target | Actual production | Observed result |
| --- | --- | --- | --- |
| Opening | [opening.png](mockups/opening.png) | [opening.png](actual/opening.png), [state](actual/opening.json) | Large cyan player, quiet slate floor, magenta threats, corner shield display and movement-only instruction. Ordinary fire needs no aiming or attack click. There is no Pulse control in wave 1. |
| Percentage hit | [combat.png](mockups/combat.png) | [combat.png](actual/combat.png), [state](actual/combat.json) | Reused Tripo sentinel shows `72 / 96`; three skitters show 18. The actual receipt is `25% × 96 = 24`, `96 → 72`. One large Pulse control replaces the old weapon/dash/ammunition HUD. |
| Immediate clear | [clear.png](mockups/clear.png) | [clear.png](actual/clear.png), [state](actual/clear.json) | Last kill leaves no live enemies or hazards and immediately presents the next-wave action. The player's position remains the result of movement; it is not staged at the mockup's center. |

The camera is a stable 55° perspective view with 40° vertical FOV. The floor ellipse is 9 × 7 world units. In the desktop comparison, the hero is roughly 90–100 px tall and the ordinary anchor roughly 150 px across; those are visual estimates, not automated segmentation measurements. Current/max HP and skitter values are larger than the first implementation pass. The floor has enough contrast for cyan/magenta silhouettes without repeating the dense v1 grid.

## Pulse range and target selection

[The safe introduction](actual/pulse-intro.png) and [its state](actual/pulse-intro.json) show all four targets before the first Pulse. From the player at `(0, 3.3)`, their center distances are 4.8, 4.941, 4.941 and 5.131, all inside the 5.4 radius. The exact captured results are:

- Anchor: `96 − 25% × 96 = 72`.
- Three skitters: each `24 − 25% × 24 = 18`.

The shove then moves those centers to 6.6–6.931 units away. Their ground rings correctly return to pink; the white corner brackets continue to identify the stable automatic target. A mesh overlapping the expanding ring does not establish Pulse eligibility. The post-hit picture shows the displaced positions, while the receipt preserves the pre-hit HP base.

An earlier compiled production bundle still colored the selected target cyan outside Pulse range. The comparison caught that stale bundle. The fresh `index-BhY5GTRA.js` production pass used the exact center-distance ring branch and larger HP labels; both the visual contributor and independent QA rechecked it. Future builds may change that bundle filename.

## Screenshot-driven revisions

The scene iterations brought the camera closer, enlarged actor silhouettes, added the cyan hero backplate, replaced the busy floor with quieter stone cells, exposed the cyan rim seam, reduced background columns and added real directional shadows. Bolt streaks, Pulse expansion, whole-object recoil/stun, death shards and clear feedback use state supplied by gameplay. Warnings use the authoritative circular/lane geometry and are clipped visually to the platform. Reduced effects retains essential warning/target geometry while suppressing particles and extra motion.

Selection brackets and Pulse eligibility now have separate meanings. Enlarged HP labels and the target-adjacent actual-hit receipt make the mockup's mathematical moment legible. These revisions were checked through the installed develop-web-game action client, opened screenshots and state output; the fresh production scene sequence reported no console/page errors and confirmed the local Tripo GLB loaded. A sample 1536×864 Pulse frame recorded 152 draw calls and 43,764 triangles at DPR 1. This is rendering complexity for one frame, not an FPS claim.

## User's Chrome check

The contributor used only their owned Chrome preview tab, reloaded production and performed Start → floor click → automatic wave 1 clear → Next → Space on the focused Pulse control. The screenshot shows the resulting 72/96 anchor and three 18 HP skitters. Wave 2 subsequently cleared with all five shield segments.

- [User-Chrome wave 1 clear](actual/user-chrome-clear.jpg)
- [User-Chrome Space Pulse](actual/user-chrome-pulse.jpg)

These captures are 1728×780 and use normal browser UI inputs with real elapsed time, without the deterministic time hook. Native macOS app input was unavailable because the Mac was locked, so this is not a claim of OS-native key or focus testing. A body-level key action timed out; focusing the visible Pulse button and pressing Space succeeded. The observed log warnings/errors were from browser extensions, with no game-origin error observed in this sequence.

## Remaining visible differences

The reference has more sculpted, painted stone, luminous crystal pylons and finely finished characters. The implementation has flatter procedural stone cells, smaller dimmer pylons and simple geometric skitters. The cyan hero reads mainly from its armored back while it faces enemies; the shoulders are paler than the reference. The real generated anchor is a textured hovering sentinel with a static mesh, rather than the clean faceted reference shape or a rigged character. Its original Chrome-Tripo provenance and unchanged runtime hash remain in [ASSETS.md](../../ASSETS.md); v2 incurred no new model-generation spend.

The clear card can cover part of a hero who finishes at lower center; a player elsewhere stays visible, as in the primary actual capture. Celebration is brief and may already have faded in a later clear screenshot. The supplied mockups do not prescribe an exact final player position or particle frame.

The lead then increased camera distance on narrow screens and repeated directional edge movement. The visual contributor inspected the refreshed [390×844 phone edge](actual/portrait-edge.png), [768×1024 tablet edge](actual/tablet-edge.png), [phone Pulse](actual/qa-portrait-pulse.png), [tablet Pulse](actual/qa-tablet-pulse.png), [touch movement instruction](actual/qa-touch-coach.png) and [touch Pulse instruction](actual/qa-touch-pulse-intro.png). The sampled edge positions now retain the player's body in view; desktop framing stays unchanged. The phone tradeoff is visible: actors and world HP labels are considerably smaller than the desktop targets. The large Pulse control and separate receipt remain readable, but a phone gameplay/readability pass by a person is still needed. These refreshed captures supersede earlier narrow-screen images that clipped the movement edge.

This review establishes what was implemented and observed. It does not establish that the rebuilt game is enjoyable, balanced for its audience, or effective for learning; those require the owner's next play session and audience feedback.
