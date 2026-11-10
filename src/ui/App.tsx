import { useCallback, useEffect, useState } from "react";
import { Shell } from "@/Shell";
import { loadConfig, type Config } from "@/lib/api";
import { fallbackSettings, resolveTheme, sanitiseSettings, type Settings, type ThemeSetting } from "@/settings";

function useSystemDark(): boolean {
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return dark;
}

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [keymapErrors, setKeymapErrors] = useState<string[]>([]);
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>("system");
  const systemDark = useSystemDark();
  const theme = resolveTheme(themeSetting, systemDark);

  useEffect(() => {
    loadConfig()
      .then((c) => {
        setConfig(c);
        setErrors(c.errors);
        setThemeSetting(sanitiseSettings(c.settings).theme);
      })
      .catch((e) => {
        // The editor still starts with the defaults.
        setErrors([`Cannot load the config: ${String(e)}`]);
        setConfig({ settings: fallbackSettings, keybindings: [], errors: [], configDir: "" });
      });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const onKeymapErrors = useCallback((e: string[]) => setKeymapErrors(e), []);

  if (!config) return null;
  const settings: Settings = sanitiseSettings(config.settings);
  const all = [...errors, ...keymapErrors];

  return (
    <div className="flex h-full flex-col">
      {all.length > 0 ? (
        <div role="alert" className="shrink-0 border-b border-border bg-accent px-3 py-1 text-xs">
          {all.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
          {config.configDir ? <div className="text-muted-foreground">Config folder: {config.configDir}</div> : null}
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <Shell
          settings={settings}
          userKeybindings={config.keybindings}
          theme={theme}
          setTheme={setThemeSetting}
          onKeymapErrors={onKeymapErrors}
        />
      </div>
    </div>
  );
}
