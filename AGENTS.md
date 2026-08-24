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

The single exception is [`tools/collection-validator`](tools/collection-validator/README.md), a
throwaway prototype built to gather evidence during user validation: a read-only CSV checker with
no persistence, no UI and no domain model. Keep it that way — it is not the seed of a product, and
nothing in it may be promoted to a shared package or reused as an architecture precedent.

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

- Structure today: `docs/`, plus the `tools/collection-validator` prototype and the
  `tools/validation-research` analysis scripts (Python standard library only, no dependencies;
  research, not product code). Sample Operations code, when it exists, goes in its own
  repository (ADR-0008, as amended).
- No repository-wide toolchain and no CI. `tools/collection-validator` has its own
  self-contained `package.json` (three development dependencies, nothing at runtime) and is not
  a workspace, a monorepo root, or a precedent for one.
- No pre-commit hooks configured (no `.pre-commit-config.yaml`, no `.husky/`). If you introduce
  a toolchain, wire lint and format into CI first; hooks are optional and must never be skipped
  with `--no-verify` once they exist.
- Commands, run from `tools/collection-validator`: `npm install`, `npm test`,
  `npm run typecheck`, `npm run validate -- <file.csv>`. Both checks must be green before a PR
  that touches the prototype. There is no repository-wide command.

## 10. When in doubt

Prefer the smaller change. Prefer the boring solution. Prefer asking over guessing on anything
that touches the data model, the MVP boundary, or a user's existing records. Write down the
decision.
