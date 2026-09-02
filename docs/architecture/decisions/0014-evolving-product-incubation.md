# ADR-0014 — Evolving product incubation inside the umbrella repository

- Status: Accepted
- Date: 2026-09-03
- Supersedes: ADR-0008 Amendment (repository-boundary part only)

## Context

ADR-0008 decided on a modular monolith with strict internal layering. Its Phase 1 amendment
then stated that products live in separate repositories and that `open-research-lab` would
remain a documentation and strategy hub, creating a standalone `sample-operations` repository
only on a GO from user validation.

Since that amendment was written, the following has happened:

- Phase 1 market validation completed with a clear decision to target **small natural-history
collections**.
- The sector has given a GO to continue developing the candidate product.
- `tools/physical-location-prototype` has evolved from a throwaway UI experiment into an
**evolving prototype** that is actively shaping the eventual Sample Operations product.
- The domain model, settings system, movement rules, i18n framework, and UI conventions inside
the prototype are no longer disposable; they are the current working version of the product
under discovery.

Extracting the product into its own repository right now would:

- Interrupt active discovery just when feedback is arriving.
- Lose the contextual link to the research, market-validation documents, and decision history
that live in `docs/`.
- Force premature repository ceremony (CI, release tags, issue tracking) before the product
has a stable boundary.

At the same time, the existing ADR-0008 amendment no longer describes reality. Keeping it
unchanged creates silent drift between the documents and the code.

## Decision

`open-research-lab` will act as the **umbrella laboratory / incubator repository**. The
candidate Sample Operations product (currently materialised as
`tools/physical-location-prototype`, also referred to as *Nexus Lab* / *Physical Collections*)
may continue to evolve here until it clearly outgrows the incubator.

The following rules apply:

1. **Modular monolith and strict internal layering remain** exactly as decided in ADR-0008.
   The `core → persistence → desktop → ui` direction and the “no I/O in `core`” rule do not
   change.
2. **No speculative cross-product library** will be created. The existing prototypes under
   `tools/` stay independent and must not be promoted into a shared package.
3. **`tools/physical-location-prototype` is the product in gestation**, not a disposable
   experiment. Its code can be refactored, extended, and hardened inside the incubator. It is
   still not the final product repository, but it is no longer treated as throwaway.
4. **Extraction to a standalone repository** remains the intended end state. It will happen
   when one or more of the following is true:
   - External real users are using builds independently of the maintainer.
   - Dedicated collaborators are working primarily on this product rather than the umbrella.
   - The product needs independent versioning and releases.
   - The README and issue traffic of the umbrella are being eclipsed by product activity.
   - A distinct community or user base has formed around the product.
   - Someone should be able to clone and run only the product without the rest of the lab.
   - The product has become the maintainer’s main project.
5. **When extraction happens**, it will use `git filter-repo` or equivalent history-preserving
   tooling. The modular layout inside `tools/physical-location-prototype/src/` is already
   structured so that extraction is a repository operation, not a redesign.

## Alternatives considered

**Create `sample-operations` now.** Rejected: it would split the codebase while the product
boundary is still being discovered, and would discard the tight coupling with research notes,
validation documents, and decision history that currently accelerate iteration.

**Keep ADR-0008 amendment unchanged and pretend the prototype is still throwaway.** Rejected:
silent drift between documentation and reality is worse than an explicit reversal. The code,
conventions, and user feedback have already crossed the line from experiment to incubation.

**Promote `tools/physical-location-prototype` to a top-level `products/` directory now.**
Rejected: the `tools/` directory already communicates “not the product yet”, and moving files
for symbolic reasons does not improve discoverability enough to justify the churn. Reconsider
when extraction is imminent.

## Consequences

- Positive: discovery momentum is preserved; research context stays next to the code;
  extraction criteria are explicit and actionable.
- Positive: the modular-monolith layering keeps the eventual extraction cheap.
- Negative: the repository boundary is fuzzier than in ADR-0008 amendment, so `AGENTS.md`,
  `README.md`, and this ADR must be kept current to avoid confusion.
- Negative: there is a risk that the product never leaves the incubator. The extraction
criteria above are the signal to watch for.

## How we would know this was wrong

If the umbrella repository becomes a permanent home for multiple half-products that never ship,
the incubator model failed. If `tools/physical-location-prototype` grows a community but is
not extracted, the maintainer has delayed a cheap operation for too long.
