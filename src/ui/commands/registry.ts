import type { EditorView } from "@codemirror/view";

/** What the app lets a command do. */
export interface AppActions {
  newFile(): void;
  openFiles(): Promise<void>;
  save(): Promise<void>;
  saveAs(): Promise<void>;
  closeTab(): Promise<void>;
  nextTab(): void;
  previousTab(): void;
  toggleTheme(): void;
  setViewMode(mode: "source" | "preview" | "split"): void;
  cycleViewMode(): void;
  toggleOutline(): void;
  exportHtml(): Promise<void>;
  exportPdf(): Promise<void>;
  copyAsRichText(): Promise<void>;
}

export interface CommandContext {
  view: EditorView | null;
  app: AppActions;
}

export interface Command {
  id: string;
  title: string;
  run(ctx: CommandContext, args?: unknown): void | Promise<void>;
}

/** Every user action is a command with a string id. */
export class CommandRegistry {
  private commands = new Map<string, Command>();

  register(...commands: Command[]): void {
    for (const c of commands) {
      if (this.commands.has(c.id)) throw new Error(`Duplicate command id: ${c.id}`);
      this.commands.set(c.id, c);
    }
  }

  has(id: string): boolean {
    return this.commands.has(id);
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  list(): Command[] {
    return [...this.commands.values()];
  }

  /** Run a command. Returns false if the id is unknown. */
  async run(id: string, ctx: CommandContext, args?: unknown): Promise<boolean> {
    const c = this.commands.get(id);
    if (!c) return false;
    await c.run(ctx, args);
    return true;
  }
}
