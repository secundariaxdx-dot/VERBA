// Static build for GitHub Pages.
//
// GitHub Pages has no server, so the optional Claude routes (src/app/api) are
// left out of this build; the app detects that and uses its offline tutor and
// writing analyser. Output goes to out/.
//
// Usage: BASE_PATH=/VERBA node scripts/build-pages.mjs   (BASE_PATH defaults to /VERBA)
import { execSync } from "node:child_process";
import fs from "node:fs";

const basePath = process.env.BASE_PATH ?? "/VERBA";
const api = "src/app/api";
const hidden = ".api-disabled";
const env = { ...process.env, STATIC_EXPORT: "1", BASE_PATH: basePath };

if (fs.existsSync(api)) fs.renameSync(api, hidden);
try {
  fs.rmSync("out", { recursive: true, force: true });
  execSync("npx next build", { stdio: "inherit", env });
} finally {
  if (fs.existsSync(hidden)) fs.renameSync(hidden, api);
}
fs.writeFileSync("out/.nojekyll", "");
console.log(`\nStatic site ready in out/ (base path ${basePath || "/"})`);
