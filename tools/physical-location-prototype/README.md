# Physical Location Prototype

**Evolving prototype — not the product yet and not a Phase 2 GO decision.**
See [`AGENTS.md`](../../AGENTS.md) for the governance rules this repository operates under.

## What this is

An Angular prototype exploring whether a spatial/visual representation of physical storage location
(building → room → cabinet → drawer → tray → position) is easier to understand than a flat list,
for the candidate Sample Operations product described in [`docs/product/`](../../docs/product/). It
has its own synthetic, deterministic demo dataset (see `src/core/seed.ts`) and is not
user-validated.

It is no longer treated as a disposable throwaway experiment; it is being shaped toward the product
and will be extracted to the standalone `sample-operations` repository when the maintainer decides
the time is right. Its `src/core` is still a deliberate simplification of the domain model — it does
not model units, provenance, or ULIDs, and its persistence is in-memory + `localStorage`, not SQLite.
None of this is a preview of `packages/core` or an architecture precedent; see `AGENTS.md` §1.

## Stack

Angular 22 (standalone components, signal forms, zoneless change detection), Angular CDK
`drag-drop` for moving items between containers, Jest + `jest-preset-angular` for tests. No
backend, no network calls other than fetching the two static translation files below.

State is split across four small app-level services with acyclic dependencies, rather than one
catch-all `DataService`: `CollectionService` (the dataset + mutations + `locationItemCounts`),
`MoveService` (the interactive move flow), `NavigationService` (selection, tree expansion,
`uiMode`), and `ScanService` (the QR check-in/check-out flow). Shared, framework-light services
keep the UI conventions in one place: `GeometryService` (floor-plan geometry), `RenderService`
(occupancy painting), `ViewportService` (breakpoint state). Form inputs use Angular's signal
forms (`form()` + `formField`) rather than `ngModel`, and icons are `<mat-icon>` backed by the
locally-registered inline-SVG set in `shared/icons.ts` — the app is local-first, so there is no
CDN icon font. These rules are codified in `AGENTS.md` §3.1.

## Commands

```bash
npm install
npm test           # Jest — 115+ unit/component tests
npm run typecheck  # tsc --noEmit
npm run build      # ng build (production)
npm start          # ng serve, http://localhost:4200
```

## Features

- **Location tree / spatial view / item detail** three-pane layout, with search-to-navigate.
- **Hierarchy**: building → floor → room → cabinet → drawer → (optionally) box → tray → position.
  A box is a container that can hold several trays side by side — not every drawer has one; see
  `src/core/seed.ts` for how often each shape occurs in the demo data.
- **Floor plan**: selecting a building, a floor, or a room offers a Map/List toggle. Map mode
  (`FloorPlanComponent`) shows its children (floors, rooms, or cabinets) as rectangles on a
  dashed-boundary canvas at their own `x`/`y`/`width`/`height` — draggable to reposition, and
  resizable from the bottom-right handle; both persist immediately via `DataService`. Each
  rectangle's background intensity reflects its occupancy relative to its busiest sibling, and
  hovering a rectangle reveals a scaled-down preview of its own coordinated children (so a
  building map hints at a floor's rooms, and a floor map at a room's cabinets, without navigating
  into them). List mode is the same card grid used for every other location type. The toggle only
  appears when every child actually has floor-plan coordinates.
- **3D view**: a third toggle next to Map/List renders the same children as extruded CSS boxes
  (`FloorPlan3dComponent`) instead of flat rectangles — same `x`/`y`/`width`/`height` data, no
  separate model. Drag empty space to orbit, scroll to zoom, click "⟲" to reset. A building's
  floors don't occupy distinct footprints in the 2D map (they're just listed one above another as
  a layout convenience — see `FLOOR_LAYOUT` in `seed.ts`); in 3D that ordering instead becomes
  literal vertical stacking, giving a sense of the building as floors. This is a read-only spatial
  view — dragging/resizing to edit stays the 2D map's job.
- **Floor plan image import**: while on the Map view, upload an image (stored as a data URL, so it
  stays local-first through the `localStorage` snapshot) to use as the map's background — e.g. a
  scanned building blueprint. Existing children keep their own `x`/`y`/`width`/`height` and can be
  dragged directly onto the image; there is no unit calibration (the layout was already in
  arbitrary units, so the image is a visual backdrop, not a measured scale). See
  `Location.mapImage` and `DataService.setLocationMapImage`/`clearLocationMapImage`.
- **Move flow**: drag-and-drop within whatever is currently on screen, or click a destination
  anywhere in the app (tree, cards, grid cells, floor-plan rectangles) to open a confirmation
  modal — the latter is the only way to move an item across containers that aren't rendered
  together (e.g. between two cabinets), since Angular CDK only connects drop lists that exist in
  the same view at once.
- **History**: every move is recorded and shown on the item detail panel.
- **QR / barcode scanner**: a full-screen mobile-first camera scanner (opened from the header) reads QR, Data Matrix, Code 128, Code 39 and EAN-13 and passes the result to the existing QR scan flow. It debounces repeated reads and stops the camera on close.
- **Barcode label generation**: the selected location and the selected item each render a locally-generated QR, Data Matrix or Code 128 label. The heavier `bwip-js` library is lazy-loaded only when Data Matrix or Code 128 is selected.
- Tree/grid rendering is deliberately kept efficient at scale: `core/tree.ts`'s `buildTree` groups
  locations by parent in a single pass instead of re-filtering the array per node, and
  `core/search.ts`'s `itemCountsByLocation` computes "items here and below" for every location in
  one bottom-up pass rather than once per rendered row. Both are exposed as `computed()` signals
  on `DataService` so they only recompute when the dataset actually changes.

## Internationalization

The UI ships in English and Spanish, switchable live from the header (no page reload). This is a
**custom, lightweight i18n layer**, not Angular's official compile-time `$localize`/`ng
extract-i18n` pipeline — that pipeline produces one build per locale and has no supported way to
switch locale at runtime without navigating to a different URL, which doesn't fit a single-page
in-app switcher. Translations are still stored as real XLIFF 1.2 files, and each key's English
text is deliberately baked into `src/app/i18n/`-facing code (its `fallback`) as a resilience net:
```
public/i18n/en.xlf, es.xlf   — the translation files (edit these to add strings)
src/app/i18n/
  locale.ts                  — supported locales, storage key
  xliff.ts                   — minimal XLIFF 1.2 reader
  translation-loader.ts      — fetches + parses a locale's .xlf file
  translation.service.ts     — reactive locale state + t(key, fallback, params?)
  translate-all.ts           — turns a component's static i18n keys into Signals
```
Every component that renders text has its own `<name>.constants.ts` (the i18n keys and their
English fallback text, plus any other constants unique to that component) and
`<name>.translations.ts` (a factory turning those constants into the `Signal<string>`s or
functions the template actually uses). Adding a new string means: add the key to both `.xlf`
files, add `{ key, fallback }` to the component's `.constants.ts`, expose it from
`.translations.ts`, and reference it from the template — never a hardcoded literal.

## Testing

`npm test` runs the full Jest suite: domain logic (`src/core/*.spec.ts`), the i18n infrastructure,
and every component, including drag-and-drop-adjacent click flows and the move confirmation modal.
`npm run typecheck` only type-checks TypeScript; Angular's template type-checking is stricter and
only runs during `npm run build`, so both should pass before a PR.
