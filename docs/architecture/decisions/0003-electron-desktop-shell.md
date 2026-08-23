# ADR-0003 — Electron as the desktop shell

- Status: Proposed
- Date: 2026-08-23

## Context

The user must be able to double-click one installer and start recording samples within five
minutes, offline, on Windows or macOS, without a terminal, a runtime install, or a server.
The team is TypeScript-centric and small. The renderer must never touch the filesystem
directly.

## Decision

Ship a desktop application built with **Electron**, with the Angular UI in the renderer and
all database and filesystem access in the main process behind a typed, validated IPC boundary
(`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, no remote content).

## Alternatives considered

**Tauri.** Smaller binaries (single-digit MB vs ~120 MB), lower memory, good security model.
Rejected for now because the backend is Rust: it would introduce a second language into an
otherwise TypeScript codebase maintained by a very small team, and it would mean rewriting the
persistence layer in Rust or bridging it awkwardly. It also uses the platform webview, so we
would test against three different rendering engines instead of one. Tauri remains the
documented escape hatch — because `core` is framework-free and I/O-free, replacing the shell
does not touch domain logic.

**A local web app the user runs themselves** (`npm start`, browse to localhost). Rejected: it
requires Node.js installation and a terminal, which disqualifies the primary personas
immediately. This is exactly the friction that makes existing open-source competitors
unavailable to our users.

**Native per-platform apps** (Swift/WinUI, or .NET MAUI, Qt, Flutter). Rejected: two or three
codebases, or a new language and ecosystem, for a one-maintainer project.

**CLI only.** Rejected as the product, though a thin internal CLI is kept for development and
QA. Researchers who are comfortable in a terminal are not the underserved group.

**PWA with the File System Access API.** Rejected: browser support is uneven, the "one file
you own" story becomes a permissions dance, and offline installation is still a browser
concept rather than an application.

## Consequences

- Positive: one codebase, three platforms; full Node access in the main process, so
  `better-sqlite3`, file dialogs and backups are straightforward; mature packaging and
  auto-update tooling; a huge hiring/contribution pool; identical Chromium rendering
  everywhere.
- Negative: ~120 MB installers and high baseline memory; native-module rebuilds per platform;
  code-signing costs and OS gatekeeper warnings for unsigned builds; Electron's security model
  requires discipline (mitigated by loading no remote content at all and validating every IPC
  payload).
- Accepted trade: users on very old hardware may find it heavy. Revisit if adoption data shows
  this.

## How we would know this was wrong

Installer size or unsigned-binary warnings measurably blocking installation in Phase 5, or
native-module maintenance consuming a disproportionate share of sessions. Both point at Tauri,
which the architecture keeps cheap to adopt.
