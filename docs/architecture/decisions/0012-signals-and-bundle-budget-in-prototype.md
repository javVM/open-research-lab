# ADR-0012 — Signal inputs and bundle budget in the physical-location-prototype

- Status: Proposed
- Date: 2026-08-27

## Context

The `tools/physical-location-prototype` Angular UI is being modernised while it remains a throwaway/evolving experiment for Sample Operations. Two related concerns emerged during the latest round of component work:

1. `@Input` decorators were still in use in `floor-plan` and `floor-plan-3d`; the rest of the prototype had already moved to Angular's `input()` signal inputs. Keeping both styles in the same codebase makes testing (`fixture.componentRef.setInput()` vs `componentInstance.property = ...`) and future extraction inconsistent.
2. The initial bundle budget (`1MB`) started warning after adding `floor-plan-3d` and its occupancy/geometry code. A warning in every production build is noise; it should reflect reality, not quietly grow.

## Decision

Migrate all remaining component inputs to `input()` signal inputs and rely on `effect()`/`untracked()` for lifecycle-side effects such as fitting the 2D/3D viewports to input changes. Remove the now-redundant `afterNextRender()` call that was doing the same job on first render.

Raise the `initial` bundle `maximumWarning` from `1MB` to `1.5MB` in `angular.json` while keeping `maximumError` at `2MB`. The new warning matches the actual current bundle (`~1.14MB`) without masking future large jumps.

Continue migrating native controls to Angular Material where the component has an equivalent (`<button mat-button>`, `mat-form-field` + `matInput`, etc.). Leave elements that have no direct Material equivalent (e.g. `input[type="file"]` for image uploads) as native HTML, wrapped in the component's own styles.

## Alternatives considered

- **Keep `@Input` decorators for legacy-only prototype code.** Rejected: mixed signal/decorator inputs add mental overhead and prevent the codebase from benefiting from consistent `input()`/`computed()`/`effect()` patterns.
- **Leave the bundle warning and ignore it.** Rejected: build warnings become expected noise and hide real regressions. If the bundle truly needs to be smaller, the fix is extracting geometry/map code, not a permanent warning.
- **Lower the bundle by extracting a shared geometry service immediately.** Rejected for now: a second reusable consumer does not yet exist, so the service would be speculative abstraction (AGENTS.md: "no shared cross-product library until a second product actually exists"). The budget is a useful trigger for that work when it becomes justified.

## Consequences

- All components now use `input()` for `@Input`-style public API, and tests consistently call `fixture.componentRef.setInput()`.
- `floor-plan` no longer calls `fitToViewport()` twice on first render (once via `afterNextRender`, once via the initial `effect` trigger), avoiding redundant layout work.
- The bundle budget reflects the measured size and will fail the build if it crosses `2MB`, giving a hard guardrail rather than a soft warning.
- Geometry and map calculations remain in the components for now; the budget warning will prompt extraction only when a second consumer appears.

## How we would know this was wrong

If the warning threshold is raised again within a few PRs, or if the signal effects cause layout thrashing that `afterNextRender` did not, the budget or lifecycle choice should be revisited. If the prototype is extracted to a product repository, this ADR should be reviewed for product-level validity.
