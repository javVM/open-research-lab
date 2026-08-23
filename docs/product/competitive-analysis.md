# Competitive analysis — sample, specimen and collection management software

Status: Phase 0 (discovery). Last updated: 2026-08-23.
All pricing figures are publicly published prices as accessed on 2026-08-23 and will drift.
Where a vendor does not publish prices, this document says so rather than guessing.

---

## 1. Summary of the landscape

The field splits into four groups. Sample Operations is not competing with all of them.

1. **Biobank / biospecimen LIMS** — OpenSpecimen, Freezerworks, LabCollector, eLabInventory.
   Deep specimen lifecycle features, server-based, priced for funded institutions.
2. **Natural history collection management systems** — Specify, Arctos, Symbiota.
   Free or consortium-funded open source, extremely strong on taxonomy/occurrence data and
   publishing to GBIF, weak-to-absent on "where is the tube in the freezer" ergonomics, and
   all require server infrastructure or joining a consortium.
3. **General lab platforms / ELNs** — Benchling, LabKey, eLabFTW, SENAITE.
   Inventory is a side module of a notebook or an analytical LIMS.
4. **Lightweight cloud inventory** — Quartzy.
   Free, genuinely easy, but consumables-and-ordering oriented and cloud-only.

**Where the gap is:** none of these is an *install-free, offline, single-file, location-first*
tool for a group of 1–10 people with no server and no IT support. That is a narrow but real
gap. It is also a gap that exists partly because it is a *small* market — see §4.

---

## 2. Competitor detail

### OpenSpecimen (Krishagni Solutions)
- **Users:** biobanks and biorepositories, institutional scale.
- **Core functionality:** planned/unplanned collections, consent and participants, storage
  and inventory management, specimen request and distribution, shipping, lifecycle events,
  full audit trail, barcode printing, bulk CSV operations, REST APIs, instrument
  integrations ([feature list](https://github.com/krishagni/openspecimen)).
- **Deployment:** self-hosted or vendor cloud. Requires Tomcat 9, Apache 2.4, MySQL 8.4 (or
  Oracle) and Java JDK 17; installed as a system service
  ([architecture](https://openspecimen.atlassian.net/wiki/spaces/CAT/pages/1116042/Architecture),
  [deployment steps](https://openspecimen.atlassian.net/wiki/spaces/CAT/pages/289964033/Deployment+steps)).
- **Open source:** yes, BSD 3-clause.
- **Published pricing:** the software is free, the *product* is not. Vendor pricing pages
  list Starter Biobank USD 75,000 one-time (≤5 users, vendor cloud only), Medium-Scale
  USD 100,000 one-time (≤10 users), Institutional USD 150,000 one-time (unlimited users),
  plus annual support from USD 35,000 and USD 35,000 one-time for integrations
  ([pricing](https://www.openspecimen.org/pricing/)).
- **Strengths:** feature completeness, real biobank credibility, configurable custom forms.
- **Weaknesses for our users:** the stack alone disqualifies a lab without IT; the
  commercial framing signals "enterprise"; conceptual weight (consents, participants,
  distributions) is overhead for a 3-person group.
- **Complexity:** high.

### Specify 7 (Specify Collections Consortium)
- **Users:** natural history and geological collections, museums, herbaria.
- **Core functionality:** full collection object management, taxonomy, agents, loans,
  accessions, workbench data import, reporting, GBIF-oriented data publishing.
- **Deployment:** self-hosted via Docker/Podman compose, or SCC-hosted. Recommended minimum
  for small/medium installs is 4 CPU cores and 8–16 GB RAM; Windows requires WSL
  ([install instructions](https://discourse.specifysoftware.org/t/specify-7-installation-instructions/755)).
- **Open source:** yes, GPL-3.0 ([specify7](https://github.com/specify/specify7/)).
- **Published pricing:** software free; the consortium funds development through membership.
  Affiliate memberships are priced per collection at USD 0–750 (Tiny), 1,500 (Small),
  3,000 (Medium), 6,000 (Large), 8,000 (Extra Large) per year, with institutional tracks at
  USD 25,000/50,000/100,000/150,000+ per year and a USD 500/year student membership
  ([membership](https://www.specifysoftware.org/membership/)).
- **Strengths:** mature, discipline-correct data model; real community; free at the software
  level; hosting available; documented small-collection workflows exist
  ([Marsico et al. 2017](https://doi.org/10.3732/apps.1600125)).
- **Weaknesses for our users:** heavy to run yourself; the data model is catalogue-first,
  and physical storage location is not the centre of the UX; a lab freezer is not really
  what it is for.
- **Complexity:** high.

### Arctos
- **Users:** natural and cultural history collections; a consortium of museums (5M+ records).
- **Core functionality:** catalog records, agents, collecting events and georeferencing,
  transactions (loans, accessions, permits), object tracking with barcodes/RFID, media,
  citations ([about](https://arctosdb.org/about/)); peer-reviewed
  ([Cicero et al. 2024, PLOS ONE](https://doi.org/10.1371/journal.pone.0296478)).
- **Deployment:** *not* self-installed in practice — hosted centrally at TACC for consortium
  members ([system details](https://arctosdb.org/about/details/system/)).
- **Open source / commercial:** community-governed, membership-funded. Fees comprise a base
  subscription (USD 110 as of 2024-08-01), a tiered per-record fee and an administration fee
  ([financial contributions](https://arctosdb.org/join-arctos/financial-contributions/)).
- **Strengths:** exceptional data richness and community curation; object tracking is
  first-class.
- **Weaknesses for our users:** you join a consortium rather than install software; no local
  offline mode; wrong shape entirely for a molecular lab.
- **Complexity:** high (organisational as much as technical).

### Symbiota
- **Users:** biodiversity collections publishing to shared thematic portals; 56 portals,
  1,900+ collections, 90M+ occurrences ([symbiota.org](https://symbiota.org/)).
- **Core functionality:** collaborative digitisation, label-image data entry, batch
  georeferencing, validation/cleaning, loan management, checklists and keys, publishing to
  GBIF/iDigBio.
- **Deployment:** self-hosted Apache + PHP 8.1+ (8.2 recommended) + MariaDB 10.3+/MySQL 8,
  with manual schema creation and credential file editing
  ([INSTALL.md](https://github.com/BioKIC/Symbiota/blob/master/docs/INSTALL.md)); most users
  instead join an existing hosted portal.
- **Open source:** yes, GPL-2.0.
- **Published pricing:** no product price; portals are grant/institution funded.
- **Strengths:** unmatched for *publishing and aggregating* occurrence data; strong network
  effects.
- **Weaknesses for our users:** portal-and-publication centric, not custody centric; PHP
  server; no offline single-user story.
- **Complexity:** medium-high.

### SENAITE (formerly Bika LIMS)
- **Users:** analytical, environmental, agricultural and health laboratories.
- **Core functionality:** sample registration and analytical workflow, worksheets, QC,
  instrument integration, certificates of analysis, invoicing; a dedicated `senaite.storage`
  module exists for sample storage.
- **Deployment:** Plone/Zope add-on stack; Docker distributions exist from commercial
  providers ([senaite.core](https://github.com/senaite/senaite.core),
  [Bika docker suite](https://github.com/bikalims/bika.lims)).
- **Open source:** yes, GPL-2.0. Commercial support from Bika Lab Systems and others.
- **Published pricing:** not published; service-provider model.
- **Strengths:** genuine ISO-17025-oriented analytical workflow depth.
- **Weaknesses for our users:** analytical-request paradigm and Plone stack are both far
  from "where is my tube"; installation and customisation expect a specialist.
- **Complexity:** high.

### LabKey Server
- **Users:** research groups and institutions integrating assay/clinical/biospecimen data.
- **Core functionality:** data integration and warehousing, assay pipelines, SQL engine,
  sample/biospecimen modules, role-based security, R/reporting integrations.
- **Deployment:** self-hosted Java server (Community Edition) or vendor Premium hosting.
- **Open source:** Community Edition under Apache-2.0 terms, explicitly with *no* technical
  or development support; advanced features and support are Premium-only
  ([editions](https://www.labkey.org/Documentation/wiki-page.view?name=labkeyServerEditions),
  [community download terms](https://www.labkey.com/download-community-edition/)).
- **Published pricing:** Premium pricing not published.
- **Strengths:** serious data-integration platform; good open/paid boundary precedent to
  study for our own monetisation thinking.
- **Weaknesses for our users:** heavyweight, admin-oriented, not a physical-inventory tool.
- **Complexity:** high.

### Benchling
- **Users:** molecular biology and biotech R&D; also widely used by academics.
- **Core functionality:** ELN, molecular biology suite (cloning, CRISPR, alignment), registry
  and inventory in paid tiers.
- **Deployment:** cloud only.
- **Open source:** no.
- **Published pricing:** free academic plan covering Notebook and Molecular Biology
  ([academic](https://www.benchling.com/academic)); commercial pricing is sales-gated and
  not published ([pricing](https://www.benchling.com/pricing)).
- **Strengths:** best-in-class molecular design UX; free for academics is a formidable
  competitive fact.
- **Weaknesses for our users:** the free academic tier reportedly excludes Registry and
  Inventory, cloud-only conflicts with data-sovereignty preferences, and nothing is
  paleontology/collections shaped.
- **Complexity:** low for users, zero control for institutions.

### eLabFTW
- **Users:** academic research labs wanting an ELN plus resource inventory.
- **Core functionality:** experiments and protocols with timestamping/signing, resource
  inventory, booking/scheduler, team permissions, FAIR-oriented `.eln` import/export
  ([elabftw.net](https://www.elabftw.net/)).
- **Deployment:** self-hosted server, Docker/Podman on Linux, MySQL required — explicitly
  not PostgreSQL, MariaDB or SQLite; ~2 GB RAM and a Linux host
  ([docs](https://doc.elabftw.net/)).
- **Open source:** yes, AGPL-3.0, with no paywalled features; paid hosting/support available.
- **Published pricing:** software free; hosting quoted separately.
- **Strengths:** exemplary open-source posture, strong community, no crippled free tier,
  serious about data portability.
- **Weaknesses for our users:** it is a notebook first; inventory is resource-oriented, not
  freezer-position-oriented; still needs a server.
- **Complexity:** medium.

### Quartzy
- **Users:** lab managers handling consumables, orders and stock.
- **Core functionality:** inventory with locations, requests/approvals workflow, ordering
  through the Quartzy shop, barcode labels and mobile scanning
  ([quartzy.com](https://www.quartzy.com/), [inventory tour](https://www.quartzy.com/tour/inventory)).
- **Deployment:** cloud only.
- **Open source:** no.
- **Published pricing:** historically free for core inventory/requests with revenue from the
  marketplace; subscription tiers and trials are referenced in their support docs
  ([subscription FAQ](https://support.quartzy.com/hc/en-us/articles/4405994277147-Quartzy-Subscription-FAQs)).
  Treat "free" as a moving target.
- **Strengths:** the lowest-friction option in the market; proves that free + easy wins
  adoption in labs.
- **Weaknesses for our users:** consumables not specimens; no provenance/lineage; no
  offline; scientific data in a vendor cloud funded by a procurement business model.
- **Complexity:** low.

### Freezerworks
- **Users:** biorepositories, clinical trial sample management.
- **Core functionality:** sample management with storage hierarchy, shipping, requisitions,
  study/visit modelling, roles and security, validation-oriented features.
- **Deployment:** vendor-managed subscription (desktop/hosted editions historically).
- **Open source:** no.
- **Published pricing:** tiered plans published at USD 832 / 1,862 / 3,038 / 4,353 per month
  (5 seats included, billed annually), with add-ons such as premium support at
  USD 2,996–15,698/year ([pricing](https://www.freezerworks.com/pricing)).
- **Strengths:** the clearest "serious freezer inventory" product; predictable published
  pricing; regulated-environment credibility.
- **Weaknesses for our users:** roughly USD 10k+/year minimum is out of reach for a small
  academic group — this is the strongest evidence that the low end of the market is
  economically abandoned.
- **Complexity:** medium-high.

### LabCollector
- **Users:** small-to-medium labs wanting a modular LIMS/LIS with inventory.
- **Core functionality:** modular inventory (samples, strains, reagents, equipment), ELN
  add-on, instrument integration, reporting, compliance features.
- **Deployment:** on-premise or vendor cloud.
- **Open source:** no.
- **Published pricing:** vendor publishes per-user pricing (e.g. a LIMS/LIS pack listed at
  USD 1,300/user/year) with module add-ons ([pricing](https://labcollector.com/lc-pricing/));
  third-party estimates put first-year SMB totals at roughly USD 4,000–15,900 for 10 users
  ([ITQlick](https://www.itqlick.com/labcollector-lims/pricing)) — third-party figures, treat
  with caution.
- **Strengths:** modularity; genuinely aimed at smaller labs; both deployment models.
- **Weaknesses for our users:** per-user pricing punishes small shared-budget groups; dated
  UX; closed source.
- **Complexity:** medium.

### eLabInventory (eLabNext)
- **Users:** labs needing sample/inventory management, often alongside eLabJournal.
- **Core functionality:** sample and storage management, freezer/box visualisation, barcode
  support, on-premise or private-cloud options with a licence file model
  ([system licence docs](https://www.elabinventory.com/doc/SystemLicense.html)).
- **Open source:** no.
- **Published pricing:** not published; per-user licences via sales
  ([pricing FAQ](https://us.elabinventory.com/doc/Pricing.html)).
- **Strengths:** good storage visualisation; on-premise possible.
- **Weaknesses for our users:** licence-server friction, opaque pricing, closed source.
- **Complexity:** medium.

### Adjacent: SampleDB, and hobby-grade freezer trackers
- [SampleDB](https://github.com/sciapp/sampledb) (MIT, Forschungszentrum Jülich) is a
  web-based sample/measurement metadata database with a schema system and JSONB search —
  architecturally the closest *thinking* to ours, but it requires PostgreSQL + Docker and is
  metadata-first rather than location-first.
- Small self-hosted trackers exist (e.g. [freezer-tracker](https://github.com/Ryan-Haines/freezer-tracker),
  FastAPI + SQLite + Docker) but are personal-scale projects with no provenance model. They
  do demonstrate that "SQLite file you can back up by copying" resonates.

---

## 3. Feature comparison at a glance

| | Runs offline, no server | Install-free for non-technical user | Storage position first-class | Append-only history | Open source | Free at small scale |
|---|---|---|---|---|---|---|
| OpenSpecimen | ✗ | ✗ | ✓ | ✓ | ✓ (BSD-3) | software yes / product no |
| Specify 7 | ✗ | ✗ | partial | partial | ✓ (GPL-3) | ✓ |
| Arctos | ✗ (hosted) | n/a | ✓ | ✓ | community | membership fee |
| Symbiota | ✗ | ✗ | partial | partial | ✓ (GPL-2) | ✓ |
| SENAITE | ✗ | ✗ | ✓ (module) | ✓ | ✓ (GPL-2) | ✓ |
| LabKey CE | ✗ | ✗ | partial | ✓ | ✓ (Apache-2.0) | ✓ (unsupported) |
| Benchling | ✗ | ✓ (cloud) | paid tiers | ✓ | ✗ | academic tier |
| eLabFTW | ✗ | ✗ | partial | ✓ | ✓ (AGPL-3) | ✓ |
| Quartzy | ✗ | ✓ (cloud) | partial | ✗ | ✗ | ✓-ish |
| Freezerworks | vendor | ✗ | ✓ | ✓ | ✗ | ✗ |
| LabCollector | on-prem option | ✗ | ✓ | ✓ | ✗ | ✗ |
| **Sample Operations (proposed)** | ✓ | ✓ | ✓ | ✓ | ✓ (Apache-2.0) | ✓ |

The last row is a design intent, not an achievement.

---

## 4. Honest assessment of our differentiation

**Defensible differentiation (evidence-based):**
1. **Zero-install, zero-server, offline.** Every open-source competitor requires a database
   server and, in practice, a sysadmin. This is a real, verifiable difference, not marketing.
2. **The data is one file the user owns.** Backup = copy the file. Nobody in this list offers
   that.
3. **Location and custody as the product, not a module.** The primary screen answers "where
   is it and what happened to it" instead of being a catalogue or a notebook.
4. **Neutral between lab samples and collection specimens** by modelling the physical layer
   and keeping discipline metadata extensible.

**Where we must not kid ourselves:**
- **Specify, Symbiota and eLabFTW are free, mature and community-backed.** For a collection
  that can run a server, "use Specify" is often the correct advice, and our docs should say
  so. Competing on features with a 20-year consortium product is not a plan.
- **Quartzy and Benchling have set the expectation of free + zero setup in the cloud.** Our
  "local-first" pitch must be framed as data sovereignty and speed, not as cost.
- **The abandoned low end may be abandoned for a reason:** groups with no budget and no IT
  also have low willingness to pay and low tolerance for migration effort. Adoption may come
  cheaply while revenue does not.
- **Feature gravity is brutal.** Barcodes, batch operations and label printing will be
  requested immediately, and those are the features that make "simple" collapse.

**Conclusion:** the gap is real but narrow, and it is a *usability and deployment* gap rather
than a functional one. That is a legitimate basis for a product, and a poor basis for
claiming these tools are inadequate. The competitive-analysis message we should carry into
our own README is: *if you can run a server and you manage a museum collection, use Specify
or Symbiota. If you have a freezer, a spreadsheet and no server, use this.*

## 5. Sources

Every claim above links to its source inline. Pricing accessed 2026-08-23:
OpenSpecimen, Specify SCC membership, Arctos financial contributions, Freezerworks,
LabCollector (+ third-party ITQlick estimate), Benchling academic, Quartzy subscription FAQ.
Deployment requirements accessed 2026-08-23 from each project's own installation
documentation.
