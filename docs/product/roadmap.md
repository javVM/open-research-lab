# Roadmap — Sample Operations

Status: Phase 0 (discovery). Last updated: 2026-08-23.

Effort is expressed in **agent sessions** (a focused work session producing a reviewable PR),
not calendar time. Calendar time depends on review and user-validation availability, which are
external waits and called out separately.

---

## Phase 0 — Discovery (this deliverable) ✔

Repository inspection, domain research, competitive analysis, problem framing, proposed
domain model and architecture, ADRs, risks. No application code.

**Exit criteria:** documents in `docs/` merged; MVP boundary agreed by the maintainer.

---

## Phase 1 — Project foundation (1 session)

Scaffolding only, no features:

- npm workspaces monorepo (`packages/core`, `packages/persistence-sqlite`, `apps/desktop`,
  `apps/ui`), TypeScript `strict` everywhere.
- Vitest, ESLint, Prettier, `.editorconfig` respected, `CONTRIBUTING.md`, issue templates.
- GitHub Actions: install → lint → typecheck → test on Linux, plus a matrix build check.
- One walking-skeleton test proving the toolchain runs.
- Environment blueprint updated so future sessions start ready.

**Exit criteria:** `npm ci && npm run verify` is green in CI on a clean clone.

---

## Phase 2 — User validation (external wait; 1 session to prepare and synthesise)

Five to eight conversations against the open questions in
[requirements.md §6](requirements.md#6-open-questions-requiring-user-input-phase-2).
Deliverable: `docs/research/user-interviews.md` plus an amended requirements document.

**This phase gates Phase 4.** Building the UI before knowing whether barcodes and shared
access are table stakes is the biggest avoidable risk in the plan. Phase 3 can proceed in
parallel because the physical/custody core is stable regardless of the answers.

**Exit criteria:** the six open questions answered, or explicitly accepted as unanswered risk
by the maintainer.

---

## Phase 3 — Domain and persistence core (2–3 sessions)

- `packages/core`: containers, positions, items, events, movement rules, all twelve invariants
  from the requirements, as pure TypeScript with no I/O.
- `packages/persistence-sqlite`: schema, forward-only migration runner, repositories, unit of
  work, integrity checks.
- CSV import/export as an application-layer service with dry-run validation.
- A thin internal CLI to exercise everything without a UI.

**Exit criteria:** every invariant covered by a test; 50k-item search benchmark under target;
a 500-row import round-trips through export.

---

## Phase 4 — Desktop MVP, v0.1 (3–4 sessions)

- Electron shell, typed IPC boundary, no Node access from the renderer.
- Angular UI: container tree, item list with search and filters, item detail with history,
  create/edit forms, move dialog, import wizard, export.
- First-run experience: create-or-open database, set operator name, done.
- Signed-where-possible installers for Windows and macOS, plus Linux AppImage.
- First-run user guide.

**Exit criteria:** all nine acceptance scenarios in the requirements pass end-to-end on
Windows and macOS; a non-developer completes scenario 1 unaided in under five minutes.

---

## Phase 5 — First real deployment (1–2 sessions + external wait)

One friendly group uses it for their actual samples. Migrate their spreadsheet. Watch them
work. Fix what breaks. Nothing else ships until this happens.

**Exit criteria:** a real group has recorded real samples for two working weeks and would
complain if the tool were removed.

---

## Post-MVP, in likely order

Each item ships only if Phase 5 users or Phase 2 interviews demand it.

| Version | Content | Why here |
|---|---|---|
| v0.2 | Barcode/QR scanning, label printing, batch move/edit, box grid visual view, check-out/check-in | The most likely blockers to daily use at volume |
| v0.3 | Aliquots and derived samples with lineage, attachments, loans and external transfers, reporting | Real scientific workflow beyond location |
| v0.4 | Darwin Core Archive export (validated against GBIF's validator), MIxS/GGBN field templates, taxonomy and determination history | Makes the tool credible for collections and publication |
| v0.5 | Configurable per-type field schemas in the UI, saved searches, printable inventories, Spanish localisation | Fit-and-finish for broader adoption |
| v1.0 | Stability, documented import/export contracts, upgrade guarantees, long-term data-format commitment | The version an institution can adopt |

---

## Deferred indefinitely (and why)

- **Multi-user local app** — needs authentication, concurrency and conflict resolution; it is
  the reason every competitor requires a server. If demanded, it becomes a separate
  self-hosted deployment mode, not a change to the desktop app.
- **Cloud sync in the open-source app** — contradicts local-first; would be a separate opt-in
  service.
- **Second product in the ecosystem** (PaleoMapper, Dataset Validator, Field Tools) — no work
  starts until Sample Operations has real users. See
  [vision.md §2](vision.md#2-what-open-research-lab-is-not-going-to-be-yet).
- **Shared `scientific-core` library** — will be extracted from working code if ever, never
  designed up front.
- **Mobile/field capture** — a genuinely different product (offline capture, reconciliation,
  merge). CSV import serves the field case for now.
- **Plugin system, API platform, marketplace** — no user has asked; enormous surface area.

---

## Sequencing rules

1. No feature work before Phase 1's toolchain is green in CI.
2. No UI before the domain core enforces its invariants with tests.
3. No new entity type without an ADR.
4. No standards-conformance claim (Darwin Core, MIxS, GGBN) without validator output in the
   repository proving it.
5. No dependency added for a single convenience function.
6. Every phase ends with a merged PR and updated documentation; documentation drift is a bug.
