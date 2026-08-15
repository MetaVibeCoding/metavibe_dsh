// Regenerate src/data/hub.ts from the skeletons/*.json sources.
// The catalog and prompt-template data were previously generated from the
// retired Python tree; they are now embedded in src/data and edited in place.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, "skeletons");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const specs = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));

let out = "// AUTO-GENERATED from skeletons/*.json - do not edit by hand.\n";
out += "import type { MetaArch } from \"../specs.ts\";\n";
out += "/** Built-in golden meta-architecture specs (MetaVibe Spec Hub). */\n";
// Compact single-line form keeps this generated file under the 300-line cap.
out += `export const HUB_SPECS: readonly MetaArch[] = ${JSON.stringify(specs)};\n`;
const target = path.join(root, "src", "data", "hub.ts");
fs.writeFileSync(target, out);
console.log(`generated ${target} with ${specs.length} specs: ${specs.map((s) => s.name).join(", ")}`);
