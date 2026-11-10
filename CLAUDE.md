# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Always refer to @AGENTS.md

## Agent skills

See `docs/agents/` for the issue tracker, the triage labels, and the
domain-doc layout this repo's skills use.

## Documentation standards

Use the full ADR template at `docs/templates/adr.md` for every ADR. Do not use
the single-paragraph format from the `/domain-modeling` skill's
`ADR-FORMAT.md` — see `docs/adr/README.md` for the override.

This is a deliberate exception to "link, do not duplicate" — see
`docs/documentation-guide.md`'s Cross-referencing section. The vendored
skill is hash-locked in `skills-lock.json`, so this repo cannot patch its
instructions directly and instead states the override everywhere an agent
might read the skill's conflicting rule.
