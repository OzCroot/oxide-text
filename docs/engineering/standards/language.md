# Language Standard

This file sets the writing rules for the knowledge base. It is written in the
style it defines — use it as a working example.

## Scope

This standard governs:

- All files under `docs/`
- `AGENTS.md`, `CLAUDE.md`, `README.md`

This standard does not govern:

- Code comments and commit messages — see [general.md](./general.md)
- Files under `.agents/skills/` — those are vendored skill instructions. See
  [Precedence](#precedence) below

## What this standard is

This standard follows **ASD-STE100, Simplified Technical English**. ASD-STE100
is a controlled-language specification for technical writing. The full
specification defines an approved-word dictionary of about 875 words and a set
of writing rules.

This file does not reproduce the dictionary. The dictionary is copyrighted by
ASD (AeroSpace and Defence Industries Association of Europe). This file applies
the writing rules below, plus a project-specific [approved terms
table](#approved-terms). Refer to the ASD-STE100 specification for the full
dictionary.

## The rules

Apply these rules to every sentence in scope:

1. **Use active voice.** Write "the agent updates the file", not "the file is
   updated by the agent". Use passive voice only when the actor is unknown or
   does not matter.
2. **Limit sentence length.** An instruction has at most 20 words. A
   descriptive sentence has at most 25 words.
3. **Write one instruction per sentence.** Do not join two instructions with
   "and" or a comma.
4. **Use simple present tense** for facts and instructions. Avoid the perfect
   tense ("has been created") and the progressive tense ("is creating").
5. **Avoid gerunds as nouns** where a plain noun or verb works. Write "to
   update the file", not "for updating the file".
6. **Keep articles.** Write "the file", "a decision" — do not drop articles to
   save words.
7. **Limit noun clusters to three words.** Write "the ADR numbering rule", not
   "the ADR sequential numbering assignment rule".
8. **Use one word for one meaning.** Do not use two words for the same idea in
   one document. See the [approved terms table](#approved-terms).
9. **Use imperative mood for procedures.** Write "run the command", not "you
   should run the command" or "the command should be run".
10. **Do not use idiom, metaphor, or slang.** Write "this is the most
    important rule", not "this is the crown jewel of the rule set".
11. **Limit a paragraph to six sentences.** Split a longer paragraph into two.
12. **Do not use a Latin abbreviation.** Write "for example" instead of
    "e.g.", "and so on" instead of "etc.", and "that is" instead of "i.e."

## Approved terms

Use the term in the left column. Do not use the terms in the right column for
the same idea.

| Approved term | Do not use |
|---|---|
| knowledge base | docs, documentation set, corpus |
| spec | specification, spec document |
| ADR | decision record, architecture doc |
| agent | AI, assistant, bot |
| skill | command, tool, capability |
| scaffold | template set, starter kit |
| placeholder | stub, TODO marker |
| milestone | phase, stage |
| taxonomy | structure, organisation scheme |
| provenance | source trail, origin record |

Add a row here when a new term enters common use in this knowledge base.

## Technical Names and Technical Verbs

ASD-STE100 allows two exceptions to the approved-word dictionary: **Technical
Names** (nouns specific to a domain) and **Technical Verbs** (verbs specific to
a domain). This knowledge base allows:

- The architecture vocabulary the engineering skills use: `module`,
  `interface`, `seam`, `depth`, `adapter`, `implementation`, `locality`,
  `leverage` (as a verb meaning "use existing structure")
- Domain terms defined in the project's `CONTEXT.md`, once it exists

Use a Technical Name or Technical Verb consistently. Do not substitute a
synonym for it.

## Precedence

This standard governs the files and pages listed under [Scope](#scope).

The `writing-for-agents` skill governs skill authoring under
`.agents/skills/`. That skill asks the writer to coin and repeat a metaphor as
a teaching device. This standard does not allow metaphor. The two standards
apply to different files and do not conflict in practice.

If a metaphor from a skill is load-bearing in an ADR or in `docs/agents/`,
define it once as a Technical Name in the [approved terms table](#approved-terms)
and use it consistently after that.

## Future enforcement

A linter such as Vale can check some of these rules automatically. This repo
has no build pipeline yet, so this standard is not enforced by tooling. Add
Vale as a future improvement if the project gains a CI pipeline.
