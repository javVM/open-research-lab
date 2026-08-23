# Market validation — choosing the beachhead

Status: Phase 1 (desk research). Last updated: 2026-08-23.
Sources: [../research/market-sources.md](../research/market-sources.md) (S-numbers below refer to
entries there). Phase 0 competitor detail: [competitive-analysis.md](competitive-analysis.md).

**Labelling convention used throughout:** **FACT** = attributable to a cited primary source.
**INFERENCE** = my reasoning from those facts, could be wrong. **OPEN QUESTION** = not knowable
from desk research; must be answered by talking to people.

**Headline:** the recommended beachhead is **B — small natural-history collections**, entered
through the paleontology sub-community as the first recruiting channel. Confidence: **MEDIUM**.
The reasoning, including why not A and why not C alone, is in §7, and §8 questions whether Sample
Operations is the right product at all.

---

## 1. The three markets

### A. Small research laboratories

**Who handles the material** (INFERENCE from lab structure, to be confirmed): PhD students and
technicians do nearly all physical handling; a lab manager or senior postdoc owns the inventory
by default; the PI never touches it but inherits the consequences.

**Current workflow.** Spreadsheets, freezer box maps on paper taped to the freezer door, and
memory. Identifiers are locally invented (initials + date + number). Location is a text column,
overwritten on each move, so there is no history. Metadata lives in a different spreadsheet, or
in a notebook, or in the file names of instrument output. Backups are copies with dates in the
filename.

**Documented pain.**
- FACT (S22): sample inventory is a scored best practice in My Green Lab's International Freezer
  Challenge, which explicitly frames inventories as reducing misplacement and retrieval time, and
  recommends searchable electronic inventories and barcodes. That a global sustainability
  programme has to teach labs to keep inventories tells you the baseline.
- FACT (S21): ~24 billion samples in ~1 million storage units, with labs devoting 16–26% of floor
  space to cold storage.
- FACT (S20): in a far better-resourced adjacent population (146 biopharma professionals), 95%
  report budget, timeline or data-quality damage from inventory/sampling problems and nearly half
  report no real-time chain of custody.
- FACT (S24, dated): academic ELN adoption was ~4% versus >50% in pharma. Academia is
  structurally slower to adopt research-data software.
- INFERENCE: the characteristic failure is not "we lost the freezer", it is *the departing member
  problem* — a student leaves and their boxes become unreadable to everyone else. Nothing in the
  spreadsheet workflow prevents it.
- OPEN QUESTION: how often does this actually cost a small academic lab something they would pay
  to avoid? No published measurement was found (see "Known gaps" in the sources file).

**Existing software.** The crowded end of the market. Free or near-free and frictionless:
Quartzy (cloud, consumables/ordering-led), Benchling (free academic tier, notebook/molecular-led),
eLabFTW (open source, self-hosted, ELN-led), SampleDB (open source, self-hosted). Capable and
heavy: OpenSpecimen (FACT S26: BSD-licensed Community Edition, vendor sells support/migration),
LabKey, SENAITE. Commercial inventory: LabCollector (FACT S25: $550/user/yr Inventory Pack,
$1,300 LIMS, $900 ELN, academic quotes on request), eLabInventory (FACT S27: per-user licences),
Freezerworks (Phase 0: published plans from USD 832/month).

**Market accessibility.** INFERENCE, and this is the decisive weakness: there is no single place
where small academic labs congregate as *inventory-having entities*. Reaching them means going
lab by lab, or through institution-level core facilities and sustainability programmes (the
Freezer Challenge is the one credible community hook, S22). There is no equivalent of a
collections listserv. Recruiting 5–10 early testers is possible only through personal networks.

### B. Biological / natural-history collections

**Who handles the material** (FACT-adjacent, from S2/S3): collection managers and curators, with
graduate and undergraduate students doing the volume work; in small collections one person holds
the curatorial role alongside teaching and research, and is not credited for it.

**Current workflow.**
- FACT (S1): 4,035 active herbaria worldwide hold 406M specimens with 13,625 staff and associates
  — an average of about 3.4 people per herbarium. This is the clearest quantitative evidence
  available that the median collection is a tiny team.
- FACT (S2): small herbaria are a large share of US herbaria, many undigitised; obstacles are
  funding, staff, competing duties, and not knowing where to start; databasing runs at 25–47
  specimens/hour.
- FACT (S3): small institutes report limited or *no* access to collection management software,
  limited technical skills, and unreliable internet.
- FACT (S19, from the paleo intake procedure but generalisable): repository intake is
  spreadsheet-mediated, with a museum-supplied inventory spreadsheet as the only accepted format.

Identifiers are catalogue numbers with institutional prefixes, preceded by collector field
numbers that must be reconciled later. Location is cabinet/drawer/shelf/jar, recorded — when
recorded — in the catalogue as a text field. Loans are tracked on paper or in a separate
spreadsheet. Exports go to GBIF via Darwin Core, when the collection gets that far.

**Documented pain.** Digitisation backlog (S2, S3) is the pain the community talks about most.
INFERENCE: physical location and custody is a *quieter* pain that the community talks about less
because the big CMSs treat it as a secondary field rather than a workflow — a specimen out for
research, in the prep lab, on loan, or reshelved in the wrong cabinet is effectively missing, and
the catalogue does not know. OPEN QUESTION: is that quietness because the problem is minor, or
because there is no tool for it? This distinction decides the whole project and cannot be
resolved from a desk.

**Existing software.**
- **Specify 7** — FACT (S10): GPL-3.0 source is public, but the maintained Docker compositions
  are members-only, and Specify markets hosting to collections without IT support. FACT (S11):
  affiliate membership $0–750/yr (Tiny) up to $8,000/yr (Extra Large), $500/yr for graduate
  projects, institutional tracks $25k–$150k+.
- **Symbiota** — FACT (S13): joining an existing portal is open to collections of all sizes and
  can serve as the collection's management system. This is the most important competitive fact in
  this market: **for a small collection, a capable hosted CMS is already available at no direct
  cost.** FACT (S14): self-deployment or a bespoke portal costs real money ($5,698 setup,
  $7,523/yr maintenance, $252/hr development).
- **Arctos** — FACT (S12): $110/yr base plus tiered per-record fees, sliding scale, waivers for
  unfunded collections. Cheap, but it is a consortium and a hosted platform, not a local tool.
- **Museum-generalist tools** — FACT (S15): PastPerfect $870 desktop one-time, or Web Edition
  $375–1,245 setup plus $745–2,245/yr. FACT (S16): CatalogIt free for 50 entries, $540–960/yr for
  museum tiers. FACT (S17): CollectiveAccess is open source and self-hosted.
- Spreadsheets and legacy Access databases remain the fallback (S2, S3).

**Market accessibility.** This is the market's decisive strength.
- FACT (S6): NHCOLL-L is an open, unmoderated mailing list about collections care, management and
  computerisation, 15–30 messages/month, open to anyone with email, hosted at Yale since 1999.
- FACT (S7): SPNHC has individual and institutional memberships and a 41st annual meeting in
  September 2026, with TDWG and GSA adjacent.
- FACT (S5): iDigBio publishes a catalogue of US collections *with an API* — the target list is
  literally downloadable.
- FACT (S4): iDigBio surveyed small US collections in 2025 on exactly this population, results
  forthcoming.

INFERENCE: recruiting 5–10 early testers here is a matter of writing one careful, non-promotional
email and attending one meeting. In market A it is a matter of luck.

### C. Paleontology collections

**Who handles the material:** collection managers, preparators (a role with no equivalent in A or
B), curators, field crews, graduate students.

**Current workflow.** FACT (S19): at a real repository, field crews use their own locality and
specimen numbering; the museum assigns its numbers onto a mandated Preliminary Inventory
Spreadsheet, which is edited into a Final Inventory Spreadsheet, which is imported. So the
canonical paleo intake workflow is *explicitly* a spreadsheet pipeline with an identifier
reconciliation step. FACT (S18): Paleo Core hosts project-level paleoanthropological data with a
Darwin Core-based standard, mostly private projects.

**Documented pain.** INFERENCE (well grounded in S19): the identifier chain — field number →
accession → catalogue number, with jackets that contain many specimens and specimens that split
into many parts — is a structurally harder tracking problem than a freezer box, and the
prep-lab stage means an object legitimately lives outside its shelf for months or years.
OPEN QUESTION: whether collection managers experience this as a *painful* problem or as a solved
procedural one.

**Existing software.** FACT (S9): the Symbiota **Paleo Data Portal** is being built under NSF
awards 2324688/89/90 explicitly to give paleontological collections a "low-barrier-to-entry
platform for data mobilization and management", targeting collections that lack access to secure
cyberinfrastructure. Specify supports paleo disciplines; Arctos handles geology and cultural
collections (S12); Paleo Core serves project data (S18).

INFERENCE: this is simultaneously the best and worst news for market C. Best: the community has
just declared, with federal funding, that these collections lack tooling. Worst: a funded team is
already building the obvious answer for them, and it is free at the point of use.

**Market accessibility.** FACT (S8): PDWG is an active community of practice with a Slack
workspace, regular "Happy Hours", and a Knowledge Hub whose CMS page openly solicits contributors.
INFERENCE: this is the single most reachable and most receptive community of the three — small
enough that one useful contribution is visible, organised enough to have a front door.

---

## 2. Competitive gap: what existing software does not do well

| Gap | A: labs | B: collections | C: paleontology |
|---|---|---|---|
| Installation friction | High for the capable tools (server stacks); zero for cloud tools | High for self-hosting; **zero if you join a Symbiota portal** (S13) | Same as B, and the Paleo Data Portal is being built to remove it (S9) |
| Cost | Free options exist and are good | Free (portal) to $8k/yr (S11–S16) | Free at point of use once the portal lands |
| Offline / no-internet operation | Rarely needed | **Genuinely needed** (S3: unreliable internet) | Needed, plus field/prep contexts |
| Portability / permanence of the record | Vendor cloud lock-in | **Highly valued**; records must outlive the software and the grant | Same, sharper — records must outlive the institution |
| Spreadsheet migration | Import exists but is generic | Central to real life (S2, S19); mandated spreadsheet formats | **The workflow *is* a spreadsheet pipeline** (S19) |
| Physical location and custody as a first-class workflow | Freezer tools do boxes well; ELN-led tools barely | **Weak across the board**: location is a catalogue field, not a workflow with history | Weakest: prep lab, jackets, parts, oversized objects |
| Provenance / who-moved-what history | Rare outside regulated biobanking | Rare; edit history exists in some CMSs, custody history does not | Rare |
| Loans and outgoing transactions | N/A | Present in mature CMSs, absent for small collections on spreadsheets | Present in mature CMSs |
| Small-team UX | Cloud tools good | Mature CMSs are built for institutions with staff | Same |

**The wedge, stated narrowly.** In markets B and C, the incumbents are *catalogue and publication*
systems: their centre of gravity is the specimen record and getting it to GBIF. None of them is
organised around the physical object's whereabouts and custody over time, and none of them works
on a laptop with no internet. **The wedge is: the physical layer — where is it, who has it, what
happened to it — offline, in a file you own, alongside whatever catalogue system you already use.**

INFERENCE, and important: this means we should be **complementary, not a replacement**. A small
collection using a Symbiota portal for its catalogue can still have no idea which drawer a
specimen is in. Positioning against Symbiota is a losing fight; positioning beside it is not.
This is a significant change from the Phase 0 framing, which implicitly assumed we replace the
system of record.

---

## 3. Willingness to pay

Who controls budgets — INFERENCE except where cited:

| Market | Payer candidates | Individual WTP | Institutional WTP | SaaS potential | Support/services | Migration services |
|---|---|---|---|---|---|---|
| A. Small labs | PI's grant, department, core facility | LOW (free alternatives are good) | MEDIUM (labs do buy LabCollector-class tools, S25) | LOW-MEDIUM (cloud incumbents are entrenched and free at the low end) | LOW (no institutional buyer for a free desktop tool) | LOW |
| B. Collections | Museum/department budget, grants (NSF/IMLS-type), consortium | LOW | **MEDIUM** — evidenced: collections already pay $110–$8,000/yr for CMS membership and $540–$2,245/yr for museum-generalist tools (S11, S12, S15, S16) | LOW-MEDIUM (hosted sync/backup for collections that cannot self-host) | **MEDIUM** — evidenced: the Symbiota Hub bills $252/hr and $7,523/yr for exactly this work (S14) | **MEDIUM-HIGH** — spreadsheet-to-database migration is the community's stated bottleneck (S2, S3, S19) |
| C. Paleontology | Same as B, plus NSF project funding | LOW | LOW-MEDIUM (smaller population; a funded free alternative is arriving, S9) | LOW | MEDIUM (same services logic, smaller market) | MEDIUM |

Three honest conclusions:

1. **Nobody in any of these markets will pay for the software itself.** The credible revenue is
   labour (migration, setup, training) and hosting-for-people-who-cannot-host, which is exactly
   the model that funds Arctos, Specify and the Symbiota Hub (S11, S12, S14).
2. **Market B has visible, existing, non-zero budgets** for collections data management. Market A
   has budgets but faces free incumbents; market C has the smallest budgets and an incoming
   federally funded free option.
3. FACT worth internalising (S12): Arctos grants fee waivers to collections that lack funding.
   The bottom of this market genuinely cannot pay, and the community norm is to carry them. Any
   monetisation plan that depends on the smallest collections is void.

---

## 4. Where open source actually helps

| Value | Who cares most | Why |
|---|---|---|
| Data ownership / no lock-in | **B and C** | Records must outlive software, grants and staff. Institutional memory is the product in a collection; in a lab, samples are consumed within a few years. |
| Offline / local operation | **B and C** | FACT (S3): small institutes report unreliable internet and limited access to software. Labs are on campus networks. |
| Transparency and inspectable data | B and C | Provenance is professionally mandated in collections culture, not merely nice. |
| Interoperability with standards | **B and C** | Darwin Core publication is an explicit goal for collections; irrelevant to most small labs. |
| Institutional trust in open source | B and C | The dominant tools in this space already *are* open source (Specify, Symbiota, Arctos-adjacent, CollectiveAccess). Being open source is table stakes here, not a differentiator. |
| Self-hostability | Institutions in all three | Matters to IT departments, which our users do not have. |
| Reproducibility | A slightly, B and C strongly | |

INFERENCE: open source buys us *permission to be taken seriously* in B and C, and almost nothing
in A, where the credible free competitors are venture-funded clouds rather than community
projects.

---

## 5. Product fit of the proposed domain model

Model: `Container → Position → Item → Event`, with future `Item → Derivation`.

| Market | Fit | Where it breaks |
|---|---|---|
| A. Labs | **Excellent.** Freezer → rack → box → position → tube → moved/consumed is exactly this model. Aliquots map onto derivation. | Nothing structural. The model was designed for this market. |
| B. Collections | **Good for the physical layer.** Building → room → cabinet → drawer → jar → specimen, with non-grid containers, works (ADR-0009). Custody events fit loans and internal movement. | Missing: catalogue number distinct from internal code; taxonomic determination *history* (multiple identifications over time, each with determiner and date); accession/acquisition as an entity; loans as transactions with due dates and counterparties; parts of one specimen (skin, skull, tissue) as siblings under one catalogue record; Darwin Core export. None of these break the model — but a collection would not consider the tool complete without determinations and loans, and Phase 0 deferred both. |
| C. Paleontology | **Good, with two genuine strains.** Containers-as-furniture fits. Prep-lab custody fits events well. | (1) **Field number → accession → catalogue number** is an identifier *pipeline*, not one code; our two-layer scheme (ADR-0006) handles it only if we model prior identifiers explicitly. (2) **Jackets and parts**: one field jacket contains many specimens; one specimen splits into elements, casts, moulds and thin sections. That is a many-to-many container/derivation blend that `parentItemId` alone cannot express. Also: oversized objects have no position, and stratigraphic/locality context is heavier than in A or B. |

INFERENCE: the model survives all three markets, which is a good sign that Phase 0 was not wasted.
But "survives" is not "fits well enough to be adopted" — in B and C the *missing* entities
(determination, loan, accession, parts) are the ones the users would consider basic.

---

## 6. Scorecards

Scale 1–5, higher is better for us (so for "Competition" and "Regulatory burden", 5 means
*favourable to us*, i.e. little competition / little regulation).

| Criterion | A: labs | B: collections | C: paleo | Explanation |
|---|---|---|---|---|
| Pain severity | 3 | 4 | 4 | A: real but usually absorbed — a lost tube costs a re-run, and lab culture tolerates that. B: a mislaid specimen can be functionally lost for decades, and the collection's whole purpose is permanence (S1–S3). C: same as B plus prep-lab and jacket complexity (S19). |
| Frequency of problem | 4 | 3 | 3 | A: daily handling, so friction recurs constantly. B/C: lower transaction volume — specimens move on loans, research visits and reorganisations, so weekly-to-monthly rather than hourly. |
| Spreadsheet dependence | 4 | 4 | 5 | A: near-universal but often supplemented by a free cloud tool. B: large share of small collections undigitised or on spreadsheets/Access (S2, S3). C: the official intake procedure *is* a spreadsheet pipeline (S19) — the highest score available. |
| Competition (5 = weak) | 1 | 2 | 2 | A: brutal — Quartzy, Benchling academic, eLabFTW, SampleDB free, plus commercial incumbents (S25–S27). B: capable free-at-point-of-use hosted options exist (S13) but none owns the physical layer. C: same, plus an NSF-funded portal arriving (S9). |
| Differentiation opportunity | 2 | 4 | 4 | A: "offline and local" is nearly worthless to a lab on campus wifi; our wedge barely differentiates. B/C: offline, portable-file, custody-first is genuinely unoccupied, and complementary to the incumbents rather than competing with them. |
| Open-source fit | 3 | 5 | 5 | A: competitors are free clouds; openness is not the deciding factor. B/C: permanence, provenance and no-lock-in are professional values, and the incumbents are already open source (S10, S13, S17) — the community's default assumption is open. |
| Ease of reaching users | 2 | 5 | 5 | A: no organised community of small-lab inventory owners; only the Freezer Challenge (S22) comes close. B: an open listserv (S6), a society with an annual meeting (S7), and an API-accessible target list (S5). C: a Slack community actively asking for contributions (S8). |
| Ease of onboarding | 4 | 3 | 3 | A: a tube is a tube; a lab can start recording in minutes. B/C: the collection expects its catalogue number scheme, taxonomy and existing records honoured, so first use means a migration, not an empty database. |
| Technical complexity (5 = simple) | 4 | 3 | 2 | A: the Phase 0 model covers it. B: add determinations, loans, accessions, Darwin Core export. C: add the identifier pipeline, jackets/parts many-to-many, oversized objects, stratigraphic context. |
| Regulatory burden (5 = none) | 3 | 4 | 4 | A: human/clinical material drags in consent and ethics the moment we touch it — avoidable only by staying out of clinical labs. B/C: permits, CITES, ownership/repatriation and loan agreements exist but are documentation we record, not compliance we must certify. |
| Institutional willingness to pay | 2 | 3 | 2 | A: budgets exist but free incumbents cap prices at zero. B: documented spend on CMS membership and museum tools (S11, S12, S15, S16). C: smallest budgets, free funded alternative incoming (S9), waiver culture (S12). |
| SaaS opportunity | 2 | 3 | 2 | Hosting-for-those-who-cannot-host is a real service in B (the Symbiota Hub and Specify Cloud both sell it, S10, S14). Weak in A (clouds already free) and thin in C. |
| Services opportunity | 2 | 4 | 3 | Migration and setup labour is the community's stated bottleneck in B/C (S2, S3, S19) and is already a priced service (S14: $252/hr). Little equivalent demand in A. |
| Fit with our technical capability | 5 | 4 | 3 | A one-person TypeScript/SQLite/desktop project. A is squarely in scope. B needs domain learning (Darwin Core, determinations, loans). C needs deeper domain immersion (stratigraphy, prep workflows) that we do not yet have. |
| Fit with Sample Operations domain | 5 | 4 | 3 | Per §5: the model was designed for A, adapts to B with additions, and strains in C around identifiers and parts. |
| **Total (75 max)** | **46** | **55** | **50** | |

Reading the totals honestly: B wins on *reachability, differentiation and payer evidence*, not on
pain or product fit. A wins on product fit and loses on everything that determines whether a tiny
open-source project ever gets a user. That trade — build the thing that fits us versus build for
people we can actually reach — is the whole decision.

---

## 7. Recommended beachhead

# Recommended beachhead

**Market:** B — small natural-history collections (roughly ≤100,000 specimens, ≤3 staff, no IT
support), with the **paleontology sub-community (PDWG) as the first recruiting channel** because
it is the most reachable and most receptive slice (S8) and its physical-tracking problem is the
sharpest (S19).

**Why:** three reasons, in order of weight.
1. *Reachability.* An open listserv (S6), a society and annual meeting (S7), an API-accessible
   list of the target population (S5), and a Slack community soliciting contributions (S8). For a
   solo project, the ability to find ten real users cheaply outweighs every other factor.
2. *An unoccupied wedge.* The incumbents are catalogue-and-publication systems. Physical location
   and custody over time is a secondary field for all of them, and none works offline.
3. *Values alignment.* Permanence, provenance, open formats and no lock-in are professional
   requirements in this community (S1–S3), which is precisely what a local-first, single-file,
   Apache-2.0 tool offers.

**Top problem:** a small collection cannot reliably answer *where is this object right now and
what has happened to it* — because location is a text field in a catalogue (or a spreadsheet)
that is overwritten, and because objects legitimately leave their shelf for loans, research
visits, preparation and reorganisations with no custody record.

**Existing alternatives:** Symbiota portals (free to join, S13), Specify (S10, S11), Arctos (S12),
PastPerfect/CatalogIt (S15, S16), CollectiveAccess (S17), the forthcoming Paleo Data Portal (S9),
and spreadsheets. None is primarily a physical-custody tool; all except spreadsheets require the
internet.

**Our wedge:** an offline, install-and-go desktop tool that owns the **physical layer** — the
container tree that matches the actual furniture, positions where they exist, movement and custody
history that cannot be overwritten, and a single portable file — that **complements rather than
replaces** whatever catalogue the collection already uses, via CSV in and CSV out.

**Why now:**
- FACT (S9): the paleo community has just been funded to address exactly the population we target,
  which means the need is publicly acknowledged and the community is mobilised and talking.
- FACT (S4): iDigBio has just surveyed small US collections on digitisation; findings are pending
  and will sharpen or refute this thesis within months.
- FACT (S3): 2023 work on small institutes documents *no access to collection management software*
  as a live constraint, not a historical one.

**Why us:** a local-first, single-file, no-server tool is a genuinely awkward product for a
consortium or a grant-funded hub to build — their funding models presuppose hosted infrastructure
and membership. A one-person open-source project has the opposite incentives. Add the maintainer's
stated interest in paleontology and biology, which for a solo project is a real sustainability
factor rather than sentiment.

**What we should build:** the Phase 0 MVP (container tree, items, positions, movement, append-only
history, search, CSV import with dry-run, export, backup) **plus three additions that market B
treats as basic**: (a) a catalogue number distinct from the internal identifier, (b) determination
history (who identified it as what, when), and (c) a minimal loan/outgoing-transaction record. And
first-class import of exports from Symbiota/Specify-shaped CSV.

**What we should NOT build:** a catalogue system, a publication portal, a Darwin Core Archive
generator (not in v0.1), taxonomy management, imaging/media management, georeferencing tools,
multi-user or web hosting, or anything that asks a collection to abandon its existing system.

**First 5–10 users:** small paleontology and herbarium collections reachable through PDWG Slack
and NHCOLL-L; a graduate-project collection (S11 shows they exist as a recognised category); and
one or two collections identified from the iDigBio US collections API (S5) with no CMS listed.

**Potential buyer:** not the collection manager. The plausible payers are the institution or
department (evidenced spend of $110–$8,000/yr on CMS membership, S11/S12), grant-funded
digitisation projects, and consortium/hub budgets that already pay for services at $252/hr (S14).

**Future monetisation:** migration and onboarding services first (the community's stated
bottleneck), then hosted sync/backup for collections that cannot self-host, then support and
training contracts, then institutional sponsorship. Never the software itself, and never a
capacity-limited free tier — the bottom of this market cannot pay and the community norm is to
carry it (S12).

**Confidence: MEDIUM.** High confidence that this community is reachable and values what we build
(hard sources). Medium-to-low confidence that physical-location tracking is painful *enough* to
displace current habits — the pain is documented qualitatively and by proxy, never measured. That
is the gap the interviews must close.

### Why not A

Product fit is best in A and everything else is worst: no reachable community, free and good
incumbents, and an offline/local wedge that a lab on campus wifi does not value. INFERENCE: we
would build the right product and never find the tenth user.

### Why not C alone

C is the sharpest problem and the most welcoming community, and it is my second choice — but as a
*market* it is small, its budgets are the thinnest, an NSF-funded free alternative is arriving
(S9), and the domain is where our model strains most (identifier pipeline, jackets, parts).
Treating paleontology as the entry channel into B keeps all of C's advantages — reachability,
receptiveness, a genuinely hard tracking problem — without betting the project on the smallest
segment. If interviews show paleo needs diverge sharply from the rest of B, the ecosystem strategy
(§9) says that becomes a separate product, not a compromise inside this one.

---

## 8. Alternative product test

> *If we were starting Open Research Lab today and wanted the highest probability of building a
> genuinely useful scientific product within 1–3 months, would Sample Operations still be the
> product you recommend?*

**Not as scoped. Answer: NO for the 1–3 month horizon, YES for the 6–12 month horizon.**

The honest problem is that the Phase 0 MVP is a multi-month build (Electron + Angular + SQLite +
import/export + migrations, per the roadmap) whose value only becomes visible **after** a
collection migrates its data into it. That is a long, fragile path to a first happy user, and the
first thing every user will need is the part we scheduled last: getting their existing spreadsheet
in and their data back out.

Three alternatives that would produce a genuinely useful artefact faster, all of which build
credibility in the *same* community we just chose:

**Alternative 1 — Collection data validator and Darwin Core packager (highest probability).**
A small, focused tool that takes a collection's messy spreadsheet or CMS export and reports what
is wrong with it — invalid dates, impossible coordinates, duplicate catalogue numbers, missing
required Darwin Core terms — then packages a publication-ready archive. Why it is the strongest
1–3 month bet: it is days-to-weeks of work rather than months, it needs no adoption decision (run
it once on a file, get value immediately), it needs no data migration, it is trivially
distributable, and the need is documented (S3, and the entire "Publish First" motivation). Also
the "Dataset Validator" already named in the ecosystem sketch. Risk: GBIF and TDWG already provide
validators, so it must be genuinely better at the *small-collection* case (offline, plain-language
errors, spreadsheet-shaped input) or it is redundant — that is a real risk, not a formality.

**Alternative 2 — Inventory reconciliation / spot-check tool.** Collections periodically inventory
a drawer or cabinet and compare it against the catalogue. A tool that ingests an export, lets
someone walk the shelves recording what is actually there, and reports discrepancies. Tiny scope,
immediately painful problem, and it produces exactly the location data that Sample Operations
would later manage — a natural on-ramp. Risk: unvalidated; I found no source documenting how often
small collections actually run inventories.

**Alternative 3 — Loans and outgoing-transaction tracker.** Small collections lend material and
track it on paper or in email. Narrow, high-stakes, and a legal/ethical record rather than a
convenience. Risk: lower frequency than location tracking, and mature CMSs already do it, so it
is only interesting for collections without a CMS.

**Recommendation:** keep Sample Operations as the strategic product, but sequence it so the first
shippable artefact is small and useful on its own. Concretely: build the **import/validate/export
pipeline first**, as a usable tool in its own right (Alternative 1 as a feature of Sample
Operations rather than a separate product), and grow the location and custody features behind it.
That way the first release is useful on day one to a collection that has not committed to
anything, and it becomes the migration path into the full product. This is a real change to the
Phase 0 roadmap and it is reflected in [roadmap.md](roadmap.md).

Recommendation on the repository question: **do not create the Sample Operations repository yet.**
Create it when the interviews close, because the interview outcomes could change the product's
name, shape and even language ecosystem — and an empty, prematurely-named repository is a
commitment we would then have to walk back in public.

---

## 9. Ecosystem implications

- **Do not force paleontology into Sample Operations.** If interviews show that jackets, parts,
  stratigraphy and the field-number pipeline dominate paleo needs (§5), that is a separate product
  sharing a library — not a configuration flag. Decide after interviews, not now.
- **Candidate shared library, to be extracted rather than designed** (ADR-0008 still applies): a
  Darwin Core mapping and validation package — term definitions, controlled vocabularies, date and
  coordinate parsing, archive packaging. It is the one component that Sample Operations, a
  validator and any future collections tool would all need. INFERENCE: this is the most likely
  first genuine shared library in Open Research Lab. It must still be extracted from working code
  in one product before it becomes a package.
- **PaleoMapper and other sketched products stay unbuilt** until one product has users.

---

## 10. Final recommendation (executive summary)

1. **Best beachhead market:** small natural-history collections (≤3 staff, no IT support),
   entered through the paleontology collections community.
2. **Why:** they are the only one of the three markets we can actually *reach* (S5–S8), they value
   exactly what a local-first open-source tool provides (S1–S3), the physical-custody wedge is
   unoccupied by the incumbents, and there is documented institutional spend to eventually
   monetise services against (S11–S16).
3. **Exact problem:** a small collection cannot reliably answer *where is this object and what has
   happened to it*, because location is an overwritten field in a catalogue built for publication,
   not a custody workflow.
4. **MVP scope:** import an existing spreadsheet or CMS export and validate it; container tree
   matching real furniture; catalogue number plus internal identifier; location and movement with
   append-only custody history; search; determination history; minimal loan record; CSV export;
   one portable file; fully offline.
5. **Main competitor:** Symbiota — because for a small collection it is capable, hosted, and free
   to join (S13). Not Specify, and certainly not spreadsheets.
6. **Our differentiation:** offline, no server, one file the collection owns, and physical custody
   as the product rather than a field — explicitly complementary to the catalogue system they
   already use.
7. **First users to recruit:** 5–10 small paleontology and herbarium collections via PDWG Slack
   and NHCOLL-L, plus one graduate-project collection.
8. **How to recruit them:** participate before promoting — contribute to the PDWG Knowledge Hub
   CMS page that is openly asking for contributors (S8), ask a research question on NHCOLL-L
   rather than announcing a product (S6), and use the iDigBio collections API (S5) to identify
   collections with no CMS for direct, personal outreach. Never announce a product that does not
   exist yet.
9. **Monetisation hypothesis:** migration/onboarding services → hosted sync and backup for
   collections that cannot self-host → support and training → institutional sponsorship. The
   software stays complete and free.
10. **Biggest reason this could fail:** the wedge may not be painful enough. Collections have
    lived with imperfect location data for a century, and "good enough" plus institutional inertia
    beats "better" more often than not. Secondary reason: adding determinations, loans and
    accessions to be credible pushes us toward being a small CMS — competing head-on with mature
    free systems, which we would lose.
11. **Create the Sample Operations repository now?** **No.** Create it after the interviews
    (Phase 2), because their outcome can still change the product's shape and name. The umbrella
    repository remains the documentation and strategy hub in the meantime.

**Meta-note on this document:** it is desk research designed to be falsified, not a business case
designed to justify Phase 0. The two most important things in it are the honest admission in §3
that nobody will pay for the software, and the admission in §7 that the pain has never been
measured. Both are reasons to talk to people before writing code —
[user-validation.md](user-validation.md).
