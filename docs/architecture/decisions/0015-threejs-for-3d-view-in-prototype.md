# ADR-0015 — Three.js for the 3D spatial view in the physical-location-prototype

- Status: Proposed
- Date: 2026-09-20

## Context

The `tools/physical-location-prototype` 3D view (`FloorPlan3dComponent` at `src/app/components/floor-plan-3d/floor-plan-3d.component.ts:52`) renders the same `x`/`y`/`width`/`height` + `outline` data as the 2D map as extruded CSS boxes (`perspective` + `translateZ` + `rotateX/Z` + `clip-path` for shaped outlines). It is read-only and orbitable via pointer drag / wheel / pinch (`src/app/components/floor-plan-3d/floor-plan-3d.component.ts:418`).

This is sufficient as a spatial hint, but it cannot provide true lighting/shadowing, correct occlusion between stacked floors (`src/app/components/floor-plan-3d/floor-plan-3d.geometry.constants.ts:13` `FLOOR_STACK_HEIGHT`), textured map-image backdrops, or future GLTF/cabinet models. CSS `preserve-3d` also requires manual wall bookkeeping (`wallsFor` `src/app/components/floor-plan-3d/floor-plan-3d.component.ts:376`, `sideTransform` `src/app/components/floor-plan-3d/floor-plan-3d.component.ts:334`) and ad-hoc `perspectiveVerticalCorrection` (`src/app/components/floor-plan-3d/floor-plan-3d.component.ts:133`) to compensate for perspective foreshortening.

The maintainer has approved introducing a structural 3D dependency and raising the bundle budget.

## Decision

Replace the CSS 3D implementation with [Three.js](https://threejs.org/) (`three` + `@types/three`) for the prototype's 3D view.

- **Renderer**: `WebGLRenderer` + `Scene` + `PerspectiveCamera` + `OrbitControls` (`three/addons/controls/OrbitControls.js`) replaces the CSS `planeTransform`/`onOrbitPointerDown` orbit. Controls provide damping, polar-angle limits (`MIN_TILT`/`MAX_TILT` at `src/app/components/floor-plan-3d/floor-plan-3d.geometry.constants.ts:26`), and zoom in one tested primitive.
- **Geometry**: `BoxGeometry` for plain rectangles (`rectFor` `src/app/components/floor-plan-3d/floor-plan-3d.component.ts:253`) and `Shape` + `ExtrudeGeometry` for shaped outlines (`outlinePoints3d` `src/app/components/floor-plan-3d/floor-plan-3d.component.ts:356`, `scaleOutline` `src/core/outline.ts:299`). The same `core/outline.ts` orthogonal invariants remain the source of truth — only the extruder changes.
- **Material**: `MeshStandardMaterial` + `AmbientLight`/`DirectionalLight` with shading derived from `RenderService.occupancyColor` (`src/app/shared/render.service.ts:16`) and `OCCUPANCY_PALETTE` (`src/app/shared/palette.constants.ts:7`). This replaces the per-face `rgba` boost in the CSS view (`src/app/components/floor-plan-3d/floor-plan-3d.component.html:79`).
- **Picking**: `Raycaster` replaces the click-suppression / `didDragSignificantly` logic (`src/app/components/floor-plan-3d/floor-plan-3d.component.ts:403`), correctly handling concave L/U shapes that a bounding-box hit test would mis-pick.
- **Scope**: only `tools/physical-location-prototype`. No change to `core`'s lack of I/O, no persistence change, no network calls. The image backdrop (`Location.mapImage` `src/core/models.ts:87`) can later be added as a textured `PlaneGeometry` when needed, still local-first (data URL).

A parallel component `floor-plan-three` is introduced first; `LocationViewComponent` (`src/app/components/location-view/location-view.component.ts:26`) switches its `3d` branch to it. The old `floor-plan-3d` remains until the replacement is validated, then is removed in a follow-up PR.

## Bundle budget

Three's ESM build is ~500–600KB uncompressed (~145KB gz). The prototype's measured bundle was ~1.14MB at ADR-0012 (`docs/architecture/decisions/0012-signals-and-bundle-budget-in-prototype.md:17`). Adding Three is expected to push `initial` to ~1.8–2.0MB.

Raise `angular.json:38` budgets to `maximumWarning 2.5MB / maximumError 3MB` for `tools/physical-location-prototype`. The warning remains useful (it will still catch a second large dependency), the error prevents unbounded growth. This is a prototype-only budget; it does not set a precedent for the eventual product repository.

## Alternatives considered

- **Keep CSS 3D.** Rejected: it is the simplest option and remains correct for a hint-only view, but it cannot provide lights/shadows, correct inter-floor occlusion, or accurate picking on concave outlines without growing the same ad-hoc geometry code that Three already solves. Approved to replace because the maintainer wants true 3D, not because CSS is broken.
- **Babylon.js / PlayCanvas.** Rejected: larger API surface and larger bundle for the same extruded-box use case. Three has the smallest mainstream bundle and the most examples for `ExtrudeGeometry` + `OrbitControls`.
- **Hybrid (CSS for rectangles, Three only for shaped).** Rejected: two renderers for one view doubles the concepts and the sync bugs (scale, camera, hit test) for no budget saving.

## Consequences

- Positive: true perspective, lights/shadows, correct stacking (`elevationFor` `src/app/components/floor-plan-3d/floor-plan-3d.component.ts:268`), real occlusion, and extensibility to textured planes/GLTF.
- Positive: one proven orbit/zoom primitive (`OrbitControls`) instead of bespoke pointer/wheel/pinch math (`src/app/components/floor-plan-3d/floor-plan-3d.component.ts:434`).
- Negative: larger bundle; WebGL renderer lifecycle (`requestAnimationFrame`, `dispose`, `ResizeObserver`) and zoneless signal sync add complexity.
- Negative: Jest/jsdom has no WebGL — 3D specs will mock `three` or assert geometry helpers, not pixels; visual correctness is verified via `npm run build` + manual orbit.
- Negative: `three` major releases churn imports (`three/addons/...`). Pinned at `^0.160.0`.

## How we would know this was wrong

If the bundle or the WebGL lifecycle outweighs the visual gain (e.g. mobile `perspective` at `src/app/components/floor-plan-3d/floor-plan-3d.component.scss:163` was already good enough and users do not use the 3D view), or if the integration leaks GPU resources (`renderer.dispose` missed on `ngOnDestroy`), revert to the CSS view and lower the budget again. If the prototype is extracted as a product, re-evaluate whether Three belongs in the product's shell or whether the 3D view is `LATER` per `docs/product/requirements.md`.
