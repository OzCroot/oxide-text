// These packages have no type declarations.
declare module "markdown-it-task-lists" {
  const plugin: (md: unknown, options?: { enabled?: boolean; label?: boolean; labelAfter?: boolean }) => void;
  export default plugin;
}
declare module "markdown-it-footnote" {
  const plugin: (md: unknown) => void;
  export default plugin;
}
declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";
  export const gfm: TurndownService.Plugin;
  export const tables: TurndownService.Plugin;
  export const strikethrough: TurndownService.Plugin;
  export const taskListItems: TurndownService.Plugin;
}
