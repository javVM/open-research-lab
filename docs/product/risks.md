# Risks — Sample Operations

Status: Phase 0 (discovery). Last updated: 2026-08-23.

Scored as impact × likelihood on a 1–3 scale. Anything at 6 or above needs an owner and a
mitigation with a date, not a paragraph of optimism.

---

## 1. Product and market risks

| # | Risk | Impact | Likelihood | Score | Mitigation |
|---|---|---|---|---|---|
| P1 | **The gap is imagined.** Target users are content with spreadsheets, or already served by something we did not find. | 3 | 2 | 6 | Phase 2 interviews gate Phase 4. If five conversations produce shrugs, stop and re-scope rather than build. |
| P2 | **Excel wins anyway.** Even a good tool loses to a spreadsheet that is already open, understood and infinitely flexible. | 3 | 2 | 6 | Five-minute onboarding as a hard requirement; CSV import/export as survival features; never require an account or a server. |
| P3 | **No willingness to pay.** Our users are the least funded segment in this market. Adoption without revenue. | 2 | 3 | 6 | Treat revenue as a Phase-5+ question routed through institutions and hosting, not through small groups. Do not distort the MVP for monetisation. |
| P4 | **Feature gravity.** Barcodes, label printing, multi-user, batch everything, reporting — each request is reasonable and each erodes the simplicity that is our only advantage. | 3 | 3 | 9 | A published MVP boundary; ADR required for every new entity; public, argued "no" in the roadmap; deferred list maintained with reasons. |
| P5 | **Serving two communities serves neither.** Lab freezers and museum cabinets have different vocabularies and expectations. | 2 | 3 | 6 | Share only the physical/custody core; keep discipline metadata extensible; if forced to choose, follow the users we can actually talk to. |
| P6 | **Free mature competitors** (Specify, Symbiota, eLabFTW) plus free cloud tiers (Benchling academic, Quartzy) set expectations we must exceed on friction, not on features. | 2 | 3 | 6 | Compete only where they cannot go: no server, no account, offline, one portable file. Recommend them honestly where they fit better. |
| P7 | **Single-maintainer bus factor** — abandonware risk, which is itself a documented reason researchers distrust small tools. | 3 | 2 | 6 | Apache-2.0, plain SQLite, CSV export, and documented formats mean users keep their data even if the project stops. Say this explicitly in the README. |
| P8 | **Trust and credibility.** Researchers will not trust irreplaceable sample records to an unknown v0.1. | 3 | 3 | 9 | Data-out guarantees first (export, open format, backup); no destructive operations; visible tests; one real friendly deployment before any promotion. |
| P9 | **Scope creep into the ecosystem** — starting PaleoMapper or Dataset Validator before Sample Operations has users. | 3 | 2 | 6 | Roadmap forbids a second product until Phase 5 succeeds. |

## 2. Technical risks

| # | Risk | Impact | Likelihood | Score | Mitigation |
|---|---|---|---|---|---|
| T1 | **Single-user assumption is wrong** (shared lab computers, network drives). Would invalidate a core architectural premise. | 3 | 2 | 6 | Highest-priority Phase 2 question. Port-based architecture means a server deployment mode reuses `core`. Read-only second instance in the meantime. |
| T2 | **SQLite file in a cloud-sync folder gets corrupted.** Extremely plausible user behaviour; catastrophic and blames us. | 3 | 2 | 6 | Detect common sync paths and warn; document copy-based backup; one-click timestamped backup; integrity check command. |
| T3 | **Native module (`better-sqlite3`) build/packaging pain** across Electron versions and three platforms. | 2 | 3 | 6 | Pin versions; build on all three platforms in CI from Phase 1; treat a packaging break as a release blocker. |
| T4 | **Migration destroys user data.** The one bug we cannot recover from reputationally. | 3 | 2 | 6 | Forward-only numbered migrations; mandatory pre-migration backup; migration tests against populated fixtures; refuse to open newer schemas. |
| T5 | **Derived current location drifts from the event log** through a bug. | 2 | 2 | 4 | Same-transaction writes; integrity-check command that recomputes from events and reports mismatches. |
| T6 | **Performance collapse at scale** (large imports, 100k items, deep trees). | 2 | 2 | 4 | 50k-item benchmark fixture in CI; indexed derived location; pagination; FTS5 if needed. |
| T7 | **User-defined fields become an unqueryable mess.** | 2 | 2 | 4 | Typed field definitions instead of JSON blobs; predictable flattening on export. |
| T8 | **Electron footprint and unsigned-binary warnings** block installation for non-technical users. | 2 | 2 | 4 | Measure in Phase 5; Tauri is a documented escape hatch since `core` is framework-free. |
| T9 | **Premature standards claims** (Darwin Core, MIxS, GGBN) that do not survive a validator. | 2 | 2 | 4 | No conformance claim without validator output committed to the repository. |
| T10 | **Documentation drift** between Phase 0 proposals and the built system, especially across many agent sessions. | 2 | 3 | 6 | ADRs are superseded, never quietly abandoned; documentation update is in the definition of done. |
| T11 | **Grid resize with occupied positions** has no defined behaviour yet. | 1 | 3 | 3 | ADR required before v0.2. |
| T12 | **Timezone and imprecise-date handling** — historical collection dates are often month- or year-precision. | 2 | 2 | 4 | Store UTC with precision qualifiers and verbatim originals; test with a non-UTC host timezone. |

## 3. Adoption and operational risks

| # | Risk | Mitigation |
|---|---|---|
| A1 | Migration from an existing messy spreadsheet is the real first-run experience, and it is hard. | The import wizard, dry-run validation and mapping are MVP features, not conveniences. Offer hands-on migration help to the first users. |
| A2 | Institutional policy may forbid locally-stored research records, inverting our value proposition. | Test in Phase 2 with P5-type stakeholders. |
| A3 | No distribution channel — the tool nobody hears about. | One real deployment first; then domain-specific communities (herbarium/collections mailing lists, biodiversity informatics forums) rather than generic launch platforms. |
| A4 | Support burden from non-technical users falls on one maintainer. | Documentation-first; self-service backup and export; no support commitments we cannot keep. |
| A5 | Barcodes turn out to be table stakes, making the MVP unusable at real volume. | Explicit Phase 2 question; v0.2 slot reserved; willing to re-scope rather than defend the plan. |

## 4. Risks we accept without mitigation

- **No encryption at rest in the MVP.** Data is as safe as the user's disk. We document this
  plainly rather than implying protection we do not provide.
- **Attribution is trust-based**, not authenticated. Documented as attribution, not security.
- **No concurrent multi-user access.** A deliberate trade for zero infrastructure.
- **Angular may narrow the drive-by contributor pool.** Accepted; the UI is the thinnest and
  most replaceable layer.
