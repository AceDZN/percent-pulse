# Asset provenance

## Pulse sentinel — generated and imported

- Created by this game's dedicated visual contributor through the user's existing Chrome Tripo session, in a new **⚡ Percent Pulse art** tab. No provider API or token was used.
- Task ID: `7b752222-eb1d-420c-9a7f-7c9c7275746d`
- Task page: https://studio.tripo3d.ai/workspace/generate/7b752222-eb1d-420c-9a7f-7c9c7275746d
- Generation date: 24 October 2026.
- Normal generation: H3.1 – Best Quality, Geometry & Texture, no parts or 8K add-on.
- Displayed submit cost: **45 credits**. One normal generation submitted. Global account balance is not attributed spend.
- Import target: `public/models/pulse-sentinel.glb`, visible on anchor enemies; mathematical/collision surfaces remain procedural and state-driven.

Exact prompt:

> A single original neon arena sentinel for a bold cel-shaded top-down 3D action game. Compact hovering angular armored combat drone, strong diamond silhouette, charcoal black ceramic body, vivid magenta enamel armor plates, one bright pale pink triangular central eye, two swept wing-like shoulder blades, no human face, no hands, no legs, no wheels, no pedestal, no background, no text. Hard-edged low-poly faceted surfaces, clean thick shapes and clear readable silhouette from above, symmetrical design, premium stylized game art, physically coherent single connected object. Front points toward camera, full isolated object.

Normal UI export: Export → GLB → 1K textures → file name `percent-pulse-sentinel`. The ordinary download completed in Chrome. The original is not bundled because its geometry is unnecessarily dense.

| Property | Normal export | Runtime model |
| --- | ---: | ---: |
| Size | 30,171,256 bytes | 2,367,328 bytes |
| Triangles | 953,215 | 35,988 |
| Vertices | 567,716 | 49,550 |
| SHA-256 | `51e3ce0601fcedc46f13a60b2c740db39bd71b00906d56ade5fbe508b6f5c549` | `c204f662f5493683fe81cca2515a20483ff49e6c08a7f4f40418353d4b8a2131` |

Processing used glTF Transform CLI 4.5.1 and the already installed Blender 5.2.0 LTS:

```sh
npx --yes @gltf-transform/cli weld percent-pulse-sentinel.glb sentinel-welded.glb
npx --yes @gltf-transform/cli simplify sentinel-welded.glb sentinel-simplified.glb --ratio 0.03 --error 0.1 --lock-border false
```

The simplifier stopped at 89,992 triangles because of UV boundaries. Blender then imported the simplified GLB, applied a Decimate modifier with ratio `0.4`, and exported an ordinary GLB with `export_apply=True`, `export_image_format="AUTO"`. Intermediate files were removed. No compression extension, decoder, skin, armature, or animation is required. The three normal/base-color/metallic-roughness textures remain local at 1K; the exported source had under 600 KB of compressed texture data.

The scene pitches the originally vertical face skyward and places it above the procedural anchor ring. The v2 rebuild normalizes the longest dimension to 2.8 world units, with a separate final-boss visual scale. Generated bounds never control damage, hit tests, telegraph widths, or targeting. Mesh loading reports its actual outcome in `render_game_to_text`; the generated model replaces the anchor placeholder when loaded.

License evidence: the Chrome account selector visibly showed **Pro** at generation/export time. The [official Tripo commercial-use guide](https://www.tripo3d.ai/help/privacy-policy/how-to-use-tripo-models-commercially) describes paid-user use, modification, and distribution rights; the [authoritative terms](https://www.tripo3d.ai/terms) govern the asset. The generation used the displayed **Sharing Only** setting. This repository does not claim the output is public domain or independently relicense third-party service terms. No other artist's character or reference artwork was supplied.

No signed URLs, credentials, personal account details, or browser state are bundled.

## Procedural art

Arena, five-sided cyan player, fast triangular skitter enemies, rings, hazard surfaces, beams, reticle, and HP labels are original Three.js geometry authored for this game. Arena bounds and telegraph measurements use gameplay state, never generated mesh bounds. No rig is claimed; generated enemies float and rotate as whole objects.

## Art direction

Visual thesis: charcoal stone and bold faceted neon armor in a floating ring amphitheatre. Cyan identifies the player and Bolt, magenta identifies hostile geometry, and warm pale highlights identify the skitter eye. Shapes and distinct motion reinforce color cues.

Content plan: one full-canvas playable arena; HUD stays with the gameplay owner. The action plane is quiet and the arena trim provides orientation. Interaction motion: directional facing, bounded shallow camera follow, enemy hover and telegraph charging. Reduced effects removes hover and smooth camera motion.

## V1 gameplay target and implementation breakdown (historical)

The generated image at `docs/visual-targets/gameplay-v1.png` is a **design reference, not a build screenshot**. Its prompt and correction are saved beside it. It arrived after this one normal Tripo task was already submitted; no retroactive claim of image-first generation is made. The crew inspected the new reference, retained the compatible magenta sentinel, and rebuilt the scene to match its composition without submitting another paid generation.

| Reference element | Actual implementation |
| --- | --- |
| Elevated combat camera | Perspective camera about 55° above the floor; desktop distance 34; aspect-aware fit and shallow follow preserve pointer projection. |
| Circular stone amphitheatre | An ellipse with radii 17×12, beveled stone slab sectors, deterministic local grain/cracks, and a tapered floating foundation. Four merged material batches keep floor draw calls low. |
| Low perimeter and pink channels | 44 low stone crenellations; three procedural ellipse channels; 14 dark pylons with magenta four-sided crystals. |
| Floating blue-black architecture | 34 faceted columns outside play, with occasional magenta channels. Foreground columns stay below the floor sightline. |
| Agile cyan combatant | Original angular humanoid chest, shoulder wings, legs, visor and weapon; cyan saturation is tuned to remain cyan under cel lighting. |
| Large magenta anchor | The actual Chrome-generated sentinel above a 1.25-radius targeting ring, with two compact procedural stone forearms. Generated width is normalized to 2.5 units. |
| Pointed skitter | Original triangular/core mesh with four angled legs and a contrasting eye; its rendered targeting ring has radius 0.72. Independent targeting code applies a 0.82 side tolerance as a small aiming allowance. |
| Ground sweep arc | Exact RingGeometry span `0.85π`, radial interval `radius±width/2`, heading `atan2(dx,dz)`; strip/disc warnings remain supported. Fragments are clipped to the ellipse floor without changing authoritative collision. |
| Cyan trail / magenta percentage impact | State-driven short beams and shrinking octahedral impact accents. The lead owns receipts and HUD placement. |
| Current/max HP | World-space anchor label such as `72 / 96`; full skitter label `18 HP`; bar ratio uses actual current/max state. |

Known fidelity limits: the static generated anchor is a hovering armored sentinel rather than the target's rigged hulking humanoid. The procedural player and skitter have simplified silhouettes. Floor detail is geometric/procedural rather than a painted rock texture. These are visible implementation differences, not claims of a pixel-identical reconstruction.

## V2 rebuild — mockups before source changes

The owner rejected v1's controls, pacing, and readability and requested a full replan. The three new imagegen references in `docs/rebuild-v2/mockups/` — `opening.png`, `combat.png`, and `clear.png` — were generated, saved, and visually inspected **before the v2 scene rewrite**. Exact prompts and a manifest are adjacent; `docs/rebuild-v2/PLAN.md` defines the revised game flow. The lead recorded the mockup checkpoint as `b5e6471`. These images remain generated design references, not gameplay captures.

The visual contributor inspected all three actual images, then rebuilt `src/scene.ts` around them:

- Compact **9×7** ellipse floor and a stable **55°** perspective camera, with a starting desktop distance of **20** and **40°** vertical FOV. Aspect-aware framing and camera-relative fog preserve visibility on smaller screens.
- Quiet irregular Voronoi stone slabs, cyan perimeter seam, low slate rim, four dim pink crystal pylons, and sparse blue-void columns. Three merged slab batches and locally generated grain replace the earlier busy concentric floor.
- Larger cyan armored duelist with simple grouped arm/leg motion, lean while moving, ground contact, directional lighting and real shadow mapping. These are procedural transforms, not a claimed skeletal rig.
- Reused, unchanged Chrome/Tripo GLB for large anchors; procedural angular skitters have a central eye and four legs. Actor screen sizes will be checked against the mockups in actual browser captures.
- One white corner bracket identifies the stable automatic target. Enemy ground rings indicate exact center inclusion in the **5.4-unit** Pulse radius; decorative mesh overlap does not determine whether Pulse hits.
- Cyan expanding Pulse ring and fill, target recoil/stun motion, short automatic-shot streaks, death shards and spawn markers. Reduced effects suppresses particles, flashes and walking/lean animation while retaining essential targeting/warnings.
- Warm circular and lane warnings use the authoritative radius, width, center and heading. Warning fragments are visually clipped to the floor ellipse; this does not change collision state.

No further Tripo generations, credits, API calls, or downloaded assets were used for v2. The runtime GLB bytes and hash above are unchanged. The lead owns the new HUD, mathematical rules and final state-to-image comparison; the scene's effects remain subordinate to those rules.
