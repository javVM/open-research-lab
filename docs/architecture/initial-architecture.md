# Initial architecture — Sample Operations

Status: Phase 0 (proposal). Last updated: 2026-08-23.
Decisions here are proposals with rationale; each significant one has an ADR in
[decisions/](decisions/).

---

## 1. Constraints that drive every decision

1. Must run entirely offline on a researcher's own machine.
2. Must be usable by a non-technical person: one installer, no server, no configuration.
3. Data must live in one portable, inspectable file the user owns.
4. Zero infrastructure cost.
5. Single user, single machine, in v0.1.
6. History must be provably complete — no operation may bypass the audit log.
7. Small team (currently one maintainer plus agents): the design must be boring and
   maintainable, not clever.

Forbidden by the brief and by these constraints: microservices, message brokers, Kafka,
Redis, Elasticsearch, Kubernetes, hosted databases, cloud services, authentication providers,
analytics.

---

## 2. Shape: a modular monolith in a small monorepo

```
open-research-lab/
├─ docs/
└─ products/sample-operations/
   ├─ packages/
   │  ├─ core/                 domain + application layers; zero I/O, zero framework
   │  ├─ persistence-sqlite/   schema, migrations, repositories, unit of work
   │  └─ contracts/            shared IPC/DTO types and zod schemas
   └─ apps/
      ├─ desktop/              Electron main process; owns the database and the filesystem
      ├─ ui/                   Angular renderer; no Node, no direct database access
      └─ cli/                  thin internal CLI over core (dev/QA/scripting)
```

Layering, strictly one-directional:

```
ui ──IPC──> desktop ──> core (application) ──> core (domain)
                            │
                            └──> persistence-sqlite (implements core's repository ports)
```

- `core/domain`: entities, value objects, invariants, pure functions. No imports outside
  itself.
- `core/application`: use cases (`MoveItem`, `CreateContainer`, `ImportItemsCsv`), each a
  small class/function taking ports and returning a result. Transaction boundaries live here.
- Ports (`ItemRepository`, `ContainerRepository`, `EventLog`, `UnitOfWork`, `Clock`, `IdGen`)
  are declared in `core` and implemented in `persistence-sqlite`, so the domain never knows
  SQLite exists and can be tested with in-memory fakes.
- `desktop` composes everything, exposes use cases over typed IPC, and is the only process
  touching disk.
- `cli` proves the core is usable without a UI, which is the cheapest guard against business
  logic leaking into components.

Why a monorepo inside `open-research-lab` rather than a separate repository: one product
today, shared docs and CI, and no cross-repo version dance. Why product-scoped
subdirectories: so a second product can be added later without restructuring, and without
creating a shared library prematurely.

Why not microservices, an event bus, or CQRS: single user, single machine, one writer. Each
would add failure modes and no capability. The append-only event log is a domain requirement
(audit history), *not* event sourcing — current state is stored directly, not replayed.

---

## 3. Technology choices

| Concern | Choice | Alternatives rejected |
|---|---|---|
| Language | TypeScript, `strict` | — |
| Persistence | **SQLite** via `better-sqlite3` | PostgreSQL, MongoDB — see [ADR-0002](decisions/0002-sqlite-as-the-datastore.md) |
| Desktop shell | **Electron** | Tauri, local web app, CLI-only — see [ADR-0003](decisions/0003-electron-desktop-shell.md) |
| UI framework | **Angular** | React, Svelte, plain web components — see [ADR-0004](decisions/0004-angular-for-the-ui.md) |
| Data access | Hand-written SQL in repositories | ORM (Prisma/TypeORM/Drizzle) — see [ADR-0005](decisions/0005-no-orm-hand-written-sql.md) |
| Migrations | Numbered forward-only SQL files, run on open | ORM migration tooling |
| Identifiers | ULID internally, user codes separately | auto-increment ints, UUIDv4 — see [ADR-0006](decisions/0006-identifiers.md) |
| Boundary validation | `zod` at IPC and import boundaries | ad-hoc checks |
| Tests | Vitest + Playwright (E2E, later) | Jest |
| Lint/format | ESLint + Prettier | — |
| CI | GitHub Actions | — |
| Packaging | electron-builder | — |

Dependency policy: few, mainstream, and each justified in a PR. No dependency for a function
we can write in twenty lines. Prefer versions published at least seven days ago.

---

## 4. Data storage and integrity

**One file.** A `.sqlite` file at a user-chosen path. `WAL` journal mode, `foreign_keys=ON`,
`synchronous=FULL` on the main connection. Every use case runs in one transaction: an item
move and its event row commit together or not at all — this is the mechanism that makes
"history is complete" true rather than aspirational.

**Constraints in the database, not only in code.** Unique indexes on active item codes and on
position occupancy; foreign keys on every relationship; check constraints on enum columns;
triggers forbidding `UPDATE`/`DELETE` on the events table. Application-level invariants are
enforced too, but the database is the last line of defence against a bug or a future
contributor.

**Migrations.** Numbered SQL files, applied in order, version recorded in a metadata table.
Rules: forward-only; a timestamped backup copy is written before any migration; the app
refuses to open a file whose schema version is newer than the build and says why; every
migration has a test that runs it against a populated fixture database.

**Backup and portability.** Explicit "Back up now" writes `name-YYYYMMDD-HHMMSS.sqlite`
beside the original. CSV export of items, containers and events is always available, and the
importer accepts what the exporter produces. Because the format is plain SQLite, a user can
read their data with any SQLite browser, in Python, or in R, without us — that is the
anti-lock-in guarantee.

**Cloud-sync hazard.** A database file in Dropbox/OneDrive/Google Drive can be corrupted by
sync while open. We will detect common sync-folder paths and warn, and document copy-based
backup instead. This is a known real-world failure mode for local-first apps and must not be
discovered by a user losing data.

**Concurrency.** One writer. If a second instance opens the same file, the app detects the
lock and opens read-only rather than risking corruption. SQLite over a network share for
concurrent write access is explicitly unsupported and will be documented as such.

---

## 5. The IPC boundary

`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. A preload script exposes
a narrow, typed surface — one channel per use case, named after it. Every payload is validated
with `zod` on the main-process side before reaching a use case; the renderer is treated as
untrusted input even though it is our own code. No filesystem, database or shell access from
the renderer. No remote content loaded, ever, so the classic Electron attack surface is
largely absent.

Results cross the boundary as discriminated unions (`{ ok: true, value } | { ok: false, error }`)
rather than thrown exceptions, so the UI must handle domain failures (position occupied,
cycle detected) explicitly.

---

## 6. Performance approach

Targets: search under 200 ms at 50,000 items; open under 3 s; ceiling 100,000 items and
1,000,000 events before redesign.

Approach: keep current location denormalised on the item row so listing and searching never
walk the event log; index the columns we actually filter on; use SQLite FTS5 for text search
if simple `LIKE` proves insufficient; paginate lists; compute location paths with a recursive
CTE and cache per session. Benchmarks with a generated 50k-item database will live in the repo
so regressions are visible in CI rather than reported by users.

---

## 7. Testing strategy (summary)

Full detail in [testing-strategy.md](testing-strategy.md). Levels: domain unit tests for every
documented invariant; application tests with in-memory fakes; integration tests against a real
temporary SQLite file (including migrations and constraint violations); CSV import/export
round-trip and property-style tests; Playwright E2E for the critical flows once the UI exists.
CI runs lint, typecheck and the full suite on every PR.

---

## 8. Security and privacy

No network calls, no telemetry, no accounts. Data is only as protected as the user's disk;
we will document that plainly and not imply encryption we do not implement. Optional
at-rest encryption (SQLCipher) is a post-MVP consideration, not an MVP claim. Electron
hardening as in §5. Attachments (v0.3) are checksummed and stored beside the database, never
uploaded.

---

## 9. What we are explicitly not building, and why

| Not building | Reason |
|---|---|
| Server, API, or hosted backend | contradicts local-first; users have no server |
| Authentication / users / roles | single-user product; attribution by operator name suffices |
| Message broker, event bus, background workers | one user, one machine, synchronous operations |
| Elasticsearch | SQLite FTS5 covers our scale by two orders of magnitude |
| ORM | see ADR-0005 |
| Plugin architecture | no users, no requirements, huge surface |
| GraphQL / REST layer | there is no network |
| Shared `scientific-core` package across future products | premature; extract from working code if ever |
| Docker for the end user | the whole point is that no infrastructure is required |

---

## 10. Known architectural risks

1. **Electron bundle size and update story** (~120 MB installers, code-signing costs). Accepted
   for MVP; revisit if it blocks adoption. Tauri remains a documented escape hatch since the
   domain core is framework-free.
2. **`better-sqlite3` is a native module** — Electron rebuilds and CI matrices are a real
   maintenance cost. Mitigation: pin versions, build in CI on all three platforms from Phase 1.
3. **Single-user assumption may be wrong** (shared lab computers, network drives). This is the
   top open question in Phase 2. If wrong, the answer is an optional self-hosted deployment
   mode reusing `core` — not bolting concurrency onto the desktop app.
4. **Denormalised location can drift** from the event log through a bug. Mitigation: an
   integrity-check command that recomputes and reports.
5. **User-defined fields can become an unqueryable free-for-all.** Mitigation: typed field
   definitions rather than JSON, and export that flattens predictably.
6. **Grid-position materialisation** makes resizing a box a migration-like operation. Needs an
   ADR before v0.2.
7. **Documentation drift** between these Phase 0 proposals and the eventual implementation.
   Mitigation: ADRs are amended, superseded or marked wrong — never quietly abandoned.
