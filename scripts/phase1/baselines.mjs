import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {routesFor, detailRoutes, isApprovedBaseline, sizes} from './contracts.mjs';

export async function verifyBaselines(root = fileURLToPath(new URL('../../qa-artifacts/phase1/', import.meta.url))) {
  const rows = JSON.parse(await readFile(path.join(root, 'baseline-index.json'), 'utf8'));
  const issues = [];
  const expected = [];
  for (const role of ['admin', 'manager']) for (const size of Object.keys(sizes)) {
    for (const [, href] of [...routesFor(role), ...detailRoutes].filter(([, href]) => isApprovedBaseline(href))) expected.push(`${role}/${size}:${href}`);
  }
  const actual = rows.map(row => `${row.role}/${row.size}:${row.href}`);
  if (new Set(actual).size !== actual.length) issues.push('Duplicate baseline entries');
  for (const key of expected) if (!actual.includes(key)) issues.push(`Missing baseline: ${key}`);
  for (const key of actual) if (!expected.includes(key)) issues.push(`Unexpected baseline: ${key}`);
  for (const row of rows) {
    if (!isApprovedBaseline(row.href)) issues.push('Settings must not be an approved visual baseline');
    const absolute = path.resolve(root, row.file);
    if (!absolute.startsWith(path.resolve(root) + path.sep)) { issues.push(`Invalid baseline path: ${row.file}`); continue; }
    try {
      const hash = createHash('sha256').update(await readFile(absolute)).digest('hex');
      if (hash !== row.sha256) issues.push(`Changed baseline image: ${row.file}`);
    } catch { issues.push(`Missing baseline image: ${row.file}`); }
  }
  return {checked: rows.length, expected: expected.length, settingsVisualApproval: false, issues};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await verifyBaselines(); console.log(JSON.stringify(result, null, 2));
  if (result.issues.length) process.exitCode = 1;
}
