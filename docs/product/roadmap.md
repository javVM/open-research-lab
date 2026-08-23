# Roadmap — Open Research Lab and Sample Operations

Status: Phase 1 (market validation). Last updated: 2026-08-23.
Supersedes the Phase 0 version of this document. Effort is in **agent sessions** (a focused
session producing a reviewable PR), not calendar time; calendar time is dominated by external
waits (interviews, review), which are marked as such.

---

## Strategic decisions in force

Approved by the maintainer after Phase 0:

- `open-research-lab` is the **umbrella repository**: strategy, research and product
  documentation. No product code lives here.
- Each product gets its **own repository**, created when — and not before — it is justified.
- **The Sample Operations repository is not created yet.** Trigger: a GO decision from user
  validation ([user-validation.md](user-validation.md) §6).
- The local-first architecture from Phase 0 remains the current technical **hypothesis**
  ([../architecture/initial-architecture.md](../architecture/initial-architecture.md)), with all
  ADRs still marked `Proposed`.

Two changes coming out of market validation
([market-validation.md](market-validation.md)):

1. **Beachhead is small natural-history collections**, entered through the paleontology
   collections community — not small research laboratories. This adds catalogue numbers,
   determination history and a minimal loan record to the MVP, and makes CSV/CMS-export import a
   first-class concern rather than a convenience.
2. **The first shippable artefact is the import/validate/export pipeline**, which is useful on its
   own without adopting anything. The Phase 0 plan put the UI first and migration last; that
   ordering maximised the time before a user could get any value.

---

## Phase 0 — Discovery ✔ (complete)

Repository inspection, domain and competitor research, problem framing, proposed domain model and
architecture, ten ADRs, testing strategy, risk register. No code.
Deliverable: [../discovery-report.md](../discovery-report.md).

---

## Phase 1 — Market validation ✔ (this deliverable)

Three candidate markets researched with primary sources; scorecards; beachhead selected;
willingness-to-pay and open-source-advantage analysis; the alternative-product test; the interview
plan and go/no-go thresholds.
Deliverables: [market-validation.md](market-validation.md),
[user-validation.md](user-validation.md),
[../research/market-sources.md](../research/market-sources.md).

**Exit criteria:** maintainer accepts (or rejects) the beachhead and the interview plan.

---

## Phase 2 — User validation (external wait; ~1 session to prepare, ~1 to synthesise)

Execute [user-validation.md](user-validation.md): 10 conversations (minimum 6), recruited through
PDWG, NHCOLL-L, the iDigBio collections list and Spanish-language collections. Interviews are
conducted by the maintainer; agents prepare materials and synthesise notes.

Deliverables: `docs/research/user-interviews.md`; an amended requirements document; a recorded
GO / NO-GO / re-scope decision against the §6 thresholds.

**This phase gates everything after it.** No product repository, no toolchain, no code.

**Exit criteria:** decision recorded, with counts against thresholds, disconfirming evidence
first.

---

## Phase 3 — Product definition, only on a GO (1 session)

- Create the Sample Operations repository (name may change based on interviews).
- Requirements rewritten around the interview evidence, with the collections additions:
  catalogue number distinct from internal identifier, determination history, minimal loan record.
- ADRs re-examined against what we learned; anything contradicted is superseded in writing, not
  quietly dropped. The two most likely to fall: single-user (ADR-0010) and barcodes-deferred.
- Project foundation in the new repository: npm workspaces, TypeScript strict, Vitest, ESLint,
  Prettier, CI on all three platforms, `CONTRIBUTING.md`, environment blueprint.

**Exit criteria:** `npm ci && npm run verify` green on a clean clone; requirements reflect real
users.

---

## Phase 4 — Import, validate, export: the first useful slice (2–3 sessions)

The pipeline first, because it is the only part that delivers value before adoption:

- Domain core (`packages/core`): container tree, items, positions, events, all documented
  invariants, pure and I/O-free.
- Persistence (`packages/persistence-sqlite`): schema, forward-only migrations, repositories.
- CSV/spreadsheet import with **dry-run validation and a plain-language error report** (row,
  column, reason), all-or-nothing application, mapping to user-defined fields.
- Export that round-trips through the importer.
- A thin CLI so all of the above is usable and testable without a UI.

**Exit criteria:** a real collection's real spreadsheet (obtained in Phase 2) is validated and
imported end-to-end, and the owner reads the error report without help.

---

## Phase 5 — Desktop application, v0.1 (3–4 sessions)

Electron shell with a hardened, typed IPC boundary; Angular UI for the container tree, search,
item detail with custody history, move dialog, import wizard and export; first-run flow;
installers for Windows and macOS plus a Linux AppImage; a first-run guide.

**Exit criteria:** the acceptance scenarios in [requirements.md](requirements.md) pass on Windows
and macOS, and a non-developer completes the first-sample scenario unaided in under five minutes.

---

## Phase 6 — First real deployment (1–2 sessions + external wait)

One friendly collection uses it for real material: migrate their spreadsheet, watch them work, fix
what breaks. Nothing else ships until this happens.

**Exit criteria:** a real collection has used it for two working weeks and would complain if it
disappeared.

---

## Post-MVP, in likely order

Each item ships only if Phase 2 or Phase 6 users ask for it.

| Version | Content |
|---|---|
| v0.2 | Barcode/QR scanning and label printing, batch move/edit, container grid view, check-out/check-in |
| v0.3 | Loans and outgoing transactions in full, parts of a specimen, derivation lineage, attachments and images, inventory reconciliation/spot-check |
| v0.4 | Darwin Core Archive export validated against GBIF's validator, determination and taxonomy handling, MIxS/GGBN templates if labs ever become a target |
| v0.5 | Configurable per-type fields in the UI, saved searches, printable inventories, Spanish localisation |
| v1.0 | Stability, documented import/export contracts, upgrade and data-format guarantees |

## Deferred indefinitely (and why)

- **Multi-user local app** — needs authentication, concurrency and conflict resolution; it is why
  every competitor requires a server. If Phase 2 shows it is mandatory, it becomes a separate
  self-hosted deployment mode reusing `core`, and ADR-0010 is superseded.
- **Cloud sync in the open-source product** — contradicts local-first; would be an opt-in service.
- **Becoming a catalogue/CMS** — taxonomy management, media management, publication portals. We
  complement Symbiota, Specify and Arctos; competing with them head-on is a fight we lose.
- **A second product** (PaleoMapper, Dataset Validator as a standalone, field tools) — not until
  Sample Operations has real users. The one exception the evidence would justify: if Phase 2 says
  the real pain is publication rather than location, the validator becomes *the* product and
  Sample Operations is shelved (market-validation §8).
- **A shared `scientific-core` library** — extracted from working code if ever, never designed up
  front. The most likely eventual candidate is Darwin Core mapping/validation.
- **Mobile and field capture** — a different product (offline capture, reconciliation, merge).

## Sequencing rules

1. No product repository before a GO decision.
2. No feature work before the toolchain is green in CI.
3. No UI before the domain core enforces its invariants with tests.
4. No new entity without an ADR.
5. No standards-conformance claim without validator output committed to the repository.
6. Every phase ends with a merged PR and updated documentation; drift is a bug.
7. If evidence contradicts a decision, supersede the ADR in writing. Never quietly abandon it.
