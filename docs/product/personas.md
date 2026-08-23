# Personas — Sample Operations

Status: Phase 0 (discovery). Last updated: 2026-08-23.

> **Priority reversed by [market-validation.md](market-validation.md).** Elena (P3, small
> collection) is now the **primary** persona, joined by a paleontology collection manager /
> preparator not yet described here. Marta and Diego (P1, P2 — laboratory) become secondary and are
> retained as a comparison case in the interview plan. The reason is not that lab pain is smaller,
> but that lab users are the ones we cannot reach: see market-validation §6 and §7.

**Important caveat:** these personas are constructed from desk research
([domain-research.md](../research/domain-research.md)), not from interviews. They are
hypotheses to test in Phase 2, and they are labelled with what would falsify them.

---

## P1 — Marta, laboratory manager in a university research group (primary)

- **Context:** molecular ecology group, 8 people, two −80 °C freezers and one −20 °C, roughly
  4,000 tubes. Shared Windows desktop in the lab plus her own laptop.
- **Tools today:** one `samples_master.xlsx` on a network drive, plus three divergent copies.
- **Goals:** know where everything is; stop being the human index; hand the system over
  cleanly when she goes on leave.
- **Frustrations:** people move tubes without recording it; students invent their own IDs;
  she has no way to prove what a sample's history was.
- **Constraints:** cannot install a server; no software budget; the group will not adopt
  anything that slows down data entry.
- **What success looks like for her:** a student can find and move a tube correctly without
  asking her, and the record shows who did it.
- **Falsified if:** she turns out to be unwilling to give up spreadsheet flexibility, or her
  institution mandates an existing platform.

## P2 — Diego, PhD student / research assistant (primary, highest-volume user)

- **Context:** does most of the physical work; registers new samples, aliquots, retrieves
  tubes for experiments.
- **Goals:** register a batch fast; find things fast; not be blamed for missing samples.
- **Frustrations:** typing the same metadata 200 times; a UI that requires six clicks per
  sample; being told the box position is occupied only after walking to the freezer.
- **Constraints:** works with cold gloves at a freezer, sometimes with a laptop on a bench,
  sometimes from memory afterwards.
- **What success looks like:** keyboard-first batch entry, and a search box that finds a
  sample from a partial code.
- **Falsified if:** he actually wants barcode scanning from day one and typed entry is a
  non-starter — a real possibility that must be tested early because it changes MVP scope.

## P3 — Elena, collections manager at a small natural history collection (secondary)

- **Context:** small paleontology/zoology collection, ~15,000 catalogued objects in cabinets
  and drawers, one part-time assistant, no IT department.
- **Tools today:** Access database from 2011, or a spreadsheet, or a card index; digitisation
  is partial. Documented workflows for collections like hers assume student labour and
  off-the-shelf tools ([Marsico et al. 2017](https://doi.org/10.3732/apps.1600125)).
- **Goals:** find objects for researchers and loans; record where an object went and when it
  came back; eventually publish occurrence data.
- **Frustrations:** the "proper" systems (Specify, Symbiota, Arctos) need a server or a
  consortium membership; her hierarchy is cabinets and drawers, not freezers and racks.
- **Constraints:** permanence matters — records must outlive the software; formats must be
  open.
- **What success looks like:** a portable file, a container tree that matches her furniture,
  and a Darwin Core export when she is ready to publish.
- **Falsified if:** her real blocker is taxonomy/determination management rather than
  location and custody — in which case Specify is the honest recommendation and she is not
  our user.

## P4 — Andrés, field researcher (tertiary, out of MVP scope)

- **Context:** collects specimens in the field, days without connectivity, records in a
  notebook and transcribes later.
- **Goals:** capture collection events at the point of collection; reconcile with the lab
  later.
- **Why out of scope:** mobile capture and reconciliation/merge are a different product
  problem (conflict resolution, offline sync) that would consume the entire MVP. His needs
  are served in the MVP only by CSV import of transcribed field data.
- **Design consequence today:** collection-event metadata should not be structurally
  impossible to add later; nothing more.

## P5 — Priya, PI / group leader (buyer-ish, not a user)

- **Context:** rarely touches the tool; cares about grant reporting, reproducibility
  requirements, and not losing a decade of samples.
- **Goals:** be able to say where the group's material is and demonstrate traceability;
  avoid vendor lock-in and per-seat costs.
- **Relevance:** she is the person who would eventually approve paying for hosting or
  support. She is not who we design the UI for.
- **Falsified if:** institutional procurement or data-governance policy forbids
  locally-stored research data, which would invert our entire value proposition.

---

## Anti-personas (people we are deliberately not serving)

- **Regulated clinical biobank / trial sponsor.** Needs validation, audit compliance,
  21 CFR Part 11-style controls, consent management. Freezerworks and OpenSpecimen exist;
  we would be irresponsible to compete here.
- **Analytical service laboratory.** Wants requests, worksheets, QC and certificates of
  analysis. SENAITE exists.
- **Large museum with an IT department.** Should run Specify, Arctos or a Symbiota portal.
- **Molecular biology design workflows.** Benchling exists and is free for academics.

## What we need from Phase 2 validation

For P1–P3, five to eight conversations covering:
1. the exact wording of the question they ask when they cannot find something;
2. how many items enter and move per week, and in what batch sizes;
3. whether the shared computer means "single user" is acceptable;
4. whether barcode scanning is table stakes;
5. what their spreadsheet columns actually are (this is the real schema);
6. whether their database file would end up in a cloud-synced folder.
