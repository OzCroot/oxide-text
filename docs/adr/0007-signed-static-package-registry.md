---
status: proposed
date: 2026-11-10
deciders: [Oz]
---

# 0007 — Serve packs from a signed static registry

## Context

The editor downloads language packs on demand. A pack comes from the
network, so the editor must check that it is intact and genuine. The owner
has not chosen where to host the registry. It is open question 5 in the
plan.

## Decision Drivers

- Pack integrity and a supply chain defence
- Low running cost
- Offline and air-gapped installs

## Considered Options

- **A server with an API:** flexible, but it needs running and paying for.
- **A static, signed `index.json` on GitHub Pages or a CDN:** cheap and simple to mirror.
- **Packs bundled in the installer:** against the size target.

## Decision

We propose a **static, signed `index.json`** that lists each pack version
with its URL, sha256, size, and engine version. Packs carry an ed25519
signature, made with minisign. The host stays open until the owner decides.

## Consequences

- The editor checks the sha256 and the signature before it installs a pack, and refuses a bad signature.
- The editor installs a pack atomically: unpack to a temporary folder, then rename.
- The editor keeps one previous version for rollback.
- "Install pack from file" supports offline use.
