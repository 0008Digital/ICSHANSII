import {createHash} from 'node:crypto';
import {readFile, writeFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const manifestURL = new URL('./preservation.json', import.meta.url);
const excluded = new Set([
  'src/app/developer/page.tsx', 'src/app/teacher-dashboard/page.tsx', 'src/app/student-portal/page.tsx',
  'src/components/ics/developer-console.tsx', 'src/components/ics/teacher-dashboard.tsx',
  'src/components/ics/teacher-dashboard-model.mjs', 'src/components/ics/student-portal.tsx',
]);
async function walk(directory) {
  const entries = await readdir(path.join(root, directory), {withFileTypes: true});
  return (await Promise.all(entries.map(entry => {
    const relative = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(relative) : [relative];
  }))).flat();
}
const digest = async relative => createHash('sha256').update(await readFile(path.join(root, relative))).digest('hex');

export async function verifyPreservation() {
  const manifest = JSON.parse(await readFile(manifestURL, 'utf8'));
  const issues = [];
  for (const [relative, expected] of Object.entries(manifest.files)) {
    try { if (await digest(relative) !== expected) issues.push(`Changed protected file: ${relative}`); }
    catch { issues.push(`Missing protected file: ${relative}`); }
  }
  return {checked: Object.keys(manifest.files).length, issues};
}

// Capture is explicit, never part of a test run. Review manifest changes like code.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'capture') {
    const files = [...await walk('src'), ...await walk('public/open-glass-scenes'),
      'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json', 'eslint.config.mjs',
      'scripts/verify-openglass.mjs'].filter(file => !excluded.has(file)).sort();
    const hashes = Object.fromEntries(await Promise.all(files.map(async file => [file, await digest(file)])));
    await writeFile(manifestURL, JSON.stringify({schemaVersion: 1, baselineCommit: '1eb401870b90c3e4db134609928077b1686a6f87',
      scope: 'Admin/Manager shared implementation; Settings preserved without visual approval', files: hashes}, null, 2) + '\n');
    console.log(`Captured ${files.length} protected files. Review before accepting.`);
  } else {
    const result = await verifyPreservation();
    console.log(JSON.stringify(result, null, 2));
    if (result.issues.length) process.exitCode = 1;
  }
}
