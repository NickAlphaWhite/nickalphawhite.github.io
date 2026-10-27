# Golden Buddha

`golden-buddha.glb` is the web copy of the user-provided `Meshy_AI_Golden_Buddha_of_the__1027072003_texture.glb`. The original in Downloads is left untouched; its SHA-256 and the processing report are in `golden-buddha.json`.

The geometry remains 196,618 triangles in one mesh. Embedded colour uses a 2048px WebP; normal and packed metallic/roughness use 1024px WebP. The result is 7,485,944 bytes, compared with the original 12,420,700 bytes. No decoder or image-platform service is needed at runtime.

To regenerate from the original:

```powershell
npm run prepare:buddha -- 'C:/path/to/source.glb'
```

`../buddha.js` loads it once, on first entry to the hall, keeps its proportions, and seats the included lotus base on the existing altar. A local procedural reflection environment is applied only to the statue material. This supplied AI model replaces the previous schematic figure; it is not a site scan. Architecture, altar collision and mural placement are unchanged.

The GLTFLoader, BufferGeometryUtils and RoomEnvironment helpers under `../vendor` are Three.js r180, matching the existing core, covered by `../vendor/THREE-LICENSE.txt`.
