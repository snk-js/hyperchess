# 10 — Svelte 5 + Threlte 8 migration plan

Prepared 2026-07-07 by auditing the current `master` branch directly (package.json,
`svelte.config.js`, `vite.config.ts`, `.eslintrc.cjs`, `tailwind.config.ts`, and every
`.svelte` file under `src/`). Nothing here is guessed from generic "how to upgrade Svelte"
knowledge — the breaking changes below are matched against your actual usage.

> **Status:** proposed. No code changed yet. This is the "ground prep" doc — read once,
> then work through it as a checklist. Sits alongside doc 05's tiers as a parallel
> **tooling track**, not blocked on Tier 1 (match sync) and not blocking it either — see
> [Sequencing](#sequencing--why-this-order) for how to interleave them.

## TL;DR

- Your stack is **two major versions behind on both halves** of the SvelteKit+Threlte
  pairing: Svelte 4 / SvelteKit 1 / Threlte 7, against current Svelte 5 / SvelteKit 2 /
  Threlte 8.
- **Threlte 7 cannot run on Svelte 5 at all** (it depends on internal Svelte 4 APIs that
  are gone). This means the Svelte 5 bump and the Threlte 8 bump are **not independent
  work items** — they have to land in the same branch/PR, even though every guide you'll
  find online treats them as separate migrations.
- Two dependencies are dead weight: `@threlte/rapier` + `@dimforge/rapier3d-compat` and
  `@threlte/theatre` are installed but **not imported anywhere in `src/`**. Drop them
  before the big jump — one less compatibility axis to debug.
- `@skeletonlabs/skeleton` v2 is the single biggest risk in this whole plan, bigger than
  the Threlte side. You use `AppShell`, `Modal`/`getModalStore`, `Toast`/`getToastStore`,
  a `Popup` action, `Avatar`, `RadioGroup`, and Skeleton's `Table` component —
  `AppShell` is explicitly sunset in v3+, and the store-based Modal/Toast API is replaced
  by a Zag.js component model. This needs its own decision (see
  [Phase 3](#phase-3--skeleton-v2--v4--tailwind-v3--v4)), not just a version bump.
- Recommended order: **tooling bumps → SvelteKit 2 (still on Svelte 4) → Svelte 5 +
  Threlte 8 together → Skeleton + Tailwind v4**, each as its own branch/PR, e2e suite
  green between each one.

## Current → target versions

Pulled from `package.json` on `master` vs. published `latest` at time of writing. Re-check
exact patch numbers with `npm view <pkg> version` right before you start each phase —
these are moving targets and you don't want to be a week stale on install day.

| Package | Current | Target | Coupled to |
|---|---|---|---|
| `svelte` | `^4.2.7` | `^5` (latest 5.x) | Threlte 8 (hard requirement, see below) |
| `@sveltejs/kit` | `^1.27.1` | `^2` (latest 2.x) | — |
| `@sveltejs/adapter-node` | `^1.3.1` | latest | tracks `@sveltejs/kit` major |
| `@sveltejs/adapter-auto` | `^2.0.0` | latest | tracks `@sveltejs/kit` major |
| `@sveltejs/adapter-static` | `^2.0.3` | latest | tracks `@sveltejs/kit` major |
| `@threlte/core` | `7.0.2` | `^8` (latest 8.x) | requires Svelte 5 |
| `@threlte/extras` | `7.5.3` | `^9` (latest 9.x — extras versions independently) | requires `@threlte/core` 8 |
| `@threlte/rapier` | `^1.1.2` | drop, or `^3` if kept | unused in `src/` today |
| `@threlte/theatre` | `^2.1.4` | drop, or `^3` if kept | unused in `src/` today |
| `@dimforge/rapier3d-compat` | `^0.11.2` | drop, or bump if kept | only used via `@threlte/rapier` |
| `three` | `^0.153.0` | latest `0.17x` | Threlte 8 peer range — check on bump |
| `@types/three` | `^0.152.1` | match `three` | — |
| `vite` | `^4.4.2` | latest (major 8 line as of writing) | `@sveltejs/kit` 2's peer range |
| `vitest` | `^1.6.0` | latest (major 3+ line) | follows `vite` major |
| `svelte-check` | `^3.4.3` | latest | Svelte 5 support |
| `typescript` | `^5.0.0` | latest 5.x | — |
| `eslint` | `^8.28.0` | `^9` | flat config, see [Phase 0](#phase-0--tooling-svelte-and-threlte-agnostic) |
| `eslint-plugin-svelte` | `^2.30.0` | latest | flat config + Svelte 5 syntax |
| `@typescript-eslint/*` | `^5.45.0` | replace with `typescript-eslint` (unified pkg) | eslint 9 |
| `prettier` | `^2.8.0` | `^3` | needed for Svelte 5 syntax (runes, snippets) |
| `prettier-plugin-svelte` | `^2.10.1` | `^3` | same |
| `@skeletonlabs/skeleton` | `^2.3.0` | `@skeletonlabs/skeleton` + `@skeletonlabs/skeleton-svelte` `^4`/`^1`+ | requires Svelte 5, requires Tailwind v4 |
| `@skeletonlabs/tw-plugin` | `^0.2.2` | **removed entirely** | folded into Skeleton's CSS import |
| `tailwindcss` | `^3.3.2` | `^4` | forced by Skeleton v3+ |
| `@tailwindcss/forms` | `^0.5.6` | latest (v4-compatible) | — |
| `postcss` / `postcss-nesting` / `autoprefixer` | current | likely **removable** | Tailwind v4's Vite plugin replaces this pipeline |

## What's actually in your code (the part generic migration guides can't tell you)

Grepped every `.svelte` file for the patterns that break across these upgrades:

**Svelte-4-isms that need runes/snippets conversion** (all `src/lib/**` and `src/routes/**`):
- `export let` props everywhere — mechanical, `npx sv migrate svelte-5` handles most of it.
- `<script context="module">` in `CubeStatus.svelte` → becomes `<script module>`.
- `createEventDispatcher` in `BorderWrapper.svelte` → becomes a callback prop
  (`onclose`/`ongoback`-style), which also means the `on:goback={goback}` call site in
  `+layout.svelte` becomes `ongoback={goback}`.
- Named slots (`<slot name="fallback">`, `<slot name="error">`, `<slot {ref}>` in
  `Piece.svelte`; `slot="header"`/`slot="footer"` on `AppShell` in `+layout.svelte`) →
  snippets. The `AppShell` ones are moot if you drop `AppShell` in Phase 3.
- Fifteen `on:xxx={handler}` directives across the piece/cube components — see below,
  these are Threlte event props, not DOM events, so they follow Threlte's rule not
  Svelte's.

**Threlte-7-isms that break under Threlte 8** (concrete, from the official migration guide):
- `Piece.svelte` calls `forwardEventHandlers()` and spreads `$$restProps` onto `<T is={ref}>`.
  Both are **removed** in Threlte 8. Replacement: destructure `...rest` from `$props()`
  and spread it directly — no more helper function.
- `Piece.svelte` and `innerMash.svelte`/`CubeStatus.svelte` wire up `on:pointerover`,
  `on:pointerout`, `on:click` on `<T.Group>`/`<T.Mesh>`. Threlte 8 removes Svelte's event
  system for `<T>` entirely — these become `onpointerover`, `onpointerout`, `onclick`
  callback props.
- `Piece.svelte` calls `useGltf('scene-transformed.glb', { useDraco: true, useMeshopt: true })`.
  Threlte 8's `useGltf` **no longer bundles** DracoLoader/KTX2Loader/MeshoptDecoder — you
  now import `useDraco`/`useKtx2`/`useMeshopt` from `@threlte/extras` separately and pass
  the loader instances in. The old boolean-flag call signature will silently stop
  decoding your Draco/Meshopt-compressed `scene-transformed.glb` rather than erroring
  loudly, so this one's worth testing visually, not just compiling.
- `interactivity()` is called in both `Piece.svelte` and `innerMash.svelte` — confirm the
  current `@threlte/extras` signature hasn't shifted (it's been stable, but verify against
  the docs at migration time since you're jumping two majors of `extras` at once, 7.5→9.x).
- Nothing in `src/` uses `useFrame`/`useRender` (the Threlte 6→7 migration), so that part
  of the guide doesn't apply to you — you're already on the Threlte 7 task-scheduling API.
- **Nothing in `src/` imports `RigidBody`, `Collider`, or anything from `@threlte/rapier`,
  and nothing imports `@threlte/theatre`.** Both packages are installed but dead. Confirm
  with `grep -rn "rapier\|theatre" src -i` before you drop them, in case something landed
  after this doc was written, but as of now they're pure migration-surface tax with zero
  payoff.

**Skeleton v2 surface** (`grep -rln '@skeletonlabs' src`):

| File | Skeleton feature used |
|---|---|
| `+layout.svelte` | `AppShell`, `Modal`, `Toast`, `initializeStores`, `storePopup` |
| `Header.svelte` | `Avatar` |
| `createRoom/CreateRoom.svelte` | `RadioGroup`/`RadioItem`, `use:popup` action (autocomplete) |
| `Table/Table.svelte` | `Table` component, `ModalSettings`, `getModalStore` |
| `components/App.svelte` | `getModalStore` (resign confirmation) |
| `routes/+page.svelte` | `getToastStore`, `ToastSettings` |

Six call sites, seven distinct Skeleton features. Not huge, but not trivial either — see
the decision fork in Phase 3.

## Sequencing — why this order

The reason this can't be "bump everything, fix errors" in one pass: **Threlte 7 doesn't
run on Svelte 5** (confirmed via upstream issues threlte/threlte#973 and #1020 — it
imports from `svelte/internal`, which Svelte 5 removed). So there's no intermediate state
where you have Svelte 5 with Threlte still on 7 to derisk the language migration alone.
The Svelte 5 rune/snippet rewrite and the Threlte 8 event/plugin rewrite land as one
atomic change to your 3D component tree, whether you like it or not.

Skeleton v3+ *also* requires Svelte 5 (it's a full Zag.js-based rewrite targeting runes),
so it's similarly blocked on the Svelte 5 jump — but it's otherwise fully decoupled from
Threlte, so it's worth keeping as its own branch/PR *after* Svelte 5 lands, to keep the
UI-behavior risk (modals, toasts, layout) separate from the 3D-engine risk.

What *can* move independently first:

1. **Tooling** (TypeScript, ESLint 9 flat config, Prettier 3, `@types/node`, Node engines
   pin) — zero coupling to Svelte or Threlte versions. Do this first so the later diffs
   aren't polluted by formatter/linter noise.
2. **SvelteKit 1 → 2** — this is explicitly designed to be done *while still on Svelte 4*
   (SvelteKit's own migration guide recommends updating to the latest Svelte 4 first,
   then Kit 2, then Svelte 5). Gets you a clean, small, well-isolated PR before the big one.
3. **Svelte 5 + Threlte 8, together** — the unavoidable atomic jump.
4. **Skeleton v2 → v4 + Tailwind v3 → v4** — after Svelte 5 is stable, as its own PR.
5. **Drop dead deps, final lint/format pass.**

## Phase 0 — tooling (Svelte- and Threlte-agnostic)

Do this on a `chore/tooling-bump` branch, merge before touching anything else.

- [ ] Confirm Node: Docker uses `node:20-slim` and CI pins `node-version: 20`. Vite's
      current major needs Node `^20.19 || >=22.12`. `node:20-slim` tracks latest patches
      so you're almost certainly fine, but pin `engines.node` in `package.json` explicitly
      so a future contributor's older Node 20 doesn't silently break the build.
- [ ] `typescript` → latest `^5.x`.
- [ ] `eslint` `^8` → `^9`. This means deleting `.eslintrc.cjs` and writing a flat
      `eslint.config.js`. Rough shape for your setup (recommended + typescript-eslint +
      svelte, mirroring what you have today):

  ```js
  // eslint.config.js
  import js from '@eslint/js';
  import ts from 'typescript-eslint';
  import svelte from 'eslint-plugin-svelte';
  import svelteConfig from './svelte.config.js';
  import globals from 'globals';
  import prettier from 'eslint-config-prettier';

  export default ts.config(
    js.configs.recommended,
    ts.configs.recommended,
    ...svelte.configs.recommended,
    prettier,
    {
      languageOptions: {
        globals: { ...globals.browser, ...globals.node }
      }
    },
    {
      files: ['**/*.svelte'],
      languageOptions: {
        parserOptions: { parser: ts.parser, svelteConfig }
      }
    }
  );
  ```

  Replace `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` with the single
  `typescript-eslint` package (it re-exports both).
- [ ] `prettier` `^2` → `^3`, `prettier-plugin-svelte` `^2` → `^3` — required before you
      write any Svelte 5 syntax, or the formatter will mangle runes/snippets.
- [ ] Bump `@types/node` to match Node 20/22.
- [ ] Leave `vite`/`vitest` alone for now — they'll move as a forced side effect of the
      SvelteKit 2 and Svelte 5 phases (their peer ranges will pull compatible versions).

## Phase 1 — SvelteKit 1 → 2 (still on Svelte 4)

- [ ] `npx sv migrate sveltekit-2` — handles most of it automatically (the `error()`/
      `redirect()` throw-vs-return change is the main behavioral one; grep
      `src/routes/**/*.server.ts` for both to confirm none are wrapped in `try/catch` that
      would now swallow them).
- [ ] Bump `@sveltejs/adapter-node` to the version matching Kit 2 (you use
      `adapter-node`, not `adapter-auto`/`adapter-static`, per `svelte.config.js` — you can
      likely drop `@sveltejs/adapter-auto` and `@sveltejs/adapter-static` from
      `devDependencies` entirely if nothing references them, which nothing in
      `svelte.config.js` currently does).
- [ ] Full e2e run (`pnpm e2e`) + `pnpm test` before merging. This phase should be
      functionally invisible — if anything changes in behavior, it's a red flag.

## Phase 2 — Svelte 5 + Threlte 8 (the atomic jump)

One branch, e.g. `feat/svelte5-threlte8`. Suggested internal order within the branch —
commit at each checkpoint so you can bisect if something breaks:

1. **Bump packages**: `svelte@^5`, `@threlte/core@^8`, `@threlte/extras@^9`, `svelte-check@latest`.
   Decide on rapier/theatre now (see below) rather than dragging them through the bump.
2. **Run the codemod**: `npx sv migrate svelte-5`. This mechanically converts `export let`
   → `$props()`, `$:` → `$derived`/`$effect` where it can infer intent, and flags what it
   can't. Expect it to *not* touch:
   - `CubeStatus.svelte`'s `<script context="module">` → change to `<script module>` by hand.
   - `BorderWrapper.svelte`'s `createEventDispatcher` → convert to a callback prop, update
     the `on:goback={goback}` call site in `+layout.svelte` to `ongoback={goback}`.
3. **Fix the Threlte-specific breakage file by file** (this is the part the codemod can't
   see, since it's Threlte's event/plugin system, not Svelte's):
   - `Piece.svelte`: drop `forwardEventHandlers`, change
     `<T is={ref} dispose={false} {...$$restProps} bind:this={$component}>` to destructure
     `let { ref = $bindable(new Group()), ...rest } = $props()` and spread `{...rest}`
     directly; convert `on:pointerover`/`on:pointerout`/`on:click` on the inner
     `<T.Group>` to `onpointerover`/`onpointerout`/`onclick`; convert the `fallback`/
     `error`/default slots to snippets; split `useGltf(..., { useDraco, useMeshopt })`
     into `useDraco()`/`useMeshopt()` + pass the instances in.
   - `innerMash.svelte`, `CubeStatus.svelte`: same `on:*` → `on*` treatment for whatever
     Threlte events they wire up; re-check `interactivity()` call signature.
   - `Scene.svelte`: lowest risk of the 3D files — no `on:*` Threlte events, no slots, no
     `forwardEventHandlers`. Should mostly just need the `export let` → `$props()` pass.
   - Any other `pieceClasses/*.svelte` files that render `<T>` components with events or
     slots — same treatment.
4. **`app.d.ts`/store files**: your `board.ts`/`game.ts`/`rooms.ts` stores use plain
   `svelte/store` (`writable`), which is unaffected by runes — no changes needed there
   unless you *want* to modernize them to `$state` at the same time (optional, separate
   concern, don't bundle it into this already-large diff).
5. **Vite/vitest config**: `vite.config.ts`'s `ssr.noExternal: ['three', 'postprocessing']`
   stays as-is; re-verify it's still needed once `@sveltejs/vite-plugin-svelte` (pulled in
   transitively by `@sveltejs/kit`) is on its Svelte-5-compatible version.
6. **Full regression pass**: `pnpm check`, `pnpm test`, `pnpm e2e`, then manually drive the
   3D board in the browser — piece hover highlighting, piece selection/click-to-move, and
   the camera fly-in on `playing` all depend on the exact callback-prop wiring you just
   touched, and none of that is covered by the current vitest/e2e suites (those hit
   game logic and API routes, not the Threlte scene).

**Decision: keep or drop `@threlte/rapier`/`@dimforge/rapier3d-compat`/`@threlte/theatre`?**
Nothing in `src/` uses them today. Options:
- **Drop them.** Removes three packages' worth of Svelte-5/Threlte-8-compat risk for zero
  current payoff. Re-add later if/when you actually build physics or timeline-based
  animation into hyperchess.
- **Keep and bump** (`@threlte/rapier@^3`, `@threlte/theatre@^3`) if you know you want
  physics or Theatre-driven cutscenes soon and would rather absorb the compat cost now
  while you're already mid-migration. Either is reasonable — it's a roadmap question, not
  a technical one, so it's your call rather than something to default on.

## Phase 3 — Skeleton v2 → v4 + Tailwind v3 → v4

This is the largest *UX-surface* risk in the plan, separate from and larger than the
Threlte side in terms of user-facing behavior (it touches your resign-confirmation modal,
game-result toasts, room creation form, and the overall page shell).

**Decision fork, worth making explicitly before starting:**

- **Option A — full Skeleton migration.** Follow Skeleton's own "Migrate from v2" guide,
  which is written to take you through both the v3 and v4 changes in one pass:
  `npm uninstall @skeletonlabs/skeleton @skeletonlabs/tw-plugin`, install
  `@skeletonlabs/skeleton` + `@skeletonlabs/skeleton-svelte` + Tailwind v4, migrate
  `tailwind.config.ts` into CSS `@theme`/`@import` directives (Tailwind v4 replaces the
  PostCSS pipeline with a Vite plugin — you'd drop `postcss.config.cjs`,
  `postcss-nesting`, and likely `autoprefixer`), then rewrite each call site:
  - `AppShell` → **removed entirely in v3+**; replace with a plain Tailwind flex/grid
    layout (Skeleton's own guide has a "Layouts" cookbook for this).
  - `getModalStore()`/`ModalSettings` (used in `App.svelte` for the resign confirm, and
    `Table.svelte`) → Skeleton v4's dialog is a component you place and control locally,
    not a global store you `trigger()` — this changes the control flow, not just the API
    names.
  - `getToastStore()`/`ToastSettings` (`+page.svelte`) → same shape of change for toasts.
  - `use:popup` (`CreateRoom.svelte`'s autocomplete) → Zag.js-based popover component.
  - `Avatar`, `RadioGroup`/`RadioItem` → renamed/restructured components, check current docs.
  - `Table` (Skeleton's own, in `Table/Table.svelte`) → **verify whether this component
    still exists in v4** before you start; several "data" components were trimmed from
    Skeleton's core scope during the v3 rewrite in favor of "just write a `<table>` with
    Tailwind classes," and this doc can't confirm from the outside whether yours is one of
    them — check the current component list first.
- **Option B — drop Skeleton, go plain Tailwind.** Your actual usage is modest: one modal
  (resign confirm, reused in two places), one toast pattern (you already half-own this via
  your `pushNotification`/`toast.ts` store), one popover, and a handful of form/display
  primitives. Replacing this with the native `<dialog>` element for the modal, your
  existing toast store, `@floating-ui/dom` directly for the one popover (you already
  depend on it, it's what Skeleton's popup wraps anyway), and plain Tailwind for
  Avatar/RadioGroup/Table markup may genuinely be *less* total work than following
  Skeleton's v2→v3→v4 migration guide, and it removes an entire recurring
  upgrade-treadmill dependency going forward. Given how small the surface is, this is
  worth seriously weighing against Option A rather than defaulting to "just migrate the
  library" — but it's a product/ownership tradeoff (less dependency risk vs. losing
  Skeleton's theming and any components you'd otherwise use more of later), so it's your
  call, not a default.

Whichever you pick, do it in its own PR after Phase 2 is merged and stable — it's fully
decoupled from the 3D engine and you don't want a Threlte regression and a modal
regression showing up in the same diff.

## Phase 4 — cleanup

- [ ] Drop `@threlte/rapier`, `@dimforge/rapier3d-compat`, `@threlte/theatre` if not kept
      per the Phase 2 decision.
- [ ] Drop `@sveltejs/adapter-auto`/`@sveltejs/adapter-static` if unused (see Phase 1).
- [ ] Drop `postcss`/`postcss-nesting`/`autoprefixer` if Tailwind v4's Vite plugin replaces
      them (see Phase 3).
- [ ] Final `pnpm lint`, `pnpm format`, full e2e run.
- [ ] Update `docs/04-dev-setup-from-scratch.md` if any setup steps changed (Tailwind v4
      config file, new Node engine floor, etc.) — keeping that doc accurate is exactly the
      kind of thing that saves you time next time you set this up from scratch.

## Suggested branch/PR breakdown

Mirrors the CI/CD strategy in doc 07 — small, reviewable, independently revertible:

| Branch | Contents | Depends on |
|---|---|---|
| `chore/tooling-bump` | Phase 0 | — |
| `chore/sveltekit-2` | Phase 1 | `chore/tooling-bump` |
| `feat/svelte5-threlte8` | Phase 2 | `chore/sveltekit-2` |
| `chore/skeleton-v4` | Phase 3 | `feat/svelte5-threlte8` |
| `chore/migration-cleanup` | Phase 4 | `chore/skeleton-v4` |

## Effort/risk ranking

| Phase | Effort | Risk | Why |
|---|---|---|---|
| 0 — Tooling | Low | Low | Mechanical, no runtime behavior change |
| 1 — SvelteKit 2 | Low | Low | Designed as an isolated, well-trodden step |
| 2 — Svelte 5 + Threlte 8 | High | Medium-High | Two coupled majors, real event/prop-API rewrites in `Piece.svelte` especially, no automated test coverage on the 3D scene itself |
| 3 — Skeleton + Tailwind v4 | Medium-High | Medium | Small surface area but genuine UX-flow changes (modal/toast control flow), plus a real Option A/B product decision to make first |
| 4 — Cleanup | Low | Low | Bookkeeping |
