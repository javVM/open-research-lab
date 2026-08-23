# ADR-0010 — Single-user MVP with no authentication

- Status: Proposed
- Date: 2026-08-23

## Context

Every credible open-source competitor in this space requires a server, and the reason is
multi-user access: authentication, authorisation, concurrency and conflict resolution. That
requirement is precisely what puts those tools out of reach of a group with no IT support. Our
users nonetheless work in groups — often around one shared lab computer — and attribution
("who moved this?") is a core product promise.

## Decision

The v0.1 desktop application is **single-user and unauthenticated**. Attribution is provided by
an operator name set on first run and recorded on every event; it is stated plainly in the
documentation as attribution, not security. One writer per database file: if a second instance
opens the same file, it opens read-only rather than risking corruption. Concurrent write access
over a network share is explicitly unsupported.

Multi-user, if validated as a real requirement, becomes a separate self-hosted deployment mode
reusing `packages/core` — not authentication bolted onto the desktop app.

## Alternatives considered

**Local user accounts with passwords.** Rejected: it implies password reset, roles and
permissions, and delivers no real security since anyone with the file has the data. It would be
security theatre with a real UX cost.

**Multi-user over a shared SQLite file on a network drive.** Rejected as unsafe: SQLite's
locking is unreliable on many network filesystems and this is a documented route to corruption.
We will warn about it rather than tacitly support it.

**Bundle a server (PostgreSQL or a local HTTP service) for concurrent access.** Rejected for the
MVP: it reintroduces the exact installation burden that makes existing tools unavailable to our
users.

**OS-account-based identity** (use the logged-in username). Partially adopted: pre-fill the
operator name from the OS account, but keep it editable, because shared lab computers often run
under one generic account.

## Consequences

- Positive: no login screen, no user management, no concurrency bugs — this is what makes the
  five-minute onboarding target achievable; attribution still works for the group's real needs.
- Negative: attribution is trust-based and can be falsified by changing the operator name; two
  people cannot edit simultaneously; a group with a shared drive may try to and must be actively
  warned; if Phase 2 shows concurrent access is table stakes, a significant additional
  deployment mode is required.
- Documentation must be honest: this app protects against data *loss*, not against dishonest
  users.

## How we would know this was wrong

Phase 2 interviews are designed to answer exactly this. If most target groups need two people in
the data at once, the single-user assumption is the biggest error in the plan, and the port-based
architecture is our insurance against it.
