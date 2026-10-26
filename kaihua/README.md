# KAIHUA — A Walkable Image

An interactive, bilingual (English / Simplified Chinese) spatial study of the Northern Song murals at Kaihua Temple, Gaoping, Shanxi.

## What this prototype does

- First-person WebGL walkthrough, using click-to-lock mouse look + WASD/arrow keys; Esc unlocks the cursor, E examines a wall (touch drag + movement pad on mobile)
- A continuous guided camera route through the south entrance, around the central altar, and along the east, west and north wall zones
- Three-dimensional occlusion from the altar and columns (actual depth-tested occlusion, not a video transition)
- Floor-plan minimap, wall selection, context annotations
- Original / restored mural image comparison, activated **only** after real assets are added
- Method and source notes clearly distinguishing interpretation from surveyed fact

**Important:** The room is a spatial *schematic*, not a measured architectural survey. The default textures are labeled diagrams; none is represented as a historic mural. The implementation does NOT claim to run a SNAKE restoration model in the browser. The SNAKE reconstruction mentioned in the personal statement belongs to an offline research pipeline; its actual outputs should be linked to their source scans and uncertainty records.

## Add historical images

Place authorized image files in `assets/murals/` (ideally WebP / JPEG with reasonable dimensions for WebGL; start at 2048–4096 px wide). Then edit `assets/murals/manifest.json`:

```json
{
  "west": {"original":"./assets/murals/west-original.webp", "restored":"./assets/murals/west-restored.webp"},
  "east": {"original":null, "restored":null},
  "northWest": {"original":null, "restored":null},
  "northEast": {"original":null, "restored":null}
}
```

Use `original` for the photographed/scanned historic surface, `restored` for the documented digital reconstruction. Both files are required to display the before/after comparison. Each zone can be mapped to a verified measured position later; see `WALLS` in the inline module in `index.html`. If you have single-wide composites, image-to-zone clipping and UV positioning should be calibrated to the plan.

## Run locally

No npm or build step required. Use a local HTTP server (opening `index.html` directly from disk may block `fetch`):

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`. Three.js 0.180.0 is bundled in `assets/vendor/` with its MIT license; runtime CDN access is not required.

## Deploy with GitHub Pages

Files in this project may be placed in the `/kaihua` directory of a Pages repository. Set **Settings → Pages → Deploy from a branch → main → /(root)** if your Pages source has not already been configured. The project is relative-path safe: all files are referenced with `./` and work under `/kaihua/`.

If you use a dedicated repository, place the files at the repository root and select that branch as the Pages publishing source.

## Research and evidence

- Gaoping Municipal Government: https://www.sxgp.gov.cn/zjgp/fjms_425/202511/t20251128_2291193.shtml
- Palace Museum study: https://www.dpm.org.cn/Uploads/File/pdf/bc/8d/f2/bc8df23f990313c46d94ffd7e84bc56f.pdf
- Peking University Museum exhibition: https://www.amsm.pku.edu.cn/info/1038/1193.htm

The prototype follows the broad east / west / north mural organization, central altar, pillars and doors described in published accounts. It must not be used as archaeological proof of exact dimensions, pillar positions, sightline measurements or individual panel alignments. Historic images must be licensed or used with permission prior to public deployment.

## Technical architecture

- JavaScript modules + Three.js 0.180.0 via local import map
- Three.js primitive architecture, Lambertian/standard materials, procedural **diagram textures**
- Client-side raycasting, collisions, Catmull-Rom camera pathway, UI overlays
- GitHub Pages static hosting (no backend, no user tracking)

Built as an expandable undergraduate art/design research prototype rather than a reproduction of an existing virtual exhibition.

## First-person controls (v1.1)

- Enter the Hall requests Pointer Lock from the browser. If needed, click the 3D canvas again.
- Moving the mouse turns the camera **without holding a mouse button**; Escape unlocks it so menus can be used.
- W moves horizontally in the camera's forward direction, S backward, and A/D sidestep relative to the camera.
- E or a click examines the wall at the crosshair. Esc releases the cursor.
- Opening a menu or starting a guided tour releases the cursor. During the guided tour, the manual view direction stays synchronized so switching back to walking does not reverse movement.
- On touch screens, dragging to look around remains available.

## V1.2 — Spatial-viewing study

The hall is a **research prototype**, not a measured restoration and not an affiliate of Harvard CAMLab.

- The SVG floor plan uses the same x/z world-coordinate mapping as the Three.js scene. The dot and heading rotate with the camera.
- Four numbered research positions correspond to the actual south entrance, west aisle, north turn, and east aisle in the scene. Click them on the plan (after pressing Esc to unlock the cursor) or press `1`–`4` at any time in walk mode.
- The guided route line is rendered from the same Catmull–Rom camera path used in the hall. A separate smoothly interpolated focus curve prevents abrupt gaze changes between walls.
- The wall interaction is occlusion-aware: raycasting checks physical columns and solid altar volumes before allowing an archive view, and explains why a mural can be out of sight. This is **modelled geometry only**, not an archaeological claim that a specific image had exactly that visibility in the original hall.
- Schematic wall textures are nonfigurative until verifiable, appropriately licensed digital scans are supplied through `assets/murals/manifest.json`.
- Independent reference: [Harvard FAS CAMLab — Digital Temple](https://camlab.fas.harvard.edu/project/digital-temple/). Harvard's images, models and written content are not incorporated in this repository.

### Quality checks
The inline JavaScript module was syntax-checked. The four observation stations were checked against the simplified collision boundaries and the world-to-plan mapping; their forward directions align with the W-key movement vector. Browser-level interaction and GitHub Pages propagation still require verification on a real client.

## V1.3 — Full-screen mural detail, retaining 3D wall interaction

The archive and evidence interface now occupies the **entire viewport**; the right sidebar is removed.

- **During hall exploration**, click a visible mural plane or press `E` while aiming at it. A shared raycast opens the full-screen details for that exact wall section.
- The raycast checks the existing solid columns and altar for obstructions: clicking a mural behind a pillar does not bypass the geometry.
- Full-screen detail includes the selected wall title, theme, archival note and a source/restoration comparison that activates only when real files are provided.
- Tabs inside the full-screen detail switch wall sections. The "View this wall in the hall" button travels to a relevant hall location.
- **Back to the hall** (or `Escape`) closes the detail and returns to the saved camera position and orientation. The browser cursor is released while reading; click the hall again to resume mouse look.
- Touchscreen taps raycast from the tapped screen coordinates; drag gestures still rotate the camera.
- The schematic architectural model and unsupplied historical images are still labelled as such.

Latest checks: JavaScript source parses, all primary wall-entry paths call the shared occlusion-aware hit test, and the CSS/markup expand to 100% viewport width. Full interactive browser testing and GitHub Pages propagation remain unverified.

## V1.4 — Reliability fixes and published photograph references

Four CC BY 4.0 published photo crops are included and listed in `assets/murals/manifest.json`. Open `assets/murals/index.html` for full credits, license links, processing notes, and attribution uncertainties. The sources call these Kaihua Song murals; the 2018 source has a conflicting Taiyuan geographic description. These samples are explicitly illustrative: their original wall locations and relationship to the wall themes are unverified. Do not use them as a surveyed Gaoping reconstruction. No restored images are supplied.

Original-only images now appear in the archive; asynchronous image completion updates the open viewer. The historic image remains on the 3D wall if a restoration pair is later supplied. Photo aspect ratios are preserved. Fixed comparison labels, language switching after the loading element is removed, drag/tap separation, secondary pointers, keyboard controls on interactive elements, guide/reset movement clearing, navigation highlighting, the raycast crosshair alignment, and short-screen intro clipping. WebGL initialization failures show a static image-records link that also works if the module cannot start. Three.js is bundled locally.

## V1.5 — Reference-guided hall geometry

The hall now follows the four user-provided facade and interior reference photographs at a schematic level. Model implementation is in `assets/hall.js`. It replaces the flat beam grid with a raised roof, closely spaced rafters, purlins, simplified bracket sets, and a grey tiled outer roof with an east-west ridge and lifted eaves. The south facade has a central entrance and two barred windows. Weathered timber, brick podiums under the posts, stone paving, and muted painted friezes replace the previous plain primitives.

A red-topped masonry altar carries a simplified seated Buddha, lotus pedestal and layered canopy. The sculpture, painted motifs, roof curvature and bracket assemblies are procedural interpretations; they are not scans or measured historic joinery. Published mural reference samples and their existing attribution limitations remain unchanged.

Collision footprints now include the square column podiums and altar clearance; their plan footprints are generated from the same model. The tour's final approach was moved outward to clear the larger podium. Rear mural planes now sit against the rear wall. The statue and architecture participate in sightline occlusion. Neutral front-window daylight replaces the previous green cast; touch devices use a smaller shadow map.

### Browser regression checks

Serve the repository root with `python -m http.server 8080 --bind 127.0.0.1`. In a separate tool environment install Playwright (`npm install playwright`, `npx playwright install chromium`) and run `node kaihua/tests/browser.cjs`. Set `CHROME_PATH` to use an installed Chrome instead of the downloaded browser, and `KAIHUA_TEST_URL` to test another server path. The test runner must be able to resolve the Playwright package. It injects its test API into the HTTP response only; the production page exports no debug state.

Checks cover original-only images, late-image updates, missing images, paired comparison, language switching, keyboard/pointer inspection, focus handling, 1,001 tour-path samples, square podium/altar collisions, sculpture occlusion, WebGL failure/static fallback, and a 390-pixel mobile archive layout. Desktop reference renders were visually checked from the entrance, side aisle and facade.

## V1.6 — Stable paving, open corners and worn surface materials

The flickering paving was a geometry bug: both the masonry plinth and the top of the thin paving box ended at y=0. The paving is now one upward-facing plane at y=0, and the structural plinth ends at y=-0.09. No displacement or polygon-offset workaround is used. Thirty downward ray samples verify the separated surfaces.

Removed the two extra interior corner posts at (+/-5.20, 4.8), including their podiums, collision footprints and generated plan symbols. Four interior posts remain around the altar. Exterior facade posts remain outside the south wall.

Generic CC0 scans from Poly Haven replace the line-drawn wood and repeated flat brick graphics. Diffuse, OpenGL normal and roughness maps are bundled locally; credits and source links are in assets/materials/CREDITS.md. The source JPGs are unchanged. Runtime materials lower saturation, calibrate dusty-grey albedo, set world-scale masonry UVs and use restrained normal strength. Stone caps are thinner, plaster has subtle weathering, the red altar top has a cloth weave, and window daylight is less yellow and less harsh. These generic surface scans are not site documentation. The Buddha and the mural reference samples remain simplified and are not presented as photographic reconstruction.

The loading overlay waits for local material readiness (with a five-second fallback). Browser checks now include four-post/minimap consistency, clear corner collisions, separated floor geometry, loaded material maps, and shader errors. A visual check swept 60 moving views around the reported side aisle.

## V1.7 — Stable manual look across browser transitions

Reproduced three independent sudden-turn paths in the previous controls: stale drag coordinates after window blur produced a 206-degree turn, an 1800-pixel pointer-lock packet produced a 227-degree turn, and an ArrowLeft update after a three-second frame gap produced a 213-degree turn. The same reproduction now produces 0, 0, and about 3.55 degrees respectively.

Manual pointer input now lives in assets/look-controls.js. Focus, tab visibility, pointer capture/lock, fullscreen, resize, archive and observation-point transitions invalidate old gestures and queued deltas. The first locked mouse packet is rebased; non-finite and screen-width outliers are discarded. Ordinary packets accumulate until a render frame, with a time-based turn-rate bound and an absolute 0.25-radian per-axis frame cap. Excess input is dropped rather than replayed after a stall. Walking and keyboard turning share a bounded frame delta. Manual takeover preserves the current guided camera orientation and position. Pointer-lock requests are deduplicated while a request is pending.

Run the dependency-free input lifecycle tests with `node --test kaihua/tests/look-controls.test.mjs`. The Chrome/Playwright suite also checks blur/focus, overlay interruption, pointer-lock warp and burst packets, long-frame keyboard turning, and guide-to-manual handoff. Synthetic browser packets exercise the event handling; hardware-specific cursor behavior may differ. Existing model, material and archive checks remain in the same suite.
