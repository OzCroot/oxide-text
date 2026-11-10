import { appCommands } from "./app-commands";
import { editorCommands } from "./editor-commands";
import { markdownCommands } from "./markdown-commands";
import { CommandRegistry } from "./registry";

export function createRegistry(): CommandRegistry {
  const r = new CommandRegistry();
  r.register(...appCommands, ...editorCommands, ...markdownCommands);
  return r;
}

export type { AppActions, Command, CommandContext } from "./registry";
export { CommandRegistry } from "./registry";
