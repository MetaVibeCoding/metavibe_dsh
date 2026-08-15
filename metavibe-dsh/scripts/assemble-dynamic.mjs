// Assemble the session demo (dynamic Cordis Package) 1:1 from the COMPILED
// TypeScript sources (lib/types/*.js — the `tsc` emit, byte-faithful to src).
// The dynamic Package cannot use `import`, so this script inlines the module
// graph into one function body that returns the plugin, routing
// `defineTool`/`registerTool` through the `harness` builtin.
//
// Run `pnpm build` before this script; the assembled output is written to
// dist/dynamic-package.js.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

// Concatenation order — dependency order inside the single shared scope.
const FILES = [
  "lib/types/data/hub.js",
  "lib/types/data/catalog.js",
  "lib/types/data/prompt-template.js",
  "lib/types/specs.js",
  "lib/types/fs-utils.js",
  "lib/types/guardrail.js",
  "lib/types/rules.js",
  "lib/types/engine.js",
  "lib/types/tools/helpers.js",
  "lib/types/tools/hub.js",
  "lib/types/tools/guardrail.js",
  "lib/types/tools/extract.js",
  "lib/types/tools/catalog.js",
  "lib/types/tools/index.js",
];

// Remove ESM import/re-export statements so every symbol shares one scope.
function stripModuleSyntax(src) {
  let out = src;
  out = out.replace(/^import\s+[^;]+;\s*$/gm, ""); // import { a } from "...";
  out = out.replace(/^export\s+(?:type\s+)?\{[\s\S]*?\}\s*from\s+["'][^"']+["'];\s*$/gm, ""); // export (type) { a } from "...";
  out = out.replace(/export\s*\{[\s\S]*?\}\s*;/g, ""); // export { a, b }; blocks
  out = out.replace(/\bexport\s+/g, ""); // export const / function / async
  return out;
}

// state-aware comment stripper (keeps comments inside strings/templates)
function stripComments(src) {
  let out = "", i = 0, state = "code", quote = "";
  const n = src.length;
  while (i < n) {
    const c = src[i], next = src[i + 1];
    if (state === "line") { if (c === "\n") { state = "code"; out += "\n"; } i++; continue; }
    if (state === "block") { if (c === "*" && next === "/") { state = "code"; i += 2; } else i++; continue; }
    if (state === "str") {
      out += c;
      if (c === "\\") { out += next ?? ""; i += 2; continue; }
      if (c === quote) state = "code";
      i++; continue;
    }
    if (state === "tpl") {
      out += c;
      if (c === "\\") { out += next ?? ""; i += 2; continue; }
      if (c === "`") state = "code";
      if (c === "$" && next === "{") { out += next; state = "tplExpr"; i += 2; continue; }
      i++; continue;
    }
    if (state === "tplExpr" || state === "tplExprDeep") {
      out += c;
      if (c === "`") { state = "tpl"; i++; continue; }
      if (c === "\"" || c === "'") { quote = c; state = "str"; i++; continue; }
      if (c === "}" && state === "tplExpr") { state = "tpl"; i++; continue; }
      i++; continue;
    }
    if (c === "/" && next === "/") { state = "line"; i += 2; continue; }
    if (c === "/" && next === "*") { state = "block"; i += 2; continue; }
    if (c === "\"" || c === "'") { quote = c; state = "str"; out += c; i++; continue; }
    if (c === "`") { state = "tpl"; out += c; i++; continue; }
    out += c; i++;
  }
  return out;
}

let body = "";
for (const file of FILES) body += stripModuleSyntax(read(file)) + "\n";

// tools/*.js speak ctx.tools.register(defineTool(...)); the dynamic Package
// routes both through the `harness` builtin.
body = body.replace(/defineTool\(/g, "harness.defineTool(");

const wrapper = `return {
  name: "metavibe",
  apply(ctx) {
    const fs = ctx.get("fs");
    if (fs === undefined) { console.warn("metavibe: fs seam unavailable; tools not registered"); return; }
    const toolCtx = { fs, tools: { register: (def) => harness.registerTool(ctx, def) } };
    registerTools(toolCtx, {});
  },
};`;

let full = stripComments(body) + "\n" + wrapper;
full = full.replace(/\n{3,}/g, "\n\n");
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "dynamic-package.js"), full);
console.log(`assembled ${full.length} bytes -> dist/dynamic-package.js`);
