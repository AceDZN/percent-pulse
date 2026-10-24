# Five distinct math games — builder crew agreement

24 October 2026. This is the newly authorized portfolio: Scale Shift, Percent Pulse, Hypotenuse Rush, Ringwarden, Equal & Opposite. Read your game-specific BUILD_HANDOFF.md before building.

## Latest human authorization — give this verbatim to every crew member

The user approved these five new directions: “the new ideas sounds pretty god - let's start developing those ideas, each game gets a builder crew of its own”. They then added:

```text
Don't forget to build it as a real 3d fun game. use my chrome browser tripo.ai to create the 3d models ([https://studio.tripo3d.ai/workspace/generate/](https://studio.tripo3d.ai/workspace/generate/) ).
btw,create it as a new public repo on my github (AceDZN). I think that I'll deploy it to one of our vercel servers soon because its pretty fun.. you can use my chrome browser for that as well . don't forget to commit your changes from time to time all to the same main branch for now (or open prs for side-tracks)
```

This authorizes new development, Chrome/Tripo model generation, a separate public GitHub repository per game under AceDZN and periodic commits/pushes on main. It supersedes the build hold for these five new games only. It does not reactivate canceled prototypes or their briefs. Build to a working tested slice now; no further kickoff confirmation is required. Prepare a Vercel-compatible static build and deployment instructions. The user plans to choose a Vercel destination later; no deployment is requested for this kickoff.

## Independent crew and repository

Each new builder chat is the lead of one independent crew. The human explicitly requested crews: delegate real work using collaboration agents rather than treating this as a solo scaffold. Keep the lead plus up to three parallel roles, with clear file ownership:

1. **Gameplay/rules builder:** pure game state, numerical model, inputs, win/fail and representative content. May be the lead if the lead needs to integrate continuously.
2. **Visual/Tripo builder:** your game's own art direction, 3D scene/lighting, models made through Chrome Tripo, animation, camera, sound and asset provenance. Own a separate render/assets area; coordinate the state interface before concurrent edits.
3. **Independent math/playability reviewer:** check the actual curriculum/rules, observe a real play sequence, find bypasses or misconceptions, test recovery and changed situations. Initially review the handoff/test witnesses; later inspect implementation and screenshots. Do not let this role claim human fun or learning gains from automation.

The lead integrates and owns completion. If using three helper agents, give the extra helper a bounded content or interaction task rather than duplicate ownership. Communicate with your own crew, not other user-owned chats. No automatic cross-chat messaging is needed. Do not add co-author or generated-by trailers.

The lead is the Git/index owner. Helpers contribute to assigned files and report changes; the lead serializes commits/pushes on main so simultaneous agents do not race on the index. Give every helper the exact human instruction above and your game identity. At least the visual/Tripo and independent QA roles must receive actual delegated work; naming imaginary team members in a plan does not constitute a crew.

| Game | Standalone repository directory | GitHub repository | Dev / preview ports |
|---|---|---|---|
| Scale Shift | /Users/acedzn/dev/AceDZN-exp/scale-shift | AceDZN/scale-shift | 5181 / 4181 |
| Percent Pulse | /Users/acedzn/dev/AceDZN-exp/percent-pulse | AceDZN/percent-pulse | 5182 / 4182 |
| Hypotenuse Rush | /Users/acedzn/dev/AceDZN-exp/hypotenuse-rush | AceDZN/hypotenuse-rush | 5183 / 4183 |
| Ringwarden | /Users/acedzn/dev/AceDZN-exp/ringwarden | AceDZN/ringwarden | 5184 / 4184 |
| Equal & Opposite | /Users/acedzn/dev/AceDZN-exp/equal-and-opposite | AceDZN/equal-and-opposite | 5185 / 4185 |

Root prepares each new repository and its first main commit before dispatch. Inspect your assigned directory, origin and branch, then reuse the prepared repo. Do not create a duplicate. If creation was interrupted, inspect actual state and recover the same target, never change visibility or overwrite an unrelated existing repo. The GitHub connector lacks repository-creation capability; authenticated gh CLI is the authorized fallback. Never print or store authentication tokens. Root has checked that the CLI account is AceDZN.

Work and commit only inside your standalone repo. The Idea Plotter checkout supplies read-only handoff/curriculum context, not the game source or Git index. Do not modify its spec/, STATUS.md, QUESTIONS.md, web/, data/ or any prototype; do not copy its history or .env files into the public repo. Other game folders and projects are outside your scope. Use strictPort and never kill a process you did not start. Record an actually free alternate port if your assigned one becomes occupied.

Commit meaningful checkpoints to the same main branch and push regularly. For a truly separate side-track, a branch/PR is allowed; if you create a PR, attach it with the app's attach_artifact tool. No forced pushes, unrelated repo changes, automatic merges or public deployment are required. README must say what is implemented versus still planned. An initial handoff commit is not a completed game.

## Distinct gameplay is a delivery requirement

The canceled portfolio repeatedly became “move a small robot/vehicle, collect or retrieve an object, take it somewhere” with the same toy-industrial diorama. Do not reuse that loop, visual language, character, code scaffold, camera or mission-selection UI.

Your required primary decisions are defined in the specific handoff. They differ across these five: proportional fit, attack value, grapple reachability, circular coverage allocation and equivalence-preserving card operations. Keep the time structure and controls appropriate to your genre. Do not flatten them into the same five levels or delivery stations. Before coding write a one-page GAME_IDENTITY.md: core verbs without theme words; a 60-second action/consequence sequence; player decision; changing state; failure/recovery; win; camera; silhouette/material/palette; animation and sound. Compare it with the portfolio table below. This is a crew review checkpoint you can resolve autonomously, not a new user approval flow.

| Game | Signature loop | Camera / art |
|---|---|---|
| Scale Shift | manipulate scale, test clearance, discover a route | first person; monumental concrete/light/shadow |
| Percent Pulse | dodge, aim, spend flat/percentage attacks, survive | dynamic arena view; bold cel shading/neon combat |
| Hypotenuse Rush | choose anchor, launch, steer momentum, chain traversal | athletic third person; open red-rock cliffs |
| Ringwarden | place zones, allocate two materials, defend, revise | high strategic camera; illustrated botanical fortification |
| Equal & Opposite | play operations, cancel terms, manage hand, win a duel | deliberate 3D tabletop; paper/ink/folding runes |

If your implementation drifts into another game's signature loop, correct it before adding content. Functional behavior and screenshot evidence must support the claimed distinction. A new name, prop or curriculum label is insufficient. Do not reuse old toy/courier models to dictate these designs.

## Real 3D and browser delivery

Use TypeScript, Vite and Three.js (or an explicitly justified real 3D engine) with one main WebGL canvas. The scene needs actual depth, lighting, meshes, occlusion, camera and interactions. A 2D worksheet, card grid DOM overlay or model viewer is not a game. Mathematical surfaces/colliders must agree with authoritative state. Real 3D tabletop games need tangible 3D pieces, camera/depth and spatial animations, not screenshots of cards on a webpage.

Keep rules independent of rendering. Use fixed simulation steps and bounded updates, restore input on focus loss, handle pause/retry and resize without resetting progress or camera. Keyboard and pointer are required; make a meaningful touch/tablet control scheme for the genre rather than just shrinking desktop UI. Preserve a clear focus state, reduced motion, mute and color-independent cues. Fullscreen f/Esc must resize inputs correctly. WebGL failure shows an actionable message. Cap DPR and costly effects; measure actual frame behavior and bundle size, never invent FPS.

A finite, polished first slice should offer about 5–10 minutes of actual play and immediate first-minute agency. Content structure is game-specific: chambers, waves, courses, defended scenarios or duels. Include a changed situation without automatic answers/hints to test transfer. Do not expand until the first complete interaction is legible and enjoyable to test. Automation can verify rules and usability, not prove enjoyment.

Bundle all runtime assets locally. A static npm run build must work without a backend, authentication, AI provider, API key, remote font/model fetch or microphone. Use a relative Vite base. Commit a lockfile and document npm install/dev/build/preview. Vercel readiness means the verified static dist output and suitable configuration/instructions, not an invented deployment URL.

## Models: use the user's Chrome Tripo session

Generate the art that your game needs through https://studio.tripo3d.ai/workspace/generate/ in the user's Chrome. Use the available cua_repl browser tools, with a dedicated new Chrome tab/session named for your game. The visual/asset role is the sole owner of that tab; other crew members do not drive it. Never navigate, refresh or claim another crew's Tripo tab. Normal existing-session login may be used; report a real login/CAPTCHA/credit blocker and keep useful rule work moving. Never bypass a security boundary.

Start with one or two strong models that establish your own identity. Initial budget: at most two normal model generations per game, using existing credits. Log the displayed cost for each task and the task ID; other crews can alter the global balance, so account deltas alone are not attributed spend. Do not buy credits, upgrade, accept a new plan, use API endpoints/tokens, or silently substitute another generator. Ask the human only if a real external prerequisite blocks required work.

Download GLB through the normal UI, optimize to an appropriate browser mesh/texture size and use it in actual gameplay. Preserve task URL, exact prompt, observed credit cost, original/processed hashes, processing commands, provenance and applicable license notes in ASSETS.md. Do not publish credentials, signed download URLs, browser state or unrelated files. Check geometry/materials/load, scale, facing, normal maps, bounds and shadows. Generated models are not trusted colliders, rigs or mathematical surfaces. Static combined meshes can be animated as whole objects; do not claim a rig that is absent. Exact circles, rulers, collision planes, typography and scientific indicators are appropriately procedural. A placeholder blockout is useful early but not a substitute for the required final Tripo art.

## Workbook math and Hebrew

The user owns Workbook and supplied https://math.workbook.co.il/grade-8. The actual public curriculum snapshots are read-only at /Users/acedzn/idea-plotter/reports/math-games-2026-10-24/curriculum/. Your brief names the relevant modules. Use Workbook connector discovery for additional content, never invent IDs/routes. Circle formulas are specifically retrieved from grade-7 chapter8 and applied in grade8 cylinder material; label that prerequisite honestly. CURRICULUM.md must link exact sources and map each relevant game action to its mathematical relationship and a misconception check. Your fictional setting/examples are newly authored, not quoted Workbook content.

Default learner UI is Hebrew with lang=he and dir=rtl. Isolate numbers, formulas, symbols and units in LTR spans; inspect actual mixed-direction screenshots. Bundle the font. Use the right terms (יחס, פרופורציה, קנה מידה, אחוז, ניצב, יתר, רדיוס, קוטר, היקף, שטח, אגף, נעלם). Never infer a physical measurement from perspective or decorative model volume. Correct numerical relationships must control actual game consequences, not just labels. Define units, rounding and tolerances; avoid hidden approximations changing a valid result.

Anonymous local event traces can record scenario/version, relevant quantities, action/outcome, hint use and retries. No student identifiers, analytics or external transmission. Distinguish first unaided decisions from repeated success or hinted success. A final local summary may report observed actions, not claim mastered math or proven learning gains. Do not add a typed-answer quiz to unlock unrelated movement.

## Verification and finish

Read and apply /Users/acedzn/.codex/skills/develop-web-game/SKILL.md and /Users/acedzn/.codex/skills/frontend-skill/SKILL.md. Announce skill use. Initialize progress.md with the user's original request and exact added instruction above. Use the installed web-game Playwright action client /Users/acedzn/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js after meaningful iterations; supplement only where that client cannot express a required interaction. Inspect actual screenshots, text state and console errors past the title screen. Use cua_repl for direct browser/computer interaction. Never test by injecting a win state.

Expose window.render_game_to_text() with coordinate convention, meaningful visible state, core math quantities, resources, action effects and win/failure reason; expose deterministic window.advanceTime(ms). The test hook must actually advance all relevant simulation and respect pause. Test important multi-step success, mistake/recovery, restart, changed challenge, input methods, camera preservation, resizing, malformed saved state, actual Tripo loading and production preview. Domain tests need witness solutions and meaningful counterexamples, including the math edge cases in your brief.

Deliver README, GAME_IDENTITY.md, progress.md, ASSETS.md, CURRICULUM.md, PLAYTEST.md, tests and a representative actual gameplay screenshot. Report the verified local URL, public GitHub URL, main commit, build/check results and real limitations directly in your builder chat. Leave your own server running. Do not stop at a plan, scaffold, title screen or asset showcase. Root’s earlier Steam G1/G2 remain pending and no formal novelty acceptance is inferred; those research gates do not block these directly requested experiments.
