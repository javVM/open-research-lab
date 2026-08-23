# User validation plan

Status: Phase 1. Last updated: 2026-08-23.
Purpose: replace desk research with evidence from real people before any application code is
written. Chosen market and open questions:
[market-validation.md](market-validation.md).

---

## 1. What we are trying to find out

We are **not** trying to find out whether people would like our software. We are trying to find
out three things about their current behaviour:

1. **Frequency and cost:** how often do they fail to find or account for a physical object, and
   what does that failure actually cost them?
2. **Existing workaround:** what have they built to cope, and how much do they invest in
   maintaining it? (Effort spent on a workaround is the most reliable signal that a problem is
   real.)
3. **Switching reality:** what happened the last time they tried to adopt a tool, and why did it
   stop?

If we learn only that "data management is hard", the interview failed.

---

## 2. Who to interview

Target: **10 conversations**, minimum 6 for a decision. Composition:

| # | Who | Why |
|---|---|---|
| 4 | Collection managers at small natural-history collections (≤100k specimens, ≤3 staff), preferably with no CMS or a legacy Access/spreadsheet system | The primary target user |
| 2 | Paleontology collection managers or preparators | The sharpest version of the physical-tracking problem, and the entry community |
| 1–2 | Curators who also teach/research (the "curation is my third job" profile) | Tests whether onboarding time is the binding constraint |
| 1 | Someone who *runs* a Symbiota portal or supports small collections (e.g. Symbiota Support Hub, iDigBio, a consortium contact) | Sees dozens of collections; can falsify or confirm patterns in one conversation, and will tell us if this already exists |
| 1–2 | Small-lab manager or senior technician | Keeps the rejected market A honest; if their pain is dramatically sharper than the collections pain, we should know before committing |

Deliberately include at least one person who **abandoned** a collections management system. Their
reasons are more informative than any successful adopter's.

## 3. Where to find them

- **NHCOLL-L** — open mailing list, collections care/management/computerisation, 15–30 messages a
  month, open to anyone with email. The place to ask a *question*, not to announce a product.
- **PDWG** — Slack workspace, Happy Hours, and a Knowledge Hub whose collections-management page
  openly asks for contributors. Contribute first, ask second.
- **iDigBio US collections list/API** — an addressable list of the target population; collections
  with no CMS listed are the strongest leads for direct, personal email.
- **SPNHC** — annual meeting (Sept 2026) and membership; TDWG and GSA adjacent. Conversations at a
  meeting are worth ten cold emails.
- **Index Herbariorum** — per-herbarium staff counts, so we can select collections with 1–3 staff
  rather than guessing.
- **Local and Spanish-language collections** — university herbaria, natural-history museums and
  paleontology collections in Spain and Latin America. Under-represented in our sources, reachable
  in the maintainer's first language, and plausibly worse-served. Cheapest interviews available.
- **For the lab comparison** — personal networks and institutional core facilities; the Freezer
  Challenge community is the only organised hook.

Sources for each: [../research/market-sources.md](../research/market-sources.md).

**Outreach rules.** Introduce ourselves as researchers trying to understand a workflow, not as a
vendor. Ask for 25 minutes. Offer nothing, promise nothing, and never describe a product before
the questions are done — describing the product first contaminates every answer that follows. Do
not announce a tool that does not exist.

---

## 4. Interview guide (25–30 minutes)

Ask about the past and the concrete. Never about a hypothetical future product.

### Warm-up (2 min)
1. What is your role, and what do you personally handle in the collection?
2. Roughly how many objects, and how many people touch them?

### Current behaviour (8 min)
3. Walk me through what happens physically and digitally when a new object arrives.
4. How do you currently know where object X is? Show me, if you can.
5. What is recorded about its location, and where is that recorded?
6. Who else can change that record? What happens when two people change it?
7. How is the record backed up? When did you last restore one?

### Failure stories (8 min) — the most valuable section
8. Tell me about the last time you could not find something. What did you do?
9. How long did it take? What happened in the end?
10. Has an object ever been out — on loan, in the prep lab, with a researcher — and the record did
    not reflect that? What happened?
11. When someone moves a drawer or a box, how does anyone else find out?
12. What happened the last time a person who maintained the records left?
13. Has anyone ever had to reconstruct what happened to an object? How?

### Workarounds and switching (7 min)
14. What software have you tried for this? What happened?
15. Why did you stop using it, or why did you not start?
16. What do you use your current system for that it was not designed for?
17. If you had to hand the collection over tomorrow, what would you hand over?
18. Who decides whether you can adopt a new tool, and who pays?
19. What would have to be true for you to put your inventory in something new?

### Close (2 min)
20. What is the most annoying recurring part of your week that I have not asked about?
21. Who else should I talk to?

### Questions we must not ask
- "Would you use an app that manages your samples?" — invites politeness, not information.
- "Would offline access be useful?" — everyone says yes.
- "Would you pay for this?" — hypothetical willingness to pay is worthless; ask who controls the
  budget and what they bought last instead (Q18).
- Anything that describes our proposed solution before Q20.

---

## 5. What counts as evidence

Record answers as observations, not impressions. After each interview, note verbatim quotes for
anything that goes in the evidence table below. Publish the synthesis in
`docs/research/user-interviews.md` — including the interviews that contradict us.

### Validating evidence (supports building)

| Signal | Threshold |
|---|---|
| An unprompted, specific failure story (Q8–Q13) with a real cost in time or lost work | **≥6 of 10** |
| Location/custody failures happen at least monthly | ≥5 of 10 |
| A homemade workaround exists that someone actively maintains (a second spreadsheet, a paper log, a whiteboard) | ≥6 of 10 |
| Current system cannot say who moved something or when | ≥7 of 10 |
| Existing CMS or portal is used for the catalogue but *not* for physical location | ≥4 of the CMS users |
| Offline or no-server operation is mentioned *unprompted* as a constraint | ≥3 of 10 |
| Willingness to try a tool on a subset of the collection within a month | **≥3 of 10** — this is the strongest signal available, because it costs them something |
| Someone volunteers their spreadsheet for a migration test | ≥2 of 10 |

### Invalidating evidence (stop or re-scope)

| Signal | Implication |
|---|---|
| Failure stories are rare, old or trivial ("it turns up eventually") | The wedge is not painful enough. Stop. |
| Their existing system already handles location and history adequately | No gap. Stop, and say so publicly. |
| The binding constraint is unambiguously digitisation backlog, imaging or publication, not location | Wrong product. Reconsider the validator (market-validation §8). |
| Nobody will try anything new without institutional approval, and approval is slow or impossible | No adoption path, however good the tool. |
| Everyone insists on multi-user, shared, web-based access | Invalidates the local-first single-user architecture, which is the whole design. |
| Barcode scanning and label printing are named as prerequisites by most | MVP must be re-scoped before any build. |
| The needed feature set is really a full CMS (taxonomy, media, publication) | We would be competing head-on with mature free systems. Stop. |

### Ambiguous outcomes and what to do

If validating and invalidating signals split roughly evenly, the honest reading is that the
problem is real but not urgent. In that case: build **only** the import/validate/export pipeline
(the standalone-useful slice) and re-interview the same people after they have used it. Do not
proceed to the full desktop MVP on a split verdict.

---

## 6. Go / no-go decision

**GO** requires all of:
1. ≥6 of 10 specific, costly failure stories.
2. ≥6 of 10 maintaining an active workaround.
3. ≥3 of 10 willing to try a tool on real data within a month.
4. ≥2 collections whose real spreadsheet we can use as a migration test case.
5. No invalidating signal from the table above appearing in a majority of interviews.
6. A credible answer to "who would pay for services later" from at least one interviewee.

**NO-GO** if any of:
1. Failure stories are absent, rare or trivial.
2. Existing tools are seen as sufficient for location and custody.
3. Nobody will trial anything on real data.
4. The unanimous requirement is multi-user web access (invalidates the architecture).
5. The real problem turns out to be somewhere else entirely (digitisation, imaging, publication).

**On a NO-GO:** publish the finding in the repository — a documented negative result is a genuine
contribution to this community and is worth more to our credibility than a product nobody wanted.
Then either pivot to the validator (market-validation §8, Alternative 1) or re-run this plan
against market A.

## 7. Process and honesty rules

- Interviews are conducted by the maintainer, not by an agent. Agents draft materials and
  synthesise notes; they must not fabricate or paraphrase-into-existence any interview content.
- Notes go in `docs/research/user-interviews.md`, anonymised (role, collection size, country only)
  unless the interviewee explicitly consents to attribution. Ask before recording anything.
- Record the counts against the thresholds above **before** interpreting them, so the analysis
  cannot drift toward the answer we want.
- Report disconfirming evidence first in the synthesis.
- If fewer than 6 interviews are achievable, say so explicitly and treat any decision as
  provisional — do not quietly lower the bar. Failure to recruit 6 interviews from this community
  would itself be strong evidence against the reachability thesis in market-validation §7, which
  is the primary reason this market was chosen.
