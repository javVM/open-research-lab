# Domain research — scientific sample and specimen management

Status: Phase 0 (discovery). Last updated: 2026-08-23.

This document records what we learned about how researchers actually manage samples and
specimens, which standards exist, and which of them matter for a first product. It is
research input, not a specification. Sources are linked inline; where we are inferring
rather than citing, the text says so explicitly.

---

## 1. Two communities, one physical problem

The brief mentions biology *and* paleontology, laboratories *and* collections. These are
genuinely different worlds, and conflating them is the most likely way to build something
nobody wants.

| | Laboratory / biobank world | Natural history collection world |
|---|---|---|
| Physical unit | sample, aliquot, tube, plate well | specimen, lot, catalogued object, part |
| Container hierarchy | freezer → rack/shelf → box → position | building → room → cabinet → drawer/shelf → jar/tray |
| Identifier culture | internal sample IDs, barcodes on tubes | accession number + catalogue number, often historical and irregular |
| Dominant data standard | MIxS, SPREC, GGBN (for genomic samples) | Darwin Core / ABCD, published to GBIF |
| Time horizon | weeks to years; samples are consumed | decades to centuries; objects are permanent |
| Destructive events | routine (aliquoting, extraction, consumption) | exceptional, tightly controlled, must be documented |
| Typical existing tool | Excel, freezer software, LIMS | Specify / Arctos / Symbiota, or Excel |

**What they share** is exactly the thing the brief highlights: a *physical location*
problem ("where is this thing?") and a *history* problem ("what happened to it?"). That
shared core — object, container hierarchy, position, movement history — is where a single
product can serve both without becoming an ontology project.

**What they do not share** is the metadata. Laboratory sample metadata (organism, tissue,
preservation, extraction protocol) and collection metadata (taxon, collecting event,
georeference, determination history) barely overlap. Trying to model both natively in an
MVP would double the domain and halve the quality.

**Research conclusion:** model the *physical/custody* layer as first-class, and treat
discipline-specific scientific metadata as extensible fields in the first version rather
than hard-coded schema. This is the single most consequential finding in this document.

---

## 2. How work actually happens today

Observations that shaped the MVP scope:

1. **Spreadsheets are the incumbent, and they are not entirely irrational.** A spreadsheet
   is free, offline, portable, requires no permission from IT, and is understood by
   everyone in the lab. Any replacement that is *harder to start* than a spreadsheet
   loses, regardless of features.
2. **Small collections often have no IT support at all.** The reference workflow for
   digitising a small herbarium assumes student labour and off-the-shelf software, and
   reports databasing rates of 25–47 specimens/hour per person
   ([Marsico et al. 2017, *Applications in Plant Sciences*](https://doi.org/10.3732/apps.1600125)).
   Data entry speed is therefore a *primary* product metric, not a nicety.
3. **Chain-of-custody failures are expensive and common.** In clinical/biopharma sample
   operations, 95% of surveyed professionals reported budget increases, delays, or data
   quality concerns caused by inventory or bio-sampling issues
   ([Slope × Fierce Biotech survey](https://23946397.fs1.hubspotusercontent-na1.net/hubfs/23946397/Slope%20Resources/survey%20report/Slope%20Resource%20%5Bsurvey%20report%5D%20Slope%20%E2%9C%95%20Fierce%20Biotech%20Survey.pdf)).
   That survey covers a much better-resourced segment than our target users, so we treat
   it as evidence that the *problem class* is real and costly, not as a measurement of our
   users' pain.
4. **Even with a quality management system and dedicated software, biobanks measure a
   nonzero discrepancy rate** between paper tracking sheets and the database — under 2% in
   one documented biobank QMS
   ([Fournier et al. 2022, *PLOS ONE*](https://doi.org/10.1371/journal.pone.0278780)).
   Implication: the product must make discrepancies *visible and correctable with history
   preserved*, not assume the database is always right.
5. **Bulk events dominate.** "I received 200 specimens", "I moved 50 tubes from freezer A
   to B", "I need to export project X". Single-record CRUD screens are the wrong primary
   interaction; batch entry, batch move, and import/export are the real workflow.
6. **The question that gets asked out loud is a location question.** "Which freezer has
   ABC-123?" is asked far more often than any analytical question. Search → location →
   history is the golden path.

---

## 3. Identifiers

Identifier design is where scientific software most often does long-term damage, so this
was researched deliberately.

- **Human-readable identifiers are not globally unique and never will be.** `SAMPLE-001`,
  accession `1998.42`, and catalogue numbers reused after a renumbering are all normal.
  Darwin Core separates `dwc:catalogNumber` (the institution's label),
  `dwc:otherCatalogNumbers`, and `dwc:occurrenceID` / `dwc:materialEntityID` (globally
  unique identifiers) precisely for this reason
  ([Darwin Core list of terms](https://dwc.tdwg.org/list/)).
- **Therefore:** every entity needs an internal, opaque, stable identifier that is never
  shown as the user's "name", plus one or more human-readable codes that are unique only
  within a declared scope (institution/collection). This mirrors the standards rather than
  inventing a scheme.
- **Sortable identifiers are worth the small extra effort.** ULID/UUIDv7-style
  lexicographically sortable IDs keep insert locality in indexes and make debugging and
  CSV round-tripping much more pleasant than random UUIDv4, at no interoperability cost.
- **Public persistent identifiers (ARK, DOI) are a later concern.** ARK best practice
  recommends minting identifiers early — even "at object birth"
  ([ARK Alliance best practices](https://arks.org/about/best-practices/)) — but ARKs
  require a resolvable service and an institutional commitment we cannot make at $0
  infrastructure. What we *can* do now is not block it: keep an `external_identifiers`
  concept so an ARK/DOI/GBIF `occurrenceID` can be attached later without migration pain.

---

## 4. Standards worth knowing (and how much of each to adopt)

| Standard | What it is | Relevance to us now |
|---|---|---|
| [Darwin Core (TDWG)](https://dwc.tdwg.org/list/) | Term vocabulary for biodiversity occurrence/specimen data; basis of GBIF publishing | **Adopt as export mapping target.** Name our fields so a Darwin Core CSV export is mechanical, not a rewrite. |
| [Darwin Core Archive / GBIF publishing](https://techdocs.gbif.org/en/data-publishing/) | Zipped DwC + metadata, the standard way to publish to GBIF (usually via IPT) | **Not in MVP.** A "DwC-A export" is a credible v0.x differentiator for collections users. |
| ABCD | Richer XML biodiversity schema, common in European collections | Awareness only; no implementation planned. |
| [MIxS (GSC)](https://genomicsstandardsconsortium.github.io/mixs/about/) | Minimum information checklists for sequence-associated samples | Relevant if/when we serve sequencing workflows; shapes our "extensible field set" design. |
| [GGBN data standard](https://wiki.ggbn.org/ggbn/GGBN_Data_Standard) | Terms for tissue/DNA/environmental samples; designed to be used *with* DwC or ABCD, incorporates MIxS terms | **Validates our architecture:** the community itself layers sample-facts on top of occurrence-facts. Our physical/custody core plus pluggable metadata mirrors that layering. |
| [ISBER Best Practices, 5th ed. (2023)](https://doi.org/10.1089/bio.2023.0140) | Consensus operational practices for repositories: collection, storage, retrieval, distribution | Source of requirements language for audit trail, storage conditions, and destruction/disposal handling. Paywalled; treat as guidance, do not claim compliance. |
| SPREC | Standard PREanalytical Code for biospecimen handling | Out of scope; note that GGBN can carry it if ever needed. |

**Rule adopted:** we map to standards on export and never invent a competing vocabulary.
We do not claim conformance or certification anywhere in the product or docs.

---

## 5. Storage hierarchy: what to model

Real hierarchies observed across the two communities are inconsistent in depth:
`room → freezer → shelf → rack → box → position` (lab), `room → cabinet → drawer → tray`
(entomology), `shelf → jar` (wet collections), `field site` (not storage at all).

A fixed five-level hierarchy will be wrong for most installations. Two viable models:

- **(a) Fixed levels** — simple queries, simple UI, wrong for half of users.
- **(b) Self-referencing container tree with typed nodes** — one `storage_unit` table with
  `parent_id` and a `unit_type` (room, freezer, shelf, rack, box, cabinet, drawer…), plus
  *grid-capable* units that own addressable positions.

We recommend **(b) with a hard constraint**: only "grid" units (boxes, trays, plates) have
enumerated positions; everything above is a nestable container. This is barely more
complex than (a) — one recursive query for the path — and it removes the single biggest
source of "this tool doesn't fit my lab".

The location question then reduces to: *materialise the path* (`Room 3 › Freezer F01 ›
Rack 03 › Box B17 › C04`) for display and search, computed from the tree.

---

## 6. Provenance and events: how much is enough?

The brief lists a full lineage chain (specimen → subsample → extraction → aliquot →
result). Research conclusion: **lineage and audit history are two different mechanisms and
should not be merged.**

1. **Append-only event log** — what happened to *this* object: created, moved, updated,
   split, loaned, returned, disposed. Answers "what happened to sample X". Cheap, and it
   is the feature spreadsheets fundamentally cannot provide.
2. **Derivation edges** — a directed acyclic parent/child relationship between physical
   objects (`derived_from`). Answers "where did this DNA extract come from". One nullable
   parent reference plus an event is enough for v1; a general process/activity graph
   (W3C PROV style) is not.

Explicitly rejected for the MVP: event sourcing as the primary persistence model, and a
generic "activity/agent/entity" ontology. Both are defensible in the abstract and would
sink a two-person project.

**Non-negotiable invariants identified by research:**
- No destructive delete of anything that carries provenance; archive/disposition instead
  (`dwc:disposition` exists for exactly this reason).
- A move must be atomic with the event that records it.
- Occupied positions cannot be silently overwritten.
- Original values must remain recoverable after an edit or a bad import.

---

## 7. Existing tools — capability landscape

Detailed comparison lives in [../product/competitive-analysis.md](../product/competitive-analysis.md).
The research-relevant summary:

- **Nothing in the surveyed field is a zero-install, single-file, offline application.**
  Every serious option is a server product: OpenSpecimen needs Tomcat 9 + MySQL 8 + Java 17
  ([deployment docs](https://openspecimen.atlassian.net/wiki/spaces/CAT/pages/289964033/Deployment+steps),
  [architecture](https://openspecimen.atlassian.net/wiki/spaces/CAT/pages/1116042/Architecture));
  Specify 7 recommends 4 CPU cores and 8–16 GB RAM via Docker/Podman compose
  ([install guide](https://discourse.specifysoftware.org/t/specify-7-installation-instructions/755));
  Symbiota needs Apache + PHP 8.1+ + MariaDB/MySQL with manual `dbconnection.php` editing
  ([INSTALL.md](https://github.com/BioKIC/Symbiota/blob/master/docs/INSTALL.md));
  eLabFTW requires a Linux server with Docker and MySQL specifically
  ([docs](https://doc.elabftw.net/)); SENAITE is a Plone add-on
  ([senaite.core](https://github.com/senaite/senaite.core)).
- **The free/cheap tools that *are* easy to start are cloud-hosted and not
  location-first** (Quartzy, Benchling academic tier). They solve consumables/procurement
  or molecular biology, not physical specimen custody, and the data lives elsewhere.
- **The gap is therefore narrow but real:** offline, install-free, storage-position-first
  custody tracking with a portable file, for groups too small for a server.

This gap is our hypothesis. It is not yet validated with users — see the risk register in
[../product/problem-statement.md](../product/problem-statement.md).

---

## 8. Open questions for user validation

These cannot be answered by desk research and should gate Phase 4 scope:

1. Do target users care about barcode/QR scanning *from day one*, or is typed search
   acceptable for a first release? (Cheap hardware assumption to get wrong.)
2. Is single-user genuinely acceptable, or does "the shared lab computer" imply at least
   named actors on events without authentication?
3. How often are boxes reorganised wholesale (dump-and-refill) versus item-by-item moves?
   This decides whether batch move is MVP or v0.2.
4. For collections users: is Darwin Core export the actual unlock, or is it publishing to a
   Symbiota portal that matters?
5. Do users expect the database file to live in a synced folder (Dropbox/OneDrive)? If yes,
   we must design for it explicitly, because SQLite in a naively synced folder is a known
   corruption hazard.

---

## 9. Sources

- Darwin Core term list — https://dwc.tdwg.org/list/
- GBIF data publishing technical docs — https://techdocs.gbif.org/en/data-publishing/
- GGBN Data Standard — https://wiki.ggbn.org/ggbn/GGBN_Data_Standard
- MIxS (Genomic Standards Consortium) — https://genomicsstandardsconsortium.github.io/mixs/about/
- ISBER Best Practices 5th edition — https://doi.org/10.1089/bio.2023.0140
- ARK implementation best practices — https://arks.org/about/best-practices/
- Marsico et al. 2017, digitising a small herbarium — https://doi.org/10.3732/apps.1600125
- Fournier et al. 2022, biobank QMS — https://doi.org/10.1371/journal.pone.0278780
- Slope × Fierce Biotech clinical inventory survey — https://23946397.fs1.hubspotusercontent-na1.net/hubfs/23946397/Slope%20Resources/survey%20report/Slope%20Resource%20%5Bsurvey%20report%5D%20Slope%20%E2%9C%95%20Fierce%20Biotech%20Survey.pdf
- OpenSpecimen deployment / architecture — https://openspecimen.atlassian.net/wiki/spaces/CAT/pages/289964033/Deployment+steps , https://openspecimen.atlassian.net/wiki/spaces/CAT/pages/1116042/Architecture
- Specify 7 installation — https://discourse.specifysoftware.org/t/specify-7-installation-instructions/755
- Symbiota install requirements — https://github.com/BioKIC/Symbiota/blob/master/docs/INSTALL.md
- eLabFTW documentation — https://doc.elabftw.net/
- SENAITE core — https://github.com/senaite/senaite.core
- Arctos — https://arctosdb.org/about/
