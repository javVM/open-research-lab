# ADR-0011 — Angular Material for UI components in the physical-location-prototype

- Status: Proposed
- Date: 2026-08-26

## Context

The `tools/physical-location-prototype` is an evolving Angular UI experiment for Sample Operations.
We want to modernise the interface and reduce the amount of custom CSS/ARIA boilerplate by using
a well-known component library. The immediate need is accessible form controls such as `mat-form-field`
with `matInput`, plus standard buttons, selects and dialogs. The prototype already depends on
`@angular/cdk` for drag-and-drop and accessibility primitives, so the Angular Material ecosystem is
already partially in use.

## Decision

Add `@angular/material` as a runtime dependency for `tools/physical-location-prototype` and use
individual standalone Angular Material components where they improve accessibility and consistency
without leaking Material-specific logic into `core` domain code or business rules.

Only import the components we actually use; do not import `MatModule` bundles. Theming will be
provided by a pre-built Material theme referenced from the application styles.

## Alternatives considered

- **Custom HTML + CSS.** Rejected: it would recreate accessible patterns (focus management,
  ARIA roles, keyboard handling) that Angular Material already provides and tests.
- **PrimeNG / other third-party library.** Rejected: Angular Material is maintained by the Angular
  team, follows Angular release cadence, and integrates cleanly with `@angular/cdk` which is
  already present.
- **Tailwind-only.** Rejected: Tailwind is a styling utility, not a component library; it does not
  provide form controls, dialogs or accessibility behaviours.

## Consequences

- Additional bundle size, mitigated by per-component standalone imports.
- Need to configure animations (`provideAnimationsAsync`) and a Material theme.
- Components must keep business logic in `core`/services and use Material only for presentation.
- A later product repository may revisit this decision once the prototype is extracted.

## How we would know this was wrong

If bundle size becomes unacceptable, theming conflicts with the collection's branding, or we find
ourselves fighting Material APIs for behaviour that belongs in `core`, we should consider a more
minimal custom component set or a different design system.
