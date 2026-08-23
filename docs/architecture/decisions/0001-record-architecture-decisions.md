# ADR-0001 — Record architecture decisions

- Status: Accepted
- Date: 2026-08-23

## Context

The project is at Phase 0 with no code. Decisions taken now (datastore, shell, UI framework,
domain shape) will be expensive to reverse and will be made partly by AI agents across many
sessions with no shared memory. Undocumented decisions get silently re-litigated or, worse,
contradicted by the next contributor.

## Decision

Record every significant architectural or product-structural decision as a numbered ADR in
`docs/architecture/decisions/`, using this format: context, decision, alternatives considered
with reasons for rejection, consequences, and how we would know we were wrong.

An ADR is required for: choosing or replacing a dependency of structural importance, adding a
new domain entity, changing a layer boundary, changing the persistence format, or reversing a
previous ADR. ADRs are append-only; supersede rather than edit.

## Alternatives considered

- **Decisions in the PR description only.** Rejected: PRs are not discoverable months later
  and describe *what* changed rather than *why* an option was rejected.
- **A single long design document.** Rejected: it becomes stale in one place and nobody can
  tell which parts are still true.
- **No formal record.** Rejected: this is the failure mode we are specifically guarding
  against with multi-session agent work.

## Consequences

- Slight overhead per structural change; a durable, greppable rationale in exchange.
- Agents must read `decisions/README.md` before proposing structural change — this is stated
  in `AGENTS.md`.
- "Proposed" status is honest for Phase 0: these are argued, not yet proven.

## How we would know this was wrong

If ADRs go stale and contradict the code, they are worse than nothing. The mitigation is a
review checklist item: does this PR change a decision, and if so, where is the ADR?
