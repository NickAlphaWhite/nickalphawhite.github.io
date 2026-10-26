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

Use `original` for the photographed/scanned historic surface, `restored` for the documented digital reconstruction. Both files are required to display the before/after comparison. Each zone can be mapped to a verified measured position later; see `WALLS` in `main.js`. If you have single-wide composites, image-to-zone clipping and UV positioning should be calibrated to the plan.

## Run locally

No npm or build step required. Use a local HTTP server (opening `index.html` directly from disk may block `fetch`):

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`. The browser needs network access to the pinned Three.js package CDN.

## Deploy with GitHub Pages

Files in this project may be placed in the `/kaihua` directory of a Pages repository. Set **Settings → Pages → Deploy from a branch → main → /(root)** if your Pages source has not already been configured. The project is relative-path safe: all files are referenced with `./` and work under `/kaihua/`.

If you use a dedicated repository, place the files at the repository root and select that branch as the Pages publishing source.

## Research and evidence

- Gaoping Municipal Government: https://www.sxgp.gov.cn/zjgp/fjms_425/202511/t20251128_2291193.shtml
- Palace Museum study: https://www.dpm.org.cn/Uploads/File/pdf/bc/8d/f2/bc8df23f990313c46d94ffd7e84bc56f.pdf
- Peking University Museum exhibition: https://www.amsm.pku.edu.cn/info/1038/1193.htm

The prototype follows the broad east / west / north mural organization, central altar, pillars and doors described in published accounts. It must not be used as archaeological proof of exact dimensions, pillar positions, sightline measurements or individual panel alignments. Historic images must be licensed or used with permission prior to public deployment.

## Technical architecture

- JavaScript modules + Three.js 0.180.0 via import map
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
