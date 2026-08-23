# Phase 0 discovery report — Open Research Lab / Sample Operations

Date: 2026-08-23. Author: agent session (Devin). Status: for maintainer review.

> **Read with [product/market-validation.md](product/market-validation.md).** This report's
> recommendation — Sample Operations for small research laboratories — is a Phase 0 *hypothesis*.
> Phase 1 market validation kept the product and changed the market to small natural-history
> collections, changed the build order (import/validate/export first), and recorded that the
> Sample Operations repository is not to be created yet.

This report answers the thirteen questions set for Phase 0. Detail lives in the linked
documents; this is the summary and the recommendation. No application code was written.

---

## 1. What was discovered in the repository

`javVM/open-research-lab` is an initialised but essentially empty project:

- `README.md` — organisation-level framing: open source by default, reproducible research, data
  provenance, interoperability, minimal infrastructure. Focus areas listed as biology,
  paleontology, ecology, scientific collections, research data management, field research.
- `LICENSE` — Apache-2.0.
- `.editorconfig` — UTF-8, LF, two-space indent, final newline; markdown exempt from trailing
  whitespace trimming.
- `.gitignore` — Node-oriented.
- Git history: three commits (`53c1710` initial, `3a7918c` README, `44ace84` .editorconfig), one
  branch (`main`), not a shallow clone.

Absent: `AGENTS.md`, `package.json`, any TypeScript configuration, CI workflows, pre-commit
hooks (`.pre-commit-config.yaml`, `.husky/`), any application or test code.

**Consequence:** greenfield. There is no existing architecture to preserve and no legacy to work
around, so the constraints are the brief and the domain, not the codebase.

## 2. What existing products were researched

Fourteen systems, with sources, in
[docs/product/competitive-analysis.md](product/competitive-analysis.md): OpenSpecimen,
Specify 7, Arctos, Symbiota, SENAITE, LabKey Server, Benchling, eLabFTW, Quartzy, Freezerworks,
LabCollector, eLabInventory, SampleDB, and a lightweight freezer tracker. Standards and domain
practice — Darwin Core, Darwin Core Archive, ABCD, MIxS, GGBN, ISBER Best Practices, SPREC, ARK
— in [docs/research/domain-research.md](research/domain-research.md).

The finding that matters: the field splits cleanly into **capable systems that require a server
and an administrator** (OpenSpecimen: Tomcat + MySQL + Java; Specify 7: Docker, 8–16 GB RAM;
Symbiota: Apache + PHP + MariaDB; SENAITE and LabKey similarly) and **frictionless cloud tools
aimed at different problems** (Quartzy at consumables and ordering, Benchling at notebooks and
molecular design). Commercial sample managers price for funded organisations — Freezerworks
publishes plans from USD 832/month, and OpenSpecimen's vendor packages start at USD 75,000
one-time. Consortium platforms (Arctos, hosted Symbiota portals) require joining an
organisation.

Nobody targets the group with a freezer, a spreadsheet and no IT support.

## 3. What problem is worth solving

> Give a small research group a tool they can start using in under five minutes, offline, that
> always answers *where is this item?* and *what has happened to it?*, and that never silently
> loses information — with their data in a single file they own.

The failure modes today are concrete: current-state-only spreadsheets that overwrite history,
undetected duplicates and position collisions, name drift, manual bulk edits, and knowledge that
leaves with departing staff. Even well-resourced biobanks running formal quality systems measure
a residual mismatch between paper and database records; a spreadsheet-based group has no
mechanism to detect it at all.

Critically, the spreadsheet is not used out of ignorance — it is free, installed, offline,
understood, portable and flexible. **Matching all of those properties is a design constraint, not
a nice-to-have.** Details and measurable outcomes:
[docs/product/problem-statement.md](product/problem-statement.md).

## 4. Who the first users are

Primary: a laboratory manager who has become the human index for a few thousand tubes, and the
PhD student or technician who does the high-volume physical work. Secondary: a collections
manager at a small natural-history collection with cabinets and drawers, no IT department, and no
route to Specify or a Symbiota portal. Deliberate anti-personas: regulated clinical biobanks,
analytical service laboratories, large museums with IT departments, and molecular-design
workflows — each already well served, and each would drag us into a different product.

Personas, with what would falsify each: [docs/product/personas.md](product/personas.md). They are
desk research; Phase 2 exists to test them.

## 5. What the MVP should contain

Single user, single machine, one SQLite file, no network:

- A **recursive container tree** with user-defined types (site, room, freezer, rack, drawer,
  cabinet, box), optionally grid-capable with generated positions.
- **Items** with a user-owned code, type, user-defined fields, quantity *with a unit*, and status.
- **Move** operations for items and whole containers, with refusal on occupied positions.
- **Append-only history** — every mutation recorded with timestamp, operator and from/to.
- **Search** across code, name, type and location path, under 200 ms at 50,000 items.
- **CSV import with a dry run** (full validation report, all-or-nothing) and **CSV export** that
  round-trips through the importer.
- **Backup, migration with pre-migration backup, and integrity check.**

Acceptance is defined as nine end-to-end scenarios, including "download to first sample in under
five minutes" and "open the file in an external SQLite browser and read the same data":
[docs/product/requirements.md](product/requirements.md).

## 6. What must not be in the MVP

Deferred (with a reserved roadmap slot): barcode/QR scanning and label printing, box grid visual
editor, check-out/check-in, aliquots and derivation lineage, attachments, loans, taxonomy,
Darwin Core export, xlsx, reporting, saved searches.

Out of product scope entirely: user accounts and permissions in the local app, cloud sync in the
open-source app, ELN and protocols, analytical worksheets and certificates of analysis,
instrument integration, ordering and consumables, billing, telemetry, plugins, mobile app — and
any second product in the "ecosystem".

The hardest and most debatable cut is **barcodes**, the most-requested feature in this category.
It is deferred because scanning on top of an unvalidated location model is a fast way to record
wrong data, but Phase 2 may promote it into the MVP, and we should change the plan rather than
defend it. The second hardest is **multi-user**, deferred because it is the specific reason every
competitor needs a server.

## 7. Proposed domain model

A small model that does **physical custody** properly and leaves science extensible:
`ContainerType`, `Container` (self-referencing tree, optional grid), `Position` (materialised only
where grids exist), `ItemType` + `FieldDefinition` + `ItemFieldValue` (typed user-defined fields,
not a JSON blob), `Item` (immutable ULID identity plus a mutable human code), `Event`
(append-only audit and custody log), and `DerivationLink` (scientific lineage, modelled now,
implemented in v0.3).

Twelve invariants are stated explicitly — one item per position, one location per item, acyclic
tree, positions only inside declared grids, one event per change, immutable events, unique active
codes, no quantity without a unit, terminal states forbid movement, archiving requires emptiness
or an explicit cascade, UTC timestamps, all-or-nothing imports — and each maps to a required test.

Worked examples for both a molecular lab and a paleontology collection, plus deliberate
omissions (consent, studies, full taxonomy, permissions):
[docs/architecture/domain-model.md](architecture/domain-model.md).

## 8. Proposed architecture

A **modular monolith** in a product-scoped monorepo:

```
products/sample-operations/
  packages/core                 domain + application, zero I/O, zero framework
  packages/persistence-sqlite   schema, migrations, repositories, unit of work
  packages/contracts            IPC DTOs and zod schemas
  apps/desktop                  Electron main: owns database and filesystem
  apps/ui                       Angular renderer: no Node, no database
  apps/cli                      thin internal CLI over core
```

Strictly one-directional: `ui → desktop → application → domain`, with persistence implementing
ports declared in `core`. Every use case runs in one SQLite transaction, so a move and its event
row commit together — that is the mechanism that makes "history is complete" true rather than
aspirational. Constraints live in the database as well as in code, including triggers that forbid
`UPDATE`/`DELETE` on the events table. Electron is hardened (context isolation, sandbox, no
remote content) and every IPC payload is validated with `zod`.

No microservices, no event bus, no CQRS, no event sourcing, no ORM, no server, no plugin system.
[docs/architecture/initial-architecture.md](architecture/initial-architecture.md).

## 9. Recommended technology stack and rationale

| Choice | One-line rationale | ADR |
|---|---|---|
| TypeScript `strict` | one language across domain, shell and UI | — |
| **SQLite** (`better-sqlite3`) | zero setup, one portable file the user owns, real transactions and constraints for a strongly relational domain; PostgreSQL needs a server we cannot ask for, and MongoDB would push exactly the integrity rules we care about most into application code | [0002](architecture/decisions/0002-sqlite-as-the-datastore.md) |
| **Electron** | one installer, three platforms, full Node in the main process; Tauri rejected only because it introduces Rust into a one-maintainer TypeScript project — and stays a cheap escape hatch because `core` is framework-free | [0003](architecture/decisions/0003-electron-desktop-shell.md) |
| **Angular** | form- and table-heavy internal tool; batteries-included stack removes a dozen composition decisions; genuinely reversible since no domain logic lives in the UI | [0004](architecture/decisions/0004-angular-for-the-ui.md) |
| **Hand-written SQL**, no ORM | we depend on recursive CTEs, partial unique indexes, check constraints and triggers; an ORM that needs raw escapes for the interesting queries is paying no rent | [0005](architecture/decisions/0005-no-orm-hand-written-sql.md) |
| ULID + human code | labels change, identity must not | [0006](architecture/decisions/0006-identifiers.md) |
| Append-only event log (not event sourcing) | complete history at a fraction of the complexity, and fast current-state queries | [0007](architecture/decisions/0007-append-only-event-history.md) |
| Recursive container tree | a fixed freezer→rack→box hierarchy would exclude every collection | [0009](architecture/decisions/0009-recursive-container-tree.md) |
| Vitest, ESLint, Prettier, GitHub Actions, electron-builder | boring, mainstream, free | — |

Ten ADRs record the alternatives considered and why each was rejected:
[docs/architecture/decisions/](architecture/decisions/README.md).

## 10. Major technical risks

Full register with scores in [docs/product/risks.md](product/risks.md). The ones that would hurt
most:

1. **The single-user assumption may be wrong** — shared lab computers and network drives. This is
   the highest-impact open question in the project; the port-based architecture is our insurance,
   since a server deployment mode would reuse `core` unchanged.
2. **A SQLite file in a cloud-sync folder can be corrupted.** Very plausible user behaviour,
   catastrophic, and it would be blamed on us. Detect sync paths, warn, and make backup one click.
3. **A migration destroying user data** — the one bug we cannot recover from reputationally.
   Forward-only migrations, mandatory pre-migration backup, migration tests against populated
   fixtures.
4. **Native-module packaging** (`better-sqlite3` × Electron × three platforms) consuming
   disproportionate maintenance. Build on all platforms in CI from Phase 1.
5. **Derived location drifting from the event log**, and **performance collapse** at 100k items —
   both mitigated by same-transaction writes, an integrity-check command, and a benchmark fixture
   in CI.
6. **Premature standards claims.** No Darwin Core / MIxS / GGBN conformance claim without
   validator output committed to the repository.

## 11. Major product risks

1. **Feature gravity** (score 9) — barcodes, multi-user, reporting, batch everything. Each request
   is reasonable and each erodes the simplicity that is our only advantage. Mitigated by a
   published MVP boundary and an ADR requirement for every new entity.
2. **Trust** (score 9) — nobody hands irreplaceable sample records to an unknown v0.1. Mitigated
   by data-out guarantees first: open format, always-available export, no destructive operations,
   visible tests.
3. **The gap may be imagined** — Phase 2 interviews gate Phase 4 precisely so we find out before
   building a UI.
4. **Excel wins anyway** — hence five-minute onboarding and CSV round-tripping as survival
   requirements, not features.
5. **No willingness to pay** in this segment, and **free mature competitors** (Specify, Symbiota,
   eLabFTW, Benchling academic) setting expectations.
6. **Single-maintainer bus factor** — mitigated honestly: Apache-2.0, plain SQLite and CSV export
   mean users keep their data even if the project stops. We should say so in the README.

## 12. Potential monetisation paths

None to be built now, and the open-source version must stay complete for a single group on its
own hardware — no capacity limits, no paywalled export, no upgrade pressure. Plausible later:
hosted sync and managed backup; multi-group institutional deployment with permissions;
migration and onboarding services (moving a decade of spreadsheets is real, chargeable work);
support and training contracts; institutional or consortium sponsorship, which is how Specify and
Arctos are funded.

Frank assessment: our target users are the least able to pay in this market — Freezerworks charges
USD 832+/month precisely by avoiding this segment. Any revenue path runs through **institutions
and hosting**, not through the small groups we optimise for. So build for adoption and credibility
now, and treat revenue as an open question rather than a design input.
[docs/product/vision.md §6](product/vision.md#6-open-source-and-the-commercial-boundary).

## 13. What should be implemented next

In order:

1. **Phase 1 — foundation (1 session).** npm workspaces, TypeScript strict, Vitest, ESLint,
   Prettier, `CONTRIBUTING.md`, GitHub Actions running lint + typecheck + test on all three
   platforms, one walking-skeleton test, environment blueprint updated. Exit: `npm ci && npm run
   verify` green on a clean clone.
2. **Phase 2 — validation (external wait).** Five to eight conversations answering the six open
   questions, above all: are barcodes table stakes, and is single-user acceptable? This gates
   Phase 4.
3. **Phase 3 — domain and persistence core (2–3 sessions).** All twelve invariants with tests,
   migrations, CSV import/export with dry run, an internal CLI to exercise it without a UI.
4. **Phase 4 — desktop MVP v0.1 (3–4 sessions).** Electron + Angular, the nine acceptance
   scenarios passing on Windows and macOS.
5. **Phase 5 — one real deployment.** One friendly group, their real samples, their real
   spreadsheet migrated. Nothing else ships until this happens.

[docs/product/roadmap.md](product/roadmap.md).

---

## Decisions I need from the maintainer

1. **Confirm the MVP boundary** in the requirements document — especially barcodes deferred to
   v0.2 and single-user in v0.1.
2. **Confirm the stack**: SQLite + Electron + Angular + hand-written SQL, as argued in ADRs
   0002–0005. Angular and Electron are the two most reversible; SQLite and the domain model are
   the expensive ones.
3. **Monorepo vs. a separate `sample-operations` repository** (ADR-0008 proposes
   `products/sample-operations/` here).
4. **Phase 2 access to real users.** If we cannot get five conversations, say so now and I will
   plan around it explicitly rather than quietly assuming the personas are right.
5. **UI language** — English UI with externalised strings, Spanish translation later, is proposed.

## Honest limitations of this report

Everything here is desk research and reasoning. Competitor claims are sourced from vendor and
project documentation, not from hands-on installation of each system. No target user has been
interviewed. The architecture is a set of proposals marked `Proposed` in the ADRs, not decisions
validated by working code — and the ADR process exists so that when one turns out to be wrong, it
is superseded in writing rather than quietly abandoned.
