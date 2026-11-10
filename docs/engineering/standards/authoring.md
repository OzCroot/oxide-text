# Content Authoring Standards

> **Optional module.** Remove this file if the project has no CMS and no
> back-office authoring interface.

This file states rules for the back-office authoring experience. It does
not list which content types exist. See
`engineering/platform/<platform-name>/content-types.md`, once Milestone 5
creates it. Until then, see
[the example](../../../examples/platform-umbraco/content-types.md). It
states how the authoring experience should feel to the author. Without this
rule, an agent that builds "a retailer page" produces a list of properties.
The list may be technically correct, but it is hard for the author to use.

## Why this file exists

Content authors are end users of the system. Content authors are often not
developers. A long list of ungrouped properties can pass a schema check.
However, the list can still be a bad interface for the person who uses it
for eight hours each day. See [../../product/users.md](../../product/users.md)
for the content authors' roles and their expectations.

## Rules

<!-- SCAFFOLD: Derive these rules from feedback on this project. Do not copy
     generic best practice. The rule below is an example baseline rule.
     Replace or extend the example rule. -->

- **Group properties by task, not by data type.** Group related fields that
  the author thinks of as one task. For example, group SEO fields, main
  content fields, or display and spacing fields together. Put each group
  into a tab or a fieldset. Do not list every field in one long list in
  schema order.
- **Label fields for the author's mental model, not the developer's.** A
  field may have a technical name, for example `heroCtaOverrideFlag`. Give
  the field a label and a description that state the author's goal, not the
  field's technical name.

## Related

- [../../product/users.md](../../product/users.md) — author roles and expectations this file implements
- [`examples/platform-umbraco/`](../../../examples/platform-umbraco/) — a reference shape for the platform's content-type docs, until Milestone 5 creates the real ones
