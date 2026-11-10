import { appCommands } from "./app-commands";
import { editorCommands } from "./editor-commands";
import { CommandRegistry } from "./registry";

export function createRegistry(): CommandRegistry {
  const r = new CommandRegistry();
  r.register(...appCommands, ...editorCommands);
  return r;
}

export type { AppActions, Command, CommandContext } from "./registry";
export { CommandRegistry } from "./registry";
