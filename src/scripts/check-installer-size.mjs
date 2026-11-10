// Fail if an installer is larger than the size target (10 MiB).
// Run after `pnpm tauri build`. See docs/product/constraints.md.
import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LIMIT = 10 * 1024 * 1024;
// The default is relative to this file, so the script runs from any folder.
const root = process.argv[2] ?? fileURLToPath(new URL("../tauri/target/release/bundle", import.meta.url));
const EXT = new Set([".deb", ".rpm", ".appimage", ".dmg", ".msi", ".exe"]);

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let failed = false;
let found = 0;
for (const file of walk(root)) {
  if (!EXT.has(extname(file).toLowerCase())) continue;
  found++;
  const size = statSync(file).size;
  const mb = (size / 1024 / 1024).toFixed(2);
  const ok = size <= LIMIT;
  console.log(`${ok ? "ok  " : "FAIL"} ${mb} MiB  ${file}`);
  if (!ok) failed = true;
}
if (found === 0) {
  console.error(`No installers found under ${root}`);
  process.exit(1);
}
process.exit(failed ? 1 : 0);
