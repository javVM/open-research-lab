# ADR-0005 — No ORM; hand-written SQL in repositories

- Status: Proposed
- Date: 2026-08-23

## Context

Persistence is SQLite (ADR-0002). The schema is small (roughly a dozen tables) and stable in
shape, but it relies on database features we care about deeply: recursive CTEs for the
container tree, partial unique indexes for position occupancy and active item codes, check
constraints, and triggers that forbid mutation of the events table. Queries must be fast at
50k+ items, and migrations must be explicit and testable.

## Decision

No ORM. Repository implementations in `packages/persistence-sqlite` contain hand-written SQL
using `better-sqlite3` prepared statements, mapping rows to domain objects explicitly.
Migrations are numbered plain-SQL files applied forward-only by a small runner.

## Alternatives considered

**Prisma.** Excellent DX and migration tooling, but it generates a client and pulls in a query
engine, its SQLite support historically lags on the exact features we depend on (partial
indexes, triggers, recursive CTEs are awkward or need raw escapes), and shipping it inside
Electron adds packaging complexity. When most interesting queries need `$queryRaw`, the ORM is
paying no rent.

**Drizzle.** Lighter and SQL-shaped; a reasonable future option. Rejected for now to avoid
coupling the schema definition to a library while the schema is still being designed, and
because it adds a build-time codegen step for very little benefit at a dozen tables.

**TypeORM / Sequelize / Knex.** Rejected: heavier abstractions, entity decorators or query
builders that obscure the SQL we actually want to read in review, and migration systems less
transparent than numbered SQL files.

**A hand-rolled micro-ORM of our own.** Rejected: that is an ORM with no community and no
documentation.

## Consequences

- Positive: full access to SQLite's features; queries are visible and reviewable; no hidden
  N+1s or lazy-loading surprises; trivial dependency surface; migrations are ordinary SQL that
  anyone can read, including in ten years.
- Negative: more boilerplate for row↔object mapping; type safety at the SQL boundary is our
  responsibility (mitigated by explicit mapper functions with typed row interfaces and
  integration tests against a real database); refactoring a column touches SQL in several
  places (mitigated by keeping all SQL for an entity in one repository file).
- Every repository gets integration tests against a real temporary SQLite file — mandatory,
  since there is no ORM to trust.

## How we would know this was wrong

If mapping boilerplate becomes the dominant cost of feature work, or if type errors at the SQL
boundary reach production, Drizzle is the fallback and only `persistence-sqlite` changes —
domain code is unaffected because it depends on ports, not on SQL.
