# ADR-0008 — Modular monolith in a product-scoped monorepo

- Status: Proposed
- Date: 2026-08-23

## Context

One maintainer, agent-assisted, building one desktop product inside an organisation-level
repository (`open-research-lab`) that aspires to host several tools eventually. The brief
forbids microservices and distributed systems, and warns against speculative abstraction. The
long-term temptation is a shared `scientific-core` library across future products.

## Decision

A **modular monolith** with strict internal layering, in a single repository, scoped by product:

```
products/sample-operations/{packages/core, packages/persistence-sqlite,
                           packages/contracts, apps/desktop, apps/ui, apps/cli}
```

`core` has no I/O and no framework imports; persistence implements ports declared by `core`;
apps compose. Dependency direction is enforced by lint rules and package boundaries in CI, not
by convention alone. No shared cross-product library exists, and none will be created until a
second product is actually being built and duplication is demonstrated in working code.

## Alternatives considered

**Separate repository per product** (`sample-operations` standalone). Reasonable, and the
maintainer may prefer it later. Rejected now: docs, CI, licence and issue tracking are already
here, there is exactly one product, and cross-repo coordination costs more than a
subdirectory. The product-scoped path means extraction later is a `git filter-repo`, not a
redesign.

**Flat single package** (everything in `src/`). Rejected: nothing would stop the UI from
importing SQLite directly, and that boundary erosion is irreversible in practice.

**Microservices / separate backend service.** Rejected by the brief and by physics: there is
one user on one machine with no network.

**A shared `scientific-core` package now.** Rejected as the clearest example of speculative
abstraction available to us. An abstraction extracted from one use case is a guess.

**Nx or Turborepo.** Deferred: npm workspaces plus a few scripts is sufficient at this size,
and adding a build orchestrator before there is anything to orchestrate is cost without
benefit. Reconsider when CI time or task graphs become painful.

## Consequences

- Positive: one PR can change domain, persistence and UI coherently; testing the domain needs
  no database and no Electron; swapping the shell (Tauri) or the datastore (PostgreSQL for a
  server mode) touches one package; a second product can be added without restructuring.
- Negative: monorepo tooling friction with native modules and Electron packaging; contributors
  must understand the layering; the `docs/` tree is organisation-level while the code is
  product-scoped, which needs a clear pointer in `AGENTS.md`.

## How we would know this was wrong

If the repository accumulates products that never ship, the structure was optimism rather than
architecture. If Sample Operations grows its own community and release cadence, extract it into
its own repository — the layout makes that cheap.
