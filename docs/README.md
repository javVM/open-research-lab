# Documentation index

## Product

- [Vision](product/vision.md) — what Open Research Lab is, what Sample Operations is, the
  commercial boundary, and why the "ecosystem" is deliberately deferred.
- [Problem statement](product/problem-statement.md) — the problem, who has it, why current
  tools do not fit, and the measurable outcomes.
- [Personas](product/personas.md) — hypothesised users, anti-personas, and what would falsify
  each one.
- [Competitive analysis](product/competitive-analysis.md) — OpenSpecimen, Specify, Arctos,
  Symbiota, SENAITE, LabKey, Benchling, eLabFTW, Quartzy, Freezerworks and others, with
  sources.
- [Requirements](product/requirements.md) — MVP scope, priorities, domain invariants,
  non-functional targets, acceptance scenarios, open questions.
- [Market validation](product/market-validation.md) — the three candidate markets compared with
  sources, scorecards, the beachhead decision, the alternative-product test, and the executive
  decision. **Start here for the current strategy;** it supersedes parts of the Phase 0 product
  documents.
- [User validation](product/user-validation.md) — who to interview, where to find them, the
  interview guide, and the go/no-go thresholds.
- [Roadmap](product/roadmap.md) — phases, exit criteria, post-MVP order, deferred items.
- [Risks](product/risks.md) — product, technical and adoption risks with mitigations.

## Architecture

- [Initial architecture](architecture/initial-architecture.md) — structure, technology
  choices, data storage, IPC boundary, performance, security, non-goals.
- [Domain model](architecture/domain-model.md) — entities, relationships, invariants, worked
  examples, deliberate omissions.
- [Testing strategy](architecture/testing-strategy.md) — levels, what we do not test, CI, and
  the definition of done.
- [Decision records](architecture/decisions/README.md) — ADR-0001 to ADR-0010.

## Research

- [Domain research](research/domain-research.md) — laboratory versus collection workflows,
  identifiers, standards (Darwin Core, ABCD, MIxS, GGBN, ISBER, SPREC, ARK), storage
  hierarchies, with sources.
- [Market sources](research/market-sources.md) — every cited source behind the market analysis,
  with what it does and does not support, plus the known gaps in the evidence.

## Validation

- [Public-dataset validation](validation/public-dataset-validation.md) — the collection-data
  hygiene hypothesis tested against 24 published collection datasets: what the validator caught,
  what it got wrong, what it misses, and why this says nothing about demand.
- [Dataset catalogue](validation/dataset-catalog.csv) — the datasets used, with source, licence,
  hash and per-dataset counts.

## Reports

- [Phase 0 discovery report](discovery-report.md) — the consolidated findings and
  recommendations.

---

**Status of everything here:** Phase 1 (market validation) complete; still desk research. The
architecture documents are proposals with rationale, and all ADRs are `Proposed`. **Nothing has
been validated with real users**; that is Phase 2 of the [roadmap](product/roadmap.md) and it gates
all code. `open-research-lab` is the umbrella repository — no product code lives here, and the
Sample Operations repository does not exist yet. The one piece of code in the repository,
[`tools/collection-validator`](../tools/collection-validator/README.md), is a throwaway prototype
used to make Phase 2 interviews concrete; it is not a product and not an architecture precedent.

Where Phase 0 and Phase 1 conflict, Phase 1 wins: the beachhead is small natural-history
collections, not small research laboratories.
