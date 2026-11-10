---
source: plan/OXIDE-TEXT-PLAN.md (revision 2)
date: 2026-11-10
informed-by: Oz
---

# Constraints

> **What belongs here:** external non-negotiables. Domain logic does not
> derive them, and the system does not enforce them in code. They are facts
> about the people, the environment, or the timeline, and the project must
> work around them. Not [business-rules.md](./business-rules.md) (those are
> testable system policies) and not [domain.md](./domain.md) (rationale).

## Stakeholder Constraints

None captured yet. The project has no client. The project owner has not set
a fixed date or a reviewer requirement.

## Environmental / Timeline Constraints

- **Three operating systems:** the editor must run on Windows, macOS, and Linux. CI must test all three from milestone M0.
- **Linux uses WebKitGTK:** this webview is slower than the others. Test on Linux from M0.
- **Installer size target:** 10 MB or less on all three systems.
- **Clean-room rule:** no name, theme, icon, file format, keymap, or code comes from the reference application the team analysed. Only common keyboard conventions are allowed. See the risks table in [../../plan/OXIDE-TEXT-PLAN.md](../../plan/OXIDE-TEXT-PLAN.md#9-risks).
- **Licence not chosen:** the project licence is an open question. It decides which tree-sitter grammars the team can redistribute.
- **macOS has no WebDriver for WKWebView:** automated end-to-end tests run on Windows and Linux only.

## Related

- [business-rules.md](./business-rules.md) — hard rules the system enforces (different from external constraints)
- [../history/timeline.md](../history/timeline.md) — the project milestones
