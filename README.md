# Open Research Lab

Open-source software and tools for scientific research.

Our goal is to build practical software that helps researchers collect,
manage, validate, analyze, and share scientific data.

## Projects

### Collection data check — experimental prototype

A small command-line tool that reads a CSV export from a collection spreadsheet or collection
management system and reports the problems worth a human look: repeated catalogue numbers, empty
identifiers, impossible coordinates and dates, missing localities, duplicate and empty rows. It is
read-only, works entirely offline, and claims no standards conformance.

It exists to test one question with real collections — **is this useful?** — before any product is
committed to. Small enough to throw away: [tools/collection-validator](tools/collection-validator/README.md)

### Sample Operations / Nexus Lab — evolving prototype

A local-first desktop tool for small research groups and collections that need to answer two
questions reliably: **where is this sample?** and **what has happened to it?**

No server, no account, no network. All data in a single SQLite file you own, exportable to CSV
at any time — so your records outlive the software.

Phase 1 market validation is complete and the sector has given a GO. The candidate product is
currently incubating as [`tools/physical-location-prototype`](tools/physical-location-prototype/README.md)
inside this laboratory repository while it is shaped into the standalone `sample-operations`
product.

Design work so far: [market validation](docs/product/market-validation.md) · [discovery report](docs/discovery-report.md) ·
[documentation index](docs/README.md)

## Focus areas

We are initially exploring tools for:

- Biology
- Paleontology
- Ecology
- Scientific collections
- Research data management
- Field research

The scope is intentionally broader than any single scientific discipline.

## Philosophy

- Open source by default
- Reproducible research
- Data provenance
- Interoperability
- Practical tools for real research workflows
- Minimal infrastructure where possible
- Data ownership: open formats, always exportable, no lock-in

## Contributing

Contributors and AI agents should read [AGENTS.md](AGENTS.md) before making changes.

## License

Unless otherwise stated, projects in this organization are released under
the Apache License 2.0.
