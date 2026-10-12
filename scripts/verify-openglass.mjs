import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const vendor = new URL("../src/vendor/open-glass-ui/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("provenance.json", vendor), "utf8"));
const files = [
  ...manifest.files.map((file) => ({ path: `dist/${file.file}`, hash: file.sha256 })),
  ...manifest.notices.map((file) => ({ path: file.file, hash: file.sha256 })),
];
for (const file of files) {
  const contents = await readFile(new URL(file.path, vendor));
  const actual = createHash("sha256").update(contents).digest("hex");
  if (actual !== file.hash.toLowerCase()) {
    throw new Error(`OpenGlass SHA-256 mismatch: ${file.path}`);
  }
}
console.log(`Verified ${files.length} OpenGlass files against ${manifest.sourceCommit}.`);
