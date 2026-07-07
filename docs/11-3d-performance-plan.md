# 11 — 3D board performance plan (instancing + interactivity consolidation)

Prepared 2026-07-07 by reading the actual component tree on `master` (`Scene.svelte` →
`Cube.svelte` → 512× `innerMash.svelte` → `CubeStatus.svelte` + `innerCube.svelte` →
`Piece.svelte`) and the installed `@threlte/core@7.0.2` / `@threlte/extras@7.5.3` sources
in `node_modules`. Every claim below was verified against that code, including two
corrections to the initial diagnosis (see [What's confirmed vs. corrected](#whats-confirmed-vs-corrected)).

> **Status:** proposed, no code changed. Companion to doc 10 (Svelte 5 + Threlte 8
> migration). **Sequencing verdict up front:** do doc 10's Phases 0–1 first (they're
> genuinely smooth), then this perf work **before** doc 10's Phase 2 — the perf refactor
> deletes most of the code that makes Phase 2 "High effort / Medium-High risk".
> Full reasoning in [Sequencing vs. doc 10](#sequencing-vs-doc-10).

## What's confirmed vs. corrected

Verified against `src/` and the installed Threlte sources:

**Confirmed — the two real killers:**

1. **1,024 `interactivity()` calls.** `innerMash.svelte:8` calls it once per cell (×512)
   and `Piece.svelte:25` once per piece component (×512 — see item 3). Verified in
   `@threlte/extras/dist/interactivity/index.js`: *each call* constructs its own
   `new Raycaster()`, its own context, and `setupInteractivity.js` registers its own
   pointer listeners on the canvas. Every `pointermove` therefore runs ~1,024 raycast
   passes. This is the CPU death on hover, exactly as suspected.

2. **512 `Piece.svelte` mounts regardless of occupancy.** `innerCube.svelte` is rendered
   for *every* cell and unconditionally mounts `<Piece>` — even for the ~480 empty cells.
   Each mount subscribes to the gltf async store, renders `<T is={ref}>` + `{#await}` +
   `<Align auto>` (which walks the subtree computing bounding boxes on mount). Only
   `Pieces.svelte` inside is conditional on `cell.piece`.

**Corrected — two parts of the original diagnosis that the code contradicts:**

3. **The 4.5MB GLB is *not* parsed 512 times.** `useGltf` → `useLoader` caches by URL
   per Canvas (`@threlte/core/dist/lib/cache.js`, keyed on `threlte-cache` context), and
   the `buildSceneGraph` transform runs inside the cached `load`. One fetch, one parse.
   The per-piece cost is the 512 component mounts, async subscriptions, and `Align auto`
   passes — still worth hoisting, but it's component overhead, not re-parsing.

4. **The postprocessing passes are not running.** `src/lib/effects/Glow.svelte` and
   `Glitch.svelte` are imported **nowhere** (`grep -rn "Glow\|Glitch" src` outside
   `src/lib/effects` is empty). There is no full-screen bloom/glitch cost to disable —
   they're dead code shipping a dead `postprocessing` dependency (`package.json`, plus
   `ssr.noExternal` in `vite.config.ts`). Cleanup, not perf.

**Also confirmed, secondary:**

- **Per-cell draw calls:** each of the 512 cells owns a `LineSegments` +
  `EdgesGeometry(new BoxGeometry(...))` (512 separate geometries for identical wireframes,
  `innerMash.svelte:18-22`) plus `CubeStatus`'s meshes. `CubeStatus.svelte:101-104` even
  has a stray `<T.Mesh>` with no geometry and a dangling `<T.MeshBasicMaterial>` — dead
  objects, ×512. Scene-graph traversal + matrix updates on ~2,500 objects every frame,
  and on the order of 1,000+ draw calls when highlight boxes are active.
- **512 per-cell `tweened` stores** (`CubeStatus.svelte:40`) exist and tick machinery even
  though almost all sit at `scale: 0`.
- **Dead code in `Piece.svelte` that doc 10 flags as its hardest migration surface:**
  the `fallback`/`error`/default slots are never filled by any call site
  (`innerCube.svelte` passes none), `forwardEventHandlers()` forwards nothing (no parent
  attaches `on:` handlers), and `name={piece}` isn't a declared prop — it silently flows
  through `$$restProps` onto the `<T is={ref}>` group. All deletable *today* on Threlte 7.
- Cosmetic bug while we're here: `CubeStatus.svelte:35` computes the checkerboard index as
  `pos[0] * pos[1] * pos[2]` — any zero coordinate makes it 0 (even), so most of the cube
  gets `evenColor`. Should be `+`. Moot once instancing assigns per-instance colors.

## Target architecture

```
Scene.svelte            interactivity() ONCE; useGltf() ONCE (context or prop)
└── Cube.svelte
    ├── CellGrid        1 LineSegments, one merged BufferGeometry of all 512 wireframes
    ├── CellHighlights  1 T.InstancedMesh (512 instances), pointer handlers on THIS one
    └── PiecesLayer     {#each $occupiedCells} → ~32 Piece mounts (not 512)
```

Expected result: from ~1,000–1,500 draw calls and 1,024 raycasters down to **<50 draw
calls and 1 raycaster**. Pieces stay as individual meshes — 32 draw calls with shared
geometry/material from the cached gltf is negligible; instancing them (12 types) saves
~20 calls and is not worth the complexity now.

**Deliberate non-choice:** do *not* use `@threlte/extras`' `<Instance>` component per
cell — 512 `<Instance>` Svelte components reintroduces exactly the per-cell component
overhead we're removing, and the Instancing components' API shifts across extras 7→9.
Use a raw `<T.InstancedMesh>` and set matrices imperatively; `<T>` survives Threlte 8
untouched except event-prop spelling.

## Steps (each is a commit; measure after each)

### P0 — measurement baseline (do first, 15 min)

Dev-only overlay or interval log of `renderer.info.render.calls`, `.triangles`, and
frame time (`useThrelte()` exposes the renderer). Record baseline numbers idle, hovering
a piece with moves highlighted, and during a move. Without this the rest is guesswork.

### P1 — mount pieces only where pieces exist (biggest structural win)

- Add an `occupiedCells` store to `src/lib/store/index.ts`: derived list of
  `{coords, piece, side}` for non-empty cells. Rebuild it inside `hydrateBoard`,
  `movePiece`/`exchangePiece` (or subscribe to `boardUpdates` and re-scan — 512 `get`s
  once per move is nothing; per frame is what we're avoiding).
- New `PiecesLayer.svelte` rendered once from `Cube.svelte`:
  `{#each $occupiedCells as c (c.coords.join())}` → `<Piece …>` positioned from coords
  (the position math currently implicit in the innerMash/innerCube nesting moves here).
- Delete `innerCube.svelte`. `Piece.svelte` loses its `$: cell = get(cellStore)`
  re-derivation — it receives its cell data as props.
- While touching `Piece.svelte`, delete the dead surface: `forwardEventHandlers`,
  `$$restProps` spread, `<T is={ref}>` wrapper, all three slots. This is legal on
  Threlte 7 now and is precisely doc 10's hardest Phase 2 item.

512 → ~32 Piece mounts; 512 fewer `Align auto` bounding-box passes.

### P2 — one `useGltf`, one `interactivity()`

- `interactivity()` exactly once in `Scene.svelte`. Delete the calls in
  `innerMash.svelte:8` and `Piece.svelte:25`. (~1,023 raycasters and their canvas
  listeners gone; hover cost drops before any instancing work.)
- Hoist `useGltf('scene-transformed.glb', {useDraco, useMeshopt})` to `Scene.svelte`,
  provide via `setContext`/prop; `Piece.svelte` consumes the resolved gltf. The parse was
  already cached (see corrections), but this removes ~500 async-store subscriptions and —
  important for doc 10 — makes Threlte 8's `useDraco()`/`useMeshopt()` loader-instance
  change a **one-line, one-file** fix instead of a per-component one.
- Replace `<Align auto>` with a precomputed static offset (compute the centering once,
  hardcode; the model is a fixed asset). Keep `Align` only if the offset genuinely varies.

### P3 — instance the 512 cells

- **`CellGrid.svelte`:** the wireframes are static and identical. Build one
  `BufferGeometry` at module scope: take `EdgesGeometry(new BoxGeometry(cubeSize³))`
  positions, tile them 512× with per-cell offsets (or `BufferGeometryUtils.mergeGeometries`
  on 512 translated clones — done once at startup, either is fine). One `<T.LineSegments>`,
  one material. Replaces 512 `LineSegments` + 512 `EdgesGeometry` allocations. The `key`
  attribute on `innerMash.svelte:17`'s `T.Mesh` does nothing in Threlte — dead, goes too.
- **`CellHighlights.svelte`:** one
  `<T.InstancedMesh args={[boxGeometry, basicMaterial, 512]}>`.
  - Index convention: `id = x*64 + y*8 + z`; inverse `[id>>6, (id>>3)&7, id&7]`.
  - Per-instance color via `setColorAt` (fixes the checkerboard bug for free); highlight
    state changes update that instance's matrix (scale 0 = invisible **and** no raycast
    hit — degenerate matrix) + `instanceMatrix.needsUpdate = true`.
  - Don't subscribe to 512 stores from here: route highlight changes through
    `updateCell`/`updateCells` into one `cellVisualUpdates` store carrying just the
    changed coords, and patch only those instances.
  - Pointer handling on the **one** instanced mesh: `on:pointermove`/`on:click`
    (Threlte 7 spelling), read `instanceId` from the event — verified present in
    `setupInteractivity.js` (intersections carry `instanceId`; it's part of the hover-ID
    key). Derive the cell, reproduce `CubeStatus`'s
    `handleActivateHighlighted`/`onClickAvailableMove` logic centrally. `pointerover`/
    `pointerout` semantics per *instance* need hand-rolling (track last hovered
    instanceId, diff on `pointermove`) since interactivity dedupes per object, not per
    instance.
- Delete `CubeStatus.svelte`'s rendering (keep its module-scope `selectedPiece` /
  `addToMovePiece` exports — move them into `src/lib/store/` where they belonged anyway)
  and delete `innerMash.svelte` entirely. `Cube.svelte`'s triple `{#each}` disappears.
- Piece hover/click handlers stay on the ~32 piece groups — fine at that count under the
  single shared raycaster.

### P4 — animation without 512 tweened stores

Replace the per-cell `tweened(0)` with one `useTask` in `CellHighlights.svelte` holding a
`Map<instanceId, {from, to, t0}>` of *currently animating* cells (typically <20: the
highlight set of one selected piece). Each frame: advance with `backInOut`, write the
instance matrix, drop finished entries; the task is a no-op (or stopped/started) when the
map is empty. Scene's four camera tweens are one-shot and fine as-is.

### P5 — cleanup & cheap wins

- Delete `src/lib/effects/Glow.svelte` + `Glitch.svelte`, remove `postprocessing` from
  `package.json` and from `ssr.noExternal` in `vite.config.ts` (keep `three` there).
  This also deletes one row from doc 10's compatibility matrix.
- Drop the `console.log('isplaying', …)` in `Scene.svelte:33` (fires on every user-store
  update) and `console.log('cube mounted')` in `Cube.svelte`.
- Optional: `autoRotate` on OrbitControls defeats Threlte's on-demand rendering (it
  invalidates every frame by design). Consider `autoRotate={!playing}` so an active match
  renders only on interaction/animation. Verify with the P0 overlay.

### Verification

`pnpm check`, `pnpm test`, `pnpm e2e` after each step (P1 and P3 touch move-selection
flow, which the e2e suite partially exercises through the UI), plus manual click-through:
hover piece → highlights appear; hover highlight → select state; click highlight → move
(local and in-match via `sendMove`); capture path (`Piece.svelte`'s enemy-piece branch —
its logic moves but must survive verbatim). Compare P0 numbers: expect draw calls
~1,000+ → <50, and flat frame time while moving the pointer.

## Sequencing vs. doc 10

**Can the packages "grow up smoothly"?** Split answer:

- **Phases 0–1 (tooling, SvelteKit 2 on Svelte 4): yes, smooth.** Isolated, codemod-
  assisted, no interaction with any of the files this plan touches. Land them first,
  in their own branches, exactly as doc 10 describes.
- **Phase 2 (Svelte 5 + Threlte 8): no, not smooth — it's the atomic jump** — and its
  entire "High effort" rating comes from `Piece.svelte`, `CubeStatus.svelte`,
  `innerMash.svelte`: the exact files this plan **deletes or collapses**. Migrating them
  first means carefully porting 512-component code to runes and Threlte 8 event props,
  then throwing it away.

So the answer to "upgrade first if smooth, else perf first" is **both, in this order**:

| Order | Branch | What | Why here |
|---|---|---|---|
| 1 | `chore/tooling-bump` | doc 10 Phase 0 | smooth, zero coupling |
| 2 | `chore/sveltekit-2` | doc 10 Phase 1 | smooth, designed for Svelte 4 |
| 3 | `perf/instanced-board` | **this plan, P0–P5** | on Threlte 7; deletes Phase 2's hardest surface |
| 4 | `feat/svelte5-threlte8` | doc 10 Phase 2 | now much smaller — see below |
| 5 | `chore/skeleton-v4` → cleanup | doc 10 Phases 3–4 | unchanged |

**What this does to doc 10's Phase 2 checklist** (re-read it after perf lands):

- `Piece.svelte`'s `forwardEventHandlers` / `$$restProps` / three-slots item → already
  deleted in P1 (they're dead code even on Threlte 7).
- "512 `useGltf` call sites, split `useDraco`/`useMeshopt`" → one call in `Scene.svelte`.
- "`interactivity()` in both `Piece.svelte` and `innerMash.svelte`" → one call, one file.
- "Fifteen `on:*` Threlte event directives" → roughly five, concentrated in
  `CellHighlights.svelte` and `Piece.svelte` — a 15-minute `on:x`→`onx` rename.
- Phase 2's risk driver "no automated coverage of the 3D scene" is also softened: you'll
  have just manually regression-tested the exact interaction paths in P3/P4's
  verification, weeks-not-months before the migration touches them.

Estimated Phase 2 after this plan: **Medium effort / Low-Medium risk** (from
High / Medium-High).

One residual risk to accept: the perf branch is written in Svelte 4 syntax and Threlte 7
event spellings, so ~200 lines of new code get mechanically converted by the Phase 2
codemod later. That's the cheap direction — the codemod handles `export let`/`$:`
mechanically, whereas hand-porting the *old* 512-component tree to Svelte 5 first would
be the expensive direction.
