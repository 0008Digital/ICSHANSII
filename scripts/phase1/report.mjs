import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export function consolidateBrowserReports(primary, recheck = null) {
  const latest = new Map(primary.results.map(result => [result.name, {...result, source: 'browser-results.json'}]));
  const appliedRechecks = [];
  if (recheck && recheck.updatedAt > primary.updatedAt) {
    if (recheck.baseURL !== primary.baseURL) throw new Error('Cannot merge different localhost runs');
    for (const result of recheck.results) {
      if (!latest.has(result.name)) throw new Error(`Recheck has no primary result: ${result.name}`);
      latest.set(result.name, {...result, source: 'rechecks/browser-results.json'});
      appliedRechecks.push(result.name);
    }
  }
  const results = [...latest.values()];
  return {schemaVersion: 1, primaryUpdatedAt: primary.updatedAt, appliedRechecks,
    settingsVisualApproval: false, baselineScreenshots: primary.screenshots.length,
    summary: {passed: results.filter(row => row.status === 'passed').length, failed: results.filter(row => row.status === 'failed').length},
    results};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = new URL('../../qa-artifacts/phase1/', import.meta.url);
  const primary = JSON.parse(await readFile(new URL('browser-results.json', directory), 'utf8'));
  let recheck = null;
  try { recheck = JSON.parse(await readFile(new URL('rechecks/browser-results.json', directory), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const report = consolidateBrowserReports(primary, recheck);
  await writeFile(new URL('summary.json', directory), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({summary: report.summary, screenshots: report.baselineScreenshots,
    failures: report.results.filter(row => row.status === 'failed').map(row => row.name)}, null, 2));
  if (report.summary.failed) process.exitCode = 1;
}
