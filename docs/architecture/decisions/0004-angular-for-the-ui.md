# ADR-0004 — Angular for the UI

- Status: Proposed
- Date: 2026-08-23

## Context

The UI is a data-dense internal tool: trees, tables, forms with validation, an import wizard.
It must be keyboard-friendly and accessible, and maintainable by a small team over years. The
maintainer has stated a preference for Angular where appropriate. No business logic may live
in the UI — it consumes use cases over IPC.

## Decision

Use **Angular** (standalone components, typed reactive forms, signals) for the renderer, with
Angular Material as the component base unless it proves limiting for the grid views.

## Alternatives considered

**React.** Larger ecosystem and more contributors. Rejected on balance: for form-heavy CRUD,
Angular's batteries-included stack (typed forms, router, DI, testing, CLI) removes a dozen
composition decisions that React leaves to us, and each of those decisions is a future
maintenance liability for a one-maintainer project. The maintainer's existing Angular
familiarity is a legitimate tiebreaker, and this decision is genuinely reversible — the UI is
the thinnest layer in the system.

**Svelte / SvelteKit.** Smaller and pleasant, but a smaller component and accessibility
ecosystem for data-grid-heavy applications, and a smaller contributor pool.

**Vue.** Perfectly capable; no decisive advantage over Angular here, and less maintainer
familiarity.

**Plain TypeScript with web components, no framework.** Rejected: we would rebuild forms,
validation and state management by hand — the least interesting code in the project.

## Consequences

- Positive: opinionated structure suits multi-session agent work; typed reactive forms match
  our validation-heavy domain; DI makes swapping the IPC client for a fake trivial in tests;
  Material gives accessible components without design work.
- Negative: larger bundle than Svelte (irrelevant in a desktop app, no network fetch); steeper
  learning curve for drive-by contributors; Angular's release cadence means routine upgrade
  work.
- Constraint: the UI contains no domain rules. Anything resembling a business rule in a
  component is a bug, and the internal CLI over `core` exists to keep us honest about that.

## How we would know this was wrong

If UI work dominates sessions, or if outside contributors bounce off Angular, reconsider. The
cost of change is bounded because no domain logic lives here.
