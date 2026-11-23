// Static build for GitHub Pages ("Deploy from a branch: main / (root)").
//
// The app is published in docs/ (URL .../VERBA/docs/). At the repository root we write:
//   - index.html and 404.html that redirect to the app (instead of showing the README)
//   - .nojekyll so GitHub serves the _next folders untouched
//
// GitHub Pages has no server, so the optional Claude routes (src/app/api) are
// left out; the app detects that and uses its offline tutor and writing analyser.
//
// Usage: node scripts/build-pages.mjs [basePath]   (default /VERBA/docs)
import { execSync } from "node:child_process";
import fs from "node:fs";

const basePath = process.argv[2] ?? process.env.BASE_PATH ?? "/VERBA/docs";
const api = "src/app/api";
const hidden = ".api-disabled";
const env = { ...process.env, STATIC_EXPORT: "1", BASE_PATH: basePath };

if (fs.existsSync(api)) fs.renameSync(api, hidden);
try {
  fs.rmSync("out", { recursive: true, force: true });
  fs.rmSync(".next", { recursive: true, force: true });
  execSync("npx next build", { stdio: "inherit", env });
} finally {
  if (fs.existsSync(hidden)) fs.renameSync(hidden, api);
}
fs.rmSync("docs", { recursive: true, force: true });
fs.cpSync("out", "docs", { recursive: true });
fs.writeFileSync("docs/.nojekyll", "");

const redirect = (target) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VERBA</title>
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f3ebdd;color:#30251f;font:600 20px Georgia,serif;letter-spacing:.18em}</style>
<script>location.replace(${JSON.stringify(target)});</script>
</head>
<body>VERBA</body>
</html>
`;
fs.writeFileSync("index.html", redirect(`${basePath}/`));
fs.writeFileSync("404.html", redirect(`${basePath}/`));
fs.writeFileSync(".nojekyll", "");
console.log(`\nStatic site ready in docs/ (base path ${basePath})`);
