# Problem statement — Sample Operations

Status: Phase 0 (discovery), partially superseded. Last updated: 2026-08-23.

> **Superseded in part by [market-validation.md](market-validation.md).** That analysis moved the
> beachhead from small research laboratories to **small natural-history collections**, entered
> through the paleontology community. The problem framing below still holds — the failure modes,
> the "why the spreadsheet persists" argument and the measurable outcomes apply to both markets —
> but where this document says "lab", read "small collection or lab", and treat §3's persona
> emphasis as reversed in priority. Risk P1 below was the correct risk: this document's market
> assumption did not survive research.

## 1. The problem in one sentence

Small research groups and collections lose time, samples and provenance because the only
tools that fit their budget and IT reality are spreadsheets, and the only tools that track
custody properly require a server, a sysadmin, or an institutional subscription.

## 2. Who has the problem

A group of 1–10 people who between them hold anywhere from a few hundred to a few tens of
thousands of physical items — tubes in freezers, jars on shelves, fossils in drawers — and
who have:

- no database server and no realistic path to getting one,
- no dedicated IT support,
- little or no software budget,
- a shared computer or a handful of laptops,
- an existing spreadsheet that is the de facto system of record.

See [personas.md](personas.md).

## 3. What goes wrong today

Observed and documented failure modes:

1. **"Where is it?" takes minutes or hours** — the spreadsheet says Box 17 and the box is not
   where the spreadsheet thinks, because someone moved it and told nobody.
2. **History is overwritten.** A spreadsheet cell records the *current* location. The
   previous location, who moved it, and when are simply gone. When a result looks wrong
   there is no way to reconstruct what happened to the sample.
3. **Silent duplicates and collisions.** Two people add `S-014`; two tubes are recorded in
   box position C04. Nothing objects.
4. **Copy-paste drift.** Freezer, rack and box names are free text and diverge
   (`F1`, `F-1`, `Freezer 1`).
5. **Bulk operations are done by hand.** Receiving 200 specimens or relocating a freezer's
   contents becomes an afternoon of dragging cells, which is exactly when mistakes enter.
6. **Knowledge leaves with people.** The postdoc who knew the numbering convention finishes
   their contract and the meaning of half the labels leaves with them.
7. **Discrepancies are invisible.** Even biobanks running a formal quality management system
   with dedicated software measure a residual mismatch between paper records and the
   database ([Fournier et al. 2022](https://doi.org/10.1371/journal.pone.0278780)); a
   spreadsheet-based group has no mechanism to detect this at all.

The cost class is documented at larger scale: 95% of surveyed biopharma professionals
reported budget increases, delays or data-quality concerns caused by inventory or
bio-sampling problems ([Slope × Fierce Biotech](https://23946397.fs1.hubspotusercontent-na1.net/hubfs/23946397/Slope%20Resources/survey%20report/Slope%20Resource%20%5Bsurvey%20report%5D%20Slope%20%E2%9C%95%20Fierce%20Biotech%20Survey.pdf)).
That population is far better resourced than ours; we cite it as evidence that the problem
class is expensive, not as a measurement of our users.

## 4. Why the current workflow persists

This is the part most competing products get wrong. The spreadsheet is not used out of
ignorance. It is used because it is:

- free, forever, with no procurement,
- installed already,
- offline and fast,
- fully understood by everyone in the room,
- trivially portable and backed up by copying,
- infinitely flexible when the workflow changes.

**Any replacement must match every one of those properties** and add what the spreadsheet
cannot do. If our tool needs a server, an account, or a 20-minute setup, it loses to Excel
regardless of how good the domain model is. This is the core design constraint of the whole
product.

## 5. Why existing tools do not fit

From [competitive-analysis.md](competitive-analysis.md):

- Serious open-source options (OpenSpecimen, Specify 7, Symbiota, eLabFTW, SENAITE) all
  require a server stack — Tomcat + MySQL + Java 17, Docker with 8–16 GB RAM, Apache + PHP +
  MariaDB, and so on. Correct choices for an institution, unavailable to our users.
- Commercial sample managers are priced for funded organisations: Freezerworks publishes
  plans from USD 832/month, LabCollector lists per-user annual pricing, OpenSpecimen's
  vendor packages start at USD 75,000 one-time.
- The frictionless free tools are cloud-only and aimed elsewhere: Quartzy at consumables and
  ordering, Benchling's free academic tier at notebook and molecular biology.
- Consortium systems (Arctos, hosted Symbiota portals) require joining an organisation, which
  is the right answer for a museum and a non-answer for a two-person lab.

## 6. The specific problem we choose to solve

> Give a small group a tool they can start using in under five minutes, offline, that always
> answers *where is this item* and *what has happened to it*, and that never silently loses
> information — with their data in a single file they own.

Everything else in the roadmap is subordinate to that sentence.

## 7. Measurable outcomes

If we cannot move these, we have not solved anything:

| Outcome | Baseline (spreadsheet) | Target |
|---|---|---|
| Time to answer "where is item X?" | minutes; sometimes a physical search | < 5 seconds from typing to full location path |
| Time from download to first sample recorded | n/a (Excel already open) | < 5 minutes, no account, no server |
| Recorded movements with attribution and timestamp | ~0% | 100% of moves made through the app |
| Positions holding two items | undetected | structurally impossible |
| Time to relocate 50 items | tens of minutes, error-prone | one batch operation, fully logged |
| Data recoverable after a bad bulk edit | usually not | always (append-only history + dry-run import) |
| Cost of backup | manual discipline | copy one file |

## 8. Explicit non-goals

- Not an ELN. We do not compete with eLabFTW or Benchling on notebooks or protocols.
- Not an analytical LIMS. No worksheets, no instrument integration, no certificates of
  analysis (SENAITE exists).
- Not a publishing portal. We will export Darwin Core; we will not aggregate or host data
  (Symbiota/GBIF exist).
- Not a museum-grade collection management system. If a collection can run Specify, our own
  documentation should recommend Specify.
- Not multi-user, not cloud, not an API platform, in the first release.

## 9. Risks to this framing

1. **Unvalidated hypothesis.** This document is desk research. No target user has been
   interviewed yet. The gap may be narrower, or differently shaped, than described.
   *Mitigation:* Phase 2 requires 5–8 conversations with real groups before Phase 4 scope is
   frozen.
2. **The low end may be economically abandoned for good reason** — no budget, no
   willingness to pay, high migration inertia. Adoption may be achievable while revenue is
   not. *Mitigation:* treat monetisation as a Phase-5+ question; do not distort the MVP for it.
3. **Excel is a formidable competitor** and "we are better than a spreadsheet" is a claim
   thousands of failed products have made. *Mitigation:* the five-minute onboarding target and
   CSV import/export are not features but survival requirements.
4. **Feature gravity.** Barcodes, label printing and batch everything will be demanded
   immediately, and each one erodes the simplicity that is our only advantage.
   *Mitigation:* the requirements document must keep a hard MVP boundary and say no in public.
5. **Serving two communities may serve neither.** *Mitigation:* the physical/custody core is
   shared; discipline metadata stays extensible; if forced to choose, we pick the community
   where we can talk to real users first.
