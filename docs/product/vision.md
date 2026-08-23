# Vision — Open Research Lab and Sample Operations

Status: Phase 0 (discovery). Last updated: 2026-08-23.

## 1. Open Research Lab

Open Research Lab builds practical open-source software for scientific research, starting
with the least glamorous and most universal problem in any research group: **knowing what
physical material you have, where it is, and what has happened to it.**

Principles, in priority order:

1. **Usefulness before architecture.** A tool that a three-person lab uses every day beats a
   beautifully layered system nobody installs.
2. **Local-first.** Research data belongs to the researcher, on their machine, in an open
   format, readable without our software.
3. **Nothing is silently destroyed.** Provenance, timestamps and original values survive
   edits, imports and mistakes.
4. **Standards on the boundary, simplicity inside.** We map to Darwin Core, MIxS and GGBN on
   export; we do not build an ontology.
5. **Honest about alternatives.** When an existing tool is the better answer for a user, our
   documentation says so.
6. **Minimal infrastructure.** Zero-cost to run is a feature, not a phase.

## 2. What Open Research Lab is *not* going to be (yet)

The initial brief sketches an ecosystem: Sample Operations, PaleoMapper, Dataset Validator,
Field Research Tools, Taxonomy Tools, Collection Tools. **Stated plainly: building an
ecosystem before shipping one useful tool is the most likely way this project fails.** A
portfolio of half-finished scientific utilities has no users and no credibility.

Therefore the ecosystem is explicitly deferred. There will be no shared `scientific-core`
library, no cross-project abstractions, and no second product until Sample Operations has
real users who would notice if it disappeared. Shared libraries, if they ever appear, will be
extracted from working code — never designed in advance.

## 3. Sample Operations

**One-line positioning:** the sample and specimen tracker you can start using in five
minutes, offline, that never forgets where something was.

**For:** research groups and small collections of 1–10 people with no server, no IT support
and a spreadsheet they have outgrown.

**Core promise:** two questions, always answerable instantly —
*where is this item?* and *what has happened to it?*

**Shape of the product:** a desktop application. One installer, no account, no network. All
data in a single SQLite file the user can copy, back up, inspect with standard tools, and
export to CSV at any time.

**What makes it different** (see [competitive-analysis.md](competitive-analysis.md)): every
credible open-source alternative needs a database server and an administrator; every
frictionless alternative is a vendor cloud aimed at consumables or notebooks. Nobody serves
the group that has a freezer, a spreadsheet, and nothing else.

## 4. How we will know it works

- A new user records their first sample within five minutes of downloading, without reading
  documentation.
- Finding an item takes seconds, and the answer is a full physical path.
- Every movement in the app is recorded with a timestamp — no exceptions, no way around it.
- A user can leave the project at any time with a complete CSV export and a copy of the
  database file, and lose nothing.

## 5. Three-year direction (a direction, not a commitment)

| Horizon | What exists | Who it serves |
|---|---|---|
| Now → v0.1 | Local desktop app: containers, items, positions, movement history, search, CSV import/export | One group, one machine |
| v0.2–v0.4 | Batch operations, barcode/QR, box visualisation, derived samples, Darwin Core export, attachments | The same group, doing more of its real work |
| v1.x | Optional multi-user on a shared local machine or self-hosted instance; documented import/export contracts | A department that wants one shared install |
| Beyond | Optional hosted sync/backup for groups that want it, run as a service by us or by an institution | Groups willing to pay to not run infrastructure |

Each step must be justified by observed user need, not by this table.

## 6. Open source and the commercial boundary

The project is Apache-2.0 (matching the repository's existing licence) and open-source-first.
The rule we commit to: **the open-source version is complete for a single group on its own
hardware.** We will not withhold export, history, search or capacity limits to create upgrade
pressure. eLabFTW's "no paywalled features" posture is the model we respect; LabKey's
community/premium split is the pattern we would study if we ever needed one.

Plausible future revenue, none of which requires crippling the product:

- **Hosted sync and managed backup** for groups that do not want to run anything.
- **Multi-group / institutional deployment** with permissions and shared vocabularies.
- **Migration and onboarding services** — moving a decade of spreadsheets into a clean
  database is real, chargeable work.
- **Support and training contracts** for institutions that need someone accountable.
- **Institutional/consortium sponsorship**, the model that funds Specify and Arctos.

Frank assessment: our target users are the *least* able to pay in this market. Freezerworks
sells to organisations at USD 832+/month precisely because it avoids that segment. Our
commercial path, if there is one, runs through institutions and hosting — not through the
small groups we optimise the product for. We should therefore build for adoption and
credibility now and treat revenue as an open question, not a design input.

Nothing related to billing, licensing enforcement, telemetry or accounts will be built in the
MVP.

## 7. Non-negotiables

- No telemetry. No analytics. No phoning home. Ever, in the open-source app.
- No feature that requires an account to use local data.
- No proprietary storage format — SQLite plus CSV export, always.
- No silent data loss — every destructive-looking operation is archival and reversible.
