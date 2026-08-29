# AGENTS.md — working agreement for AI agents and contributors

This repository is developed with heavy AI-agent assistance. Read this file before doing
anything. It is binding.

---

## 1. Where you are

**Open Research Lab** — open-source software for scientific research. Licence: Apache-2.0.

Current state: **Phase 1 (market validation) complete; no product code exists and none should be
added here.** This is the **umbrella repository**: strategy, research and product documentation.
Products live in their own repositories; the `sample-operations` repository does not exist yet and
must not be created until user validation returns a GO.

The permitted prototypes are the tools explicitly listed under [`tools/`](tools/).
Currently these are [`tools/collection-validator`](tools/collection-validator/README.md),
[`tools/sample-operations-slice`](tools/sample-operations-slice/README.md) and
[`tools/physical-location-prototype`](tools/physical-location-prototype/README.md). The first two
were built to gather evidence during (or ahead of) user validation and remain throwaway experiments;
nothing in them may be promoted to a shared package or reused as an architecture precedent.

`tools/physical-location-prototype` is an **evolving prototype** that is being shaped toward the
candidate Sample Operations product. It is still not the product itself and still has not passed the
user-validation GO, but it is no longer treated as disposable. Its `src/core` remains a deliberate
simplification of the domain model (it collapses `Position` into `Location`), not a preview of
`packages/core`, and it uses in-memory/`localStorage` persistence rather than SQLite by deliberate
choice, documented in its own README. It will be extracted to the standalone `sample-operations`
repository when the maintainer decides the time is right.

The candidate first product, **Sample Operations**, is a local-first desktop tool for tracking
where physical specimens and samples are and what has happened to them. Its target users are
**small natural-history collections** (Phase 1 decision; Phase 0 said laboratories).

Start by reading, in this order:

1. [docs/README.md](docs/README.md) — index
1. [docs/product/market-validation.md](docs/product/market-validation.md) — current strategy;
   supersedes parts of the Phase 0 product documents
1. [docs/product/user-validation.md](docs/product/user-validation.md) — the gate before any code
2. [docs/product/vision.md](docs/product/vision.md)
3. [docs/product/problem-statement.md](docs/product/problem-statement.md)
4. [docs/product/requirements.md](docs/product/requirements.md) — the MVP boundary
5. [docs/architecture/initial-architecture.md](docs/architecture/initial-architecture.md)
6. [docs/architecture/domain-model.md](docs/architecture/domain-model.md)
7. [docs/architecture/decisions/README.md](docs/architecture/decisions/README.md) — ADRs
8. [docs/architecture/testing-strategy.md](docs/architecture/testing-strategy.md)

Do not propose a structural change without having read the relevant ADR.

---

## 2. Non-negotiable product rules

1. **Local-first.** No network calls from the application. No telemetry, no analytics, no
   accounts, no phoning home.
2. **The user owns the data.** One SQLite file at a path they choose, readable without our
   software, exportable to CSV at all times.
3. **Nothing is silently destroyed.** No hard deletes of domain entities. Corrections append;
   they never overwrite. Provenance, units, timestamps and verbatim original values are
   preserved.
4. **Every mutation is recorded.** An event row, written in the same transaction as the change.
   There is no code path that changes state without history.
5. **Five-minute onboarding.** Any change that adds setup friction for a non-technical user is
   suspect.
6. **The MVP boundary is real.** If it is marked LATER or NEVER in the requirements, do not
   build it — propose it instead.

## 3. Non-negotiable technical rules

- **Forbidden, permanently, for the local app:** microservices, message brokers, Kafka, Redis,
  Elasticsearch, Kubernetes, Docker as a user requirement, hosted databases, cloud services,
  authentication providers, analytics SDKs, payment or licensing systems.
- **Forbidden without an ADR:** a new dependency of structural importance, a new domain entity,
  a change to a layer boundary, a change to the persistence format, reversing a prior ADR.
- **Layering is one-directional:** `ui → desktop → core (application) → core (domain)`, with
  `persistence-sqlite` implementing ports declared in `core`. `core` has no I/O and no
  framework imports. Business logic in a UI component is a bug.
- **TypeScript `strict`.** No `any`. No `getattr`-style dynamic property access. If you feel you
  need an escape hatch, you do not yet understand the type — go and read it.
- **Hand-written SQL** in repositories (ADR-0005). No ORM.
- **No speculative abstraction.** No shared cross-product library until a second product
  actually exists and duplication is demonstrated in working code.
- **Dependencies:** few, mainstream, justified in the PR description, and preferably published
  at least seven days ago. Never add a dependency for a function you can write in twenty lines.

### 3.1 Angular / UI conventions — the coding bible

These are the working rules for the Angular prototype(s). They apply in addition to the technical
rules above. When in doubt, the smaller, more boring, better-named option wins.

- **No magic numbers or magic strings.** Every number or string that means something is a named
  constant. Put constants that are local to one component in that component's `.constants.ts`; put
  constants shared by two or more components under `shared/`. Group related constants into a
  clearly named file (e.g. `hierarchy.constants.ts`, `geometry.constants.ts`,
  `palette.constants.ts`). Prefer a `const` object or union over ad-hoc literals in a method.
- **Services for grouped functionality.** If several components share a concern, extract a
  `@Injectable({ providedIn: 'root' })` service and keep the shared logic in it. Real examples in
  this prototype: `GeometryService` (floor-plan geometry), `RenderService` (occupancy painting),
  `ViewportService` (breakpoint state). A service owns a single concern; keep methods readable and
  short — if a method is doing two things or reads like a wall of text, split it.
- **Signals and signal forms.** Use `signal()`/`computed()` for all component state. For form
  inputs, use Angular's signal forms (`form()` from `@angular/forms/signals` + the `formField`
  directive) rather than `[(ngModel)]`. Never mutate a plain string field behind an input.
- **Components are standalone.** Always. Each declares its own `imports`.
- **Keep components atomic.** When a coherent, self-contained concern (a dialog, a grid, a
  sub-view) grows out of a parent component, extract it into its own component instead of letting
  the parent swell. A component is either presentational (takes inputs and emits outputs) or owns
  exactly one interaction — not both. Real examples in this prototype: `PositionGridComponent` (a
  tray's cell grid), `HistoryModalComponent` (an item's movement history dialog).
- **Use the modern control-flow directives** (`@if`, `@for`, `@switch`, `@defer`) — never
  `*ngIf`/`*ngFor`/`*ngSwitch`.
- **No deprecated imports, APIs or methods.** If a symbol is marked `@deprecated`, use its
  replacement. When in doubt, check the type definition before using it.
- **Accessibility is essential.** Every interactive element has an accessible name (a label,
  `aria-label`, or `mat-label`), toggle/segmented controls set `aria-pressed`/`aria-expanded` as
  appropriate, decorative icons are `aria-hidden`, and dialogs/roles are announced
  (`role="dialog"`, `aria-modal`, `aria-label`). A new control without an accessible name is an
  incomplete change.
- **Use the Material components** (`mat-button`, `mat-icon-button`, `mat-select`, `mat-form-field`,
  `mat-input`). For icons, use `<mat-icon>` backed by the locally-registered icon set in
  `shared/icons.ts` (the app is local-first, so icons are inline SVGs — never a CDN font).
- **Names must be clear and descriptive.** Variables, methods, CSS classes and component selectors must describe what they are or do, not how they are implemented. Prefer `isTrayGrid` over `isPositionGrid`, `itemCountAt()` over `countAt()`, `childrenWithoutCoordinates()` over `uncoordinatedChildren()`, `visibleDrawerSide()` over `facingSide()`, `pane--building-picker` over `pane--tree` when the mobile variant is a building picker. If a name is unclear on first read, rename it — clarity is a feature.
- **Tests must pass and each test must earn its place.** Never add a test just to pad a count; a
  test asserts a behaviour or a documented invariant. Never weaken or delete a meaningful test to
  make a suite green — a failing meaningful test is a signal to fix the code, not the test.

## 4. Scientific data rules

- Never store a quantity without its unit.
- Keep the verbatim value alongside any parsed or normalised one (dates, localities,
  coordinates). Imprecise dates are legitimate data — model precision, do not guess a day.
- Store timestamps in UTC; preserve the originating offset where known; display local.
- Human-readable codes are user-owned and mutable; internal identity is an immutable ULID
  (ADR-0006). Never use the human code as a foreign key.
- Do not claim conformance to a standard (Darwin Core, MIxS, GGBN) without validator output
  committed to the repository.

## 5. Testing rules

Full detail in [docs/architecture/testing-strategy.md](docs/architecture/testing-strategy.md).

- Every documented domain invariant has at least one test. Adding a rule without a test is an
  incomplete change.
- Persistence is tested against a real temporary SQLite file, not a mock.
- Every migration has a test that runs it against a populated fixture from the previous version.
- Import/export is round-trip tested.
- **Never modify a test to make it pass.** If a test is wrong, that is a separate, justified
  change.
- Tests are deterministic: fixed clock, seeded ids, no network, explicit non-UTC timezone
  coverage.

## 6. Working style

- **Small, focused PRs.** One concern. Do not touch unrelated files, and do not opportunistically
  refactor.
- **Comments are the exception.** Rely on naming. Never write a comment that only makes sense to
  someone reading the diff ("now we also check X"); that belongs in the PR description.
- **Follow existing conventions** in whatever file you are editing. `.editorconfig` is
  authoritative for whitespace: UTF-8, LF, two-space indent, final newline.
- **Documentation is part of the change.** If behaviour or a decision changes, the docs change in
  the same PR. Drift is a bug.
- **Be honest in documents.** Mark hypotheses as hypotheses, cite sources for factual claims about
  other software or the domain, and say when a competitor is a better fit for a user than we are.
- **Do not commit** plans, todo lists, scratch notes, screenshots or generated artefacts.

## 7. Git and PR conventions

- Branch from `main`: `devin/<timestamp>-short-description` for agent work, or a descriptive
  name.
- Never push to `main`. Never force-push a shared branch. Never amend or rewrite pushed history.
  Never skip hooks.
- Add specific files (`git add path/to/file`); never `git add .`.
- Commit messages: imperative subject under ~72 characters, body explaining *why*.
- Every PR describes: what changed, why, decisions taken, and what was deliberately not done.
- No secrets, credentials or `.env` files, ever.

## 8. Definition of done

1. Domain rules in `core`, with unit tests.
2. Persistence changes covered by integration tests against a real database file.
3. A tested migration, if the schema changed.
4. Events emitted for every mutation, asserted in tests.
5. Import/export updated and round-trip tested, if the data model changed.
6. Lint, typecheck and the full test suite green locally and in CI.
7. Documentation and, where relevant, an ADR updated.
8. Any new dependency justified in the PR description.

## 9. Repository facts (keep current)

- Structure today: `docs/`, plus the `tools/collection-validator` prototype, the
  `tools/sample-operations-slice` throwaway prototype, the `tools/physical-location-prototype`
  evolving prototype, and the `tools/validation-research` analysis scripts (Python standard
  library only, no dependencies; research, not product code). Sample Operations code, when it
  exists, goes in its own repository (ADR-0008, as amended). `tools/physical-location-prototype` is
  being shaped toward that product but remains a prototype until it is extracted.
- No repository-wide toolchain and no CI. `tools/collection-validator`,
  `tools/sample-operations-slice` and `tools/physical-location-prototype` each have their own
  self-contained `package.json` and are not a workspace, a monorepo root, or a precedent for one.
  `tools/physical-location-prototype` is the only one of the three with runtime dependencies
  (Angular), because it is a UI experiment rather than a headless one. Its Angular version is not
  a statement about the product's eventual UI framework; see its own README.
- No pre-commit hooks configured (no `.pre-commit-config.yaml`, no `.husky/`). If you introduce
  a toolchain, wire lint and format into CI first; hooks are optional and must never be skipped
  with `--no-verify` once they exist.
- Commands, run from `tools/collection-validator`: `npm install`, `npm test`,
  `npm run typecheck`, `npm run validate -- <file.csv>`. Both checks must be green before a PR
  that touches the prototype. Commands, run from `tools/physical-location-prototype`:
  `npm install`, `npm test`, `npm run typecheck`, `npm run build`, `npm start`. There is no
  repository-wide command.

## 10. When in doubt

Prefer the smaller change. Prefer the boring solution. Prefer asking over guessing on anything
that touches the data model, the MVP boundary, or a user's existing records. Write down the
decision.
