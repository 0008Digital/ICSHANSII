// Runs through the documented Codex browser API, injected by the caller.
// No browser launch, network client, storage injection, application patching,
// animation suppression or dependency installation is performed here.
import assert from 'node:assert/strict';
import {mkdir, writeFile, readFile, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {routesFor, roleLabels, sizes, detailRoutes, isApprovedBaseline} from './contracts.mjs';

export async function createCentreRegression({tab, viewport, artifactDir, captureBaselines = false, baseURL = 'http://localhost:3000', scenarioFilter = null}) {
  const base = new URL(baseURL);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Only localhost is allowed');
  assert.equal(new URL(await tab.url()).origin, base.origin, 'Use the existing local application tab');
  const results = [], notes = [];
  let screenshots = [];
  try { screenshots = JSON.parse(await readFile(path.join(artifactDir, 'baseline-index.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const originalURL = await tab.url();
  const originalIdentity = await tab.playwright.getByRole('combobox', {name: 'Demo user preview', exact: true}).evaluate(element => element.value);
  const button = name => tab.playwright.getByRole('button', {name, exact: true});
  const field = name => tab.playwright.getByRole('textbox', {name});
  const main = () => tab.playwright.getByRole('main');
  // Keyboard entry avoids the browser connector's clipboard target-token race.
  // Assert the resulting value so a focus mistake cannot silently pass.
  async function enterText(control, value, verifyValue = true) {
    await control.press('Control+A');
    await control.pressSequentially(value);
    // Phone values are redacted by the connector even inside read-only evaluation.
    // Admission validation below verifies that the fictional phone was accepted.
    if (verifyValue) assert.equal(await control.evaluate((element, expected) => element.value === expected, value), true, 'Keyboard entry must reach the intended input');
  }
  const slug = value => value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'dashboard';
  await mkdir(artifactDir, {recursive: true});
  async function saveReport() {
    await writeFile(path.join(artifactDir, 'browser-results.json'), JSON.stringify({
      schemaVersion: 1, baselineCommit: '1eb401870b90c3e4db134609928077b1686a6f87', baseURL, updatedAt: new Date().toISOString(),
      summary: {passed: results.filter(row => row.status === 'passed').length, failed: results.filter(row => row.status === 'failed').length},
      settingsVisualApproval: false, scenarioFilter, visualComparison: 'Reference screenshots only; no pixel-diff assertion. Motion remains enabled.',
      results, screenshots, notes,
    }, null, 2) + '\n');
  }
  async function check(name, action) {
    if (scenarioFilter && !scenarioFilter.includes(name) && !name.startsWith('cleanup:')) return null;
    const started = Date.now();
    try { const evidence = await action(); results.push({name, status: 'passed', durationMs: Date.now() - started, evidence}); }
    catch (error) {
      const row = {name, status: 'failed', durationMs: Date.now() - started, error: String(error?.stack || error)};
      try {
        const relative = `failures/${slug(name)}.jpg`;
        await mkdir(path.join(artifactDir, 'failures'), {recursive: true});
        await writeFile(path.join(artifactDir, relative), await tab.screenshot({fullPage: false}));
        row.screenshot = relative;
      } catch (captureError) { row.captureError = String(captureError); }
      results.push(row);
    }
    await saveReport();
    return results.at(-1);
  }
  async function ready(title, href) {
    await main().getByRole('heading', {name: title, exact: true}).waitFor({state: 'visible', timeoutMs: 20000});
    await tab.playwright.domSnapshot();
    const width = await tab.playwright.evaluate(() => innerWidth);
    await tab.playwright.getByRole('navigation', {name: width < 768 ? 'Mobile navigation' : 'Main navigation', exact: true}).waitFor({state: 'visible', timeoutMs: 20000});
    assert.equal(new URL(await tab.url()).pathname, href);
  }
  async function pickerClosed(name) {
    await tab.playwright.getByRole('dialog', {name, exact: true}).waitFor({state: 'hidden', timeoutMs: 10000});
  }
  async function pressed(name, expected = true) {
    await button(name).and(tab.playwright.locator(`[aria-pressed="${expected}"]`)).waitFor({state: 'visible', timeoutMs: 3000});
    assert.equal(await button(name).getAttribute('aria-pressed'), String(expected));
  }
  async function open(href, title) { await tab.goto(`${base.origin}${href}`); await ready(title, href); }
  async function selectRole(role, size) {
    assert.ok(roleLabels[role] && sizes[size]);
    await viewport.set(sizes[size]);
    await tab.playwright.getByRole('combobox', {name: 'Demo user preview', exact: true}).selectOption({label: roleLabels[role]});
    await open('/', 'Dashboard');
    assert.equal(await tab.playwright.evaluate(() => innerWidth), sizes[size].width,
      'Verify the actual CSS viewport; compensate for browser scaling in the caller');
    assert.equal(await tab.playwright.getByRole('combobox', {name: 'Demo user preview', exact: true}).evaluate(element => element.options[element.selectedIndex].text), roleLabels[role]);
  }
  async function navigate(title, href, size) {
    if (size === 'desktop') {
      const scope = tab.playwright.getByRole('navigation', {name: href === '/settings' ? 'Workspace settings' : 'Main navigation', exact: true});
      await scope.getByRole('link', {name: title, exact: true}).click();
    } else if (['/', '/students', '/batches', '/attendance'].includes(href)) {
      await tab.playwright.getByRole('navigation', {name: 'Mobile navigation', exact: true}).getByRole('link', {name: title, exact: true}).click();
    } else {
      await button('More navigation').click();
      await tab.playwright.getByRole('dialog', {name: 'More navigation', exact: true}).getByRole('link', {name: title, exact: true}).click();
    }
    await ready(title, href);
  }
  async function geometry(size) {
    const state = await tab.playwright.evaluate(() => {
      const rectangle = selector => { const element = document.querySelector(selector); if (!element) return null;
        const rect = element.getBoundingClientRect(); return {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
          display: getComputedStyle(element).display, position: getComputedStyle(element).position}; };
      const heading = document.querySelector('main h1')?.getBoundingClientRect();
      return {width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth,
        header: rectangle('.global-workspace-header'), sidebar: rectangle('.sidebar'), workspace: rectangle('.workspace'),
        dock: rectangle('.ics-mobile-dock'), headingTop: heading?.top};
    });
    assert.equal(state.width, sizes[size].width);
    assert.ok(state.documentWidth <= state.width + 1, `Document overflow: ${JSON.stringify(state)}`);
    assert.equal(state.header?.position, 'fixed');
    if (size === 'desktop') {
      assert.equal(state.sidebar?.position, 'fixed');
      assert.ok(Math.abs(state.workspace.left - state.sidebar.right) <= 1, 'Sidebar/workspace overlap');
    } else {
      assert.equal(state.sidebar?.display, 'none');
      assert.equal(state.dock?.position, 'fixed');
      assert.ok(state.dock.left >= -1 && state.dock.right <= state.width + 1, 'Mobile dock is clipped');
    }
    return state;
  }
  async function capture(role, size, title, href) {
    if (!captureBaselines || !isApprovedBaseline(href)) return;
    const relative = `baselines/${role}/${size}/${slug(href)}.jpg`;
    const destination = path.join(artifactDir, relative);
    try {
      await access(destination);
      const existing = screenshots.find(row => row.file === relative);
      assert.ok(existing, `Existing image has no baseline index entry: ${relative}`);
      assert.equal(createHash('sha256').update(await readFile(destination)).digest('hex'), existing.sha256, `Baseline image changed: ${relative}`);
      return; // Reuse the original reference; never silently replace it.
    }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await mkdir(path.dirname(destination), {recursive: true});
    const bytes = await tab.screenshot({fullPage: true});
    await writeFile(destination, bytes);
    const appearance = await tab.playwright.evaluate(() => ({theme: document.documentElement.dataset.appearance,
      interfaceMotion: document.documentElement.dataset.userMotion, scene: document.querySelector('.application-scene')?.getAttribute('data-source')}));
    screenshots.push({role, size, title, href, file: relative, appearance, approvedScreenScope: true, sha256: createHash('sha256').update(bytes).digest('hex'), capturedAt: new Date().toISOString()});
    await writeFile(path.join(artifactDir, 'baseline-index.json'), JSON.stringify(screenshots, null, 2) + '\n');
  }
  async function routes(role, size) {
    await selectRole(role, size);
    await check(`${role}/${size}: navigation destinations`, async () => {
      let links;
      if (size === 'desktop') {
        links = await tab.playwright.evaluate(() => Array.from(document.querySelectorAll('.sidebar a')).map(element => [element.textContent.trim(), element.getAttribute('href')]));
      } else {
        await button('More navigation').click();
        links = await tab.playwright.evaluate(() => Array.from(document.querySelectorAll('nav[aria-label="Mobile navigation"] a, [role="dialog"][aria-label="More navigation"] a')).map(element => [element.textContent.trim(), element.getAttribute('href')]));
        await button('More navigation').click();
      }
      assert.deepEqual([...new Set(links.map(([, href]) => href))].sort(), routesFor(role).map(([, href]) => href).sort());
      return links;
    });
    for (const [title, href] of routesFor(role)) {
      await check(`${role}/${size}: navigate ${href}`, async () => {
        await navigate(title, href, size);
        const bounds = await geometry(size);
        await capture(role, size, title, href);
        return {href, bounds, visualBaseline: isApprovedBaseline(href)};
      });
    }
    for (const [title, href] of detailRoutes) {
      await check(`${role}/${size}: direct ${href}`, async () => {
        await open(href, title); const bounds = await geometry(size); await capture(role, size, title, href); return bounds;
      });
    }
    return results.filter(row => row.name.startsWith(`${role}/${size}`));
  }
  async function workflows(role, size) {
    await selectRole(role, size);
    await check(`${role}/${size}: keyboard search and role scope`, async () => {
      await button('Search pages and actions').click();
      const input = tab.playwright.getByRole('combobox', {name: 'Search pages and actions Esc', exact: true});
      if (role === 'manager') { await input.fill('Ledger'); assert.match(await tab.playwright.getByRole('dialog').innerText(), /No matching pages or actions/); }
      await input.fill('Students'); await input.press('Enter'); await ready('Students', '/students');
    });
    await check(`${role}/${size}: Back and Forward preserve route navigation`, async () => {
      await open('/', 'Dashboard'); await navigate('Students', '/students', size);
      await tab.back(); await ready('Dashboard', '/'); await tab.forward(); await ready('Students', '/students');
    });
    await check(`${role}/${size}: demo directory CSV download`, async () => {
      await open('/students', 'Students'); await button('Quick actions').click();
      await tab.playwright.getByRole('menuitem', {name: 'Export', exact: true}).click();
      const pending = tab.playwright.waitForEvent('download', {timeoutMs: 15000});
      await button('Download CSV').click(); const downloaded = await (await pending).path({timeoutMs: 15000});
      assert.ok(downloaded, 'No CSV download path was returned');
      const csv = await readFile(downloaded, 'utf8'); assert.match(csv, /DEMO DATA/); assert.match(csv, /Aarav Example/);
      assert.doesNotMatch(csv, /QA Fictional Student/); await button('Close Export Centre').click();
      return {demoCsvVerified: true};
    });
    await check(`${role}/${size}: directory matching and empty search`, async () => {
      await open('/students', 'Students'); const input = tab.playwright.getByRole('searchbox', {name: 'Search students', exact: true});
      await input.fill('Aarav'); assert.match(await main().innerText(), /1 of 5 fictional students/);
      await input.fill('qa-no-match'); assert.match(await main().innerText(), /No students match these filters/);
      await input.fill(''); assert.match(await main().innerText(), /5 of 5 fictional students/);
    });
    await check(`${role}/${size}: six directory views`, async () => {
      await open('/students', 'Students');
      for (const [name, expected] of [['By Batch', /Batch directory/], ['Enrollments', /DEMO-ENR-001/],
        ['Fee Follow-ups', /Fee follow-ups are unavailable/], ['Renewal Due', /3 of 5 fictional students/],
        ['Archive', /Student Archive/], ['All Students', /5 of 5 fictional students/]]) {
        await button(name).click(); assert.match(await main().innerText(), expected);
      }
    });
    await check(`${role}/${size}: Quick Add Student and required validation`, async () => {
      await open('/students', 'Students'); await button('Quick actions').click();
      await tab.playwright.getByRole('menuitem', {name: 'Add Student', exact: true}).click(); await ready('Add Student', '/students/new');
      await button('Review Admission').click(); assert.match(await main().innerText(), /Check the highlighted details/);
    });
    await check(`${role}/${size}: valid fictional admission review and unchanged directory`, async () => {
      await open('/students/new', 'Add Student');
      for (const [label, value] of [['Student Full Name','QA Fictional Student'], ['Registration Number','QA-LOCAL-001'],
        ["Father's Name",'QA Father'], ["Mother's Name",'QA Mother'], ['Parent / Guardian Phone Number','9999999999'], ['Total Fees','1000']]) await enterText(field(label), value, label !== 'Parent / Guardian Phone Number');
      await button('Admission Batch Choose a batch').press('Enter');
      await tab.playwright.getByRole('dialog', {name: 'Admission Batch', exact: true}).waitFor({state: 'visible'});
      await tab.playwright.getByRole('option', {name: 'New General', exact: true}).press('Enter');
      await pickerClosed('Admission Batch'); await button('Review Admission').press('Enter');
      await main().getByRole('heading', {name: 'Admission preview', exact: true}).waitFor({state: 'visible'});
      assert.match(await main().innerText(), /Admission preview/); assert.match(await main().innerText(), /Nothing is saved/);
      await open('/students', 'Students'); assert.match(await main().innerText(), /5 of 5 fictional students/);
      assert.doesNotMatch(await main().innerText(), /QA Fictional Student/);
    });
    await check(`${role}/${size}: profile and edit navigation`, async () => {
      await open('/students', 'Students'); await main().getByRole('link', {name: 'Aarav Example', exact: true}).filter({visible: true}).first().click();
      await ready('Aarav Example', '/students/DEMO-001'); await tab.playwright.getByRole('link', {name: 'Edit student details', exact: true}).click();
      await ready('Edit student details', '/students/DEMO-001/edit'); await button('Preview changes').click();
      assert.match(await main().innerText(), /Check the highlighted details/);
    });
    await check(`${role}/${size}: batch catalogue and validation`, async () => {
      await open('/batches', 'Batches'); await button('Batch New General').press('Enter');
      await tab.playwright.getByRole('dialog', {name: 'Batch', exact: true}).waitFor({state: 'visible'});
      await tab.playwright.getByRole('option', {name: 'Old General', exact: true}).press('Enter'); await pickerClosed('Batch');
      await button('Validate preview').press('Enter'); assert.match(await main().innerText(), /Date preview checked/);
      await button('Reset').press('Enter'); assert.match(await main().innerText(), /Old General/);
    });
    await check(`${role}/${size}: temporary attendance mark and review`, async () => {
      await open('/attendance', 'Attendance'); await field('Roll number or student name').fill('101');
      assert.match(await main().innerText(), /Matched one active fictional student/); await button('Present').click(); await button('Review register').click();
      assert.match(await main().innerText(), /Present 1 · Absent 0 · Leave 0/);
      await tab.reload(); await ready('Attendance', '/attendance'); assert.match(await main().innerText(), /0 \/ 1 marked/);
    });
    await check(`${role}/${size}: calendar overlay fits and Escape closes`, async () => {
      await open('/attendance', 'Attendance');
      await tab.playwright.getByRole('button', {name: /^Attendance Date /}).click();
      const dialog = tab.playwright.getByRole('dialog', {name: 'Attendance Date', exact: true});
      const bounds = await dialog.evaluate(element => {const r = element.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:innerWidth,height:innerHeight};});
      assert.ok(bounds.left >= -1 && bounds.right <= bounds.width + 1 && bounds.top >= -1 && bounds.bottom <= bounds.height + 1, JSON.stringify(bounds));
      await button('Close Attendance Date').press('Escape'); await pickerClosed('Attendance Date'); return bounds;
    });
    await check(`${role}/${size}: assessment validation and unpublished preview`, async () => {
      await open('/tests-results', 'Tests & Results'); await button('Review results').press('Enter');
      assert.match(await main().innerText(), /Complete the subject, date, maximum marks/);
      await enterText(field(/^Subject/), 'QA Mathematics'); await enterText(field('Marks for Aarav Example'), '101');
      await button('Review results').press('Enter'); assert.match(await main().innerText(), /Enter a valid score from 0 to 100/);
      await button('Test date Choose date').press('Enter');
      const today = new Date().toLocaleDateString('en-GB', {timeZone: 'Asia/Kolkata', day: '2-digit', month: 'long', year: 'numeric'});
      await button(today).press('Enter'); await pickerClosed('Test date'); await enterText(field('Marks for Aarav Example'), '75');
      await button('Review results').press('Enter'); assert.match(await main().innerText(), /Proposed order · unpublished preview/);
      assert.match(await main().innerText(), /75\.00%/);
    });
    await check(`${role}/${size}: fee tabs, validation and fictional installment`, async () => {
      await open('/fees', 'Fees');
      for (const name of ['Expired Fees 0 connected', 'Paid 0 connected', 'Pending 0 connected']) {
        await button(name).click(); assert.equal(await button(name).getAttribute('aria-pressed'), 'true');
      }
      await button('Preview Collect Fee').click(); await button('Preview installment').click(); assert.match(await main().innerText(), /Choose a payment mode/);
      await field(/^Current outstanding/).fill('1000'); await field(/^Amount to preview/).fill('250');
      await button('Payment Mode Choose payment mode').click(); await tab.playwright.getByRole('option', {name: 'Cash', exact: true}).click();
      await pickerClosed('Payment Mode'); await button('Preview installment').click();
      await tab.playwright.getByText('Unsaved installment previews', {exact: true}).waitFor({state: 'visible', timeoutMs: 10000});
      assert.match(await main().innerText(), /Remaining ₹750\.00/);
      assert.match(await main().innerText(), /No payment was confirmed or recorded/);
    });
    if (role === 'admin') {
      await check(`${role}/${size}: ledger filter totals`, async () => {
        await open('/ledger', 'Ledger'); await tab.playwright.getByRole('searchbox', {name: 'Search transactions', exact: true}).fill('qa-no-match');
        assert.match(await main().innerText(), /0 fictional transactions/); assert.match(await main().innerText(), /₹0\.00/);
      });
      await check(`${role}/${size}: audit pagination, table and detail dialog`, async () => {
        await open('/audit-logs', 'Audit Logs'); await button('Next').click(); assert.match(await main().innerText(), /Page 2 of 2/);
        await button('Table').click(); await button('Details').click(); assert.match(await tab.playwright.getByRole('dialog').innerText(), /DEMO-AUD-001/);
        await button('Close event details').click();
      });
    }
    await check(`${role}/${size}: chat preview respects default role access`, async () => {
      await open('/chatrooms', 'Chatrooms');
      if (role === 'manager') {
        assert.match(await main().innerText(), /No rooms are enabled/); assert.equal(await field('Message preview').count(), 0);
      } else {
        await field('Message preview').fill('QA fictional local preview only'); await button('Preview send').click();
        assert.match(await main().innerText(), /Message added to this local demo preview only/);
        await tab.reload(); await ready('Chatrooms', '/chatrooms'); assert.doesNotMatch(await main().innerText(), /QA fictional local preview only/);
      }
    });
    return results.filter(row => row.name.startsWith(`${role}/${size}`));
  }
  async function settings(role, size) {
    await selectRole(role, size); await open('/settings', 'Settings');
    const pressedTheme = () => tab.playwright.getByRole('group', {name: 'Appearance', exact: true}).evaluate(element => element.querySelector('[aria-pressed="true"]')?.textContent.trim());
    const originalTheme = await pressedTheme();
    await check(`${role}/${size}: Settings role sections (not visual approval)`, async () => {
      assert.equal(await field('Centre display name').count(), role === 'admin' ? 1 : 0);
      assert.equal(await tab.playwright.getByRole('navigation', {name: 'Settings sections'}).getByRole('link', {name: 'Branding', exact: true}).count(), role === 'admin' ? 1 : 0);
      return {settingsVisualApproval: false};
    });
    await check(`${role}/${size}: theme preview/discard and Apply reload restore`, async () => {
      const other = originalTheme === 'Dark' ? 'Light' : 'Dark';
      try {
        await button(other).click(); assert.equal(await pressedTheme(), other); await button('Discard preview').click(); assert.equal(await pressedTheme(), originalTheme);
        await button(other).click(); await button('Apply appearance').click(); await tab.reload(); await ready('Settings', '/settings'); assert.equal(await pressedTheme(), other);
      } finally {
        await button(originalTheme).click(); if (await button('Apply appearance').isEnabled()) await button('Apply appearance').click();
        await tab.reload(); await ready('Settings', '/settings'); assert.equal(await pressedTheme(), originalTheme, 'Theme restoration failed');
      }
    });
    await check(`${role}/${size}: all background source previews and discard`, async () => {
      try { for (const name of ['Motion','Photo','Topo','Chroma','Custom']) { await button(name).click(); assert.equal(await button(name).getAttribute('aria-pressed'), 'true'); } }
      finally { if (await button('Discard preview').isEnabled()) await button('Discard preview').click(); }
    });
    await check(`${role}/${size}: glass material and accent previews`, async () => {
      try {
        for (const name of ['Clear','Regular','Frosted','Blue accent','Teal accent']) { await button(name).click(); assert.equal(await button(name).getAttribute('aria-pressed'), 'true'); }
      } finally { if (await button('Discard preview').isEnabled()) await button('Discard preview').click(); }
    });
    await check(`${role}/${size}: custom accent rejects invalid hex`, async () => {
      await button('Custom accent').click(); await field('Hex color').fill('not-a-color'); await button('Apply hex color').click();
      assert.match(await tab.playwright.getByRole('dialog').innerText(), /Enter a 6-digit hex color/);
      await button('Close Custom accent color selection').click();
    });
    await check(`${role}/${size}: scene motion and interface animation preview`, async () => {
      try {
          await tab.playwright.locator('.appearance-animation-options > summary').click();
        const control = tab.playwright.getByRole('switch', {name: 'Scene Motion', exact: true});
        if (await control.isEnabled()) { const initial = await control.getAttribute('aria-checked'); await control.click(); assert.notEqual(await control.getAttribute('aria-checked'), initial); }
        else notes.push(`${role}/${size}: OS reduced motion disables Scene Motion as designed; toggle not overridden.`);
        for (const name of ['Full','Reduced','Off']) { await button(name).click(); assert.equal(await button(name).getAttribute('aria-pressed'), 'true'); }
      } finally { if (await button('Discard preview').isEnabled()) await button('Discard preview').click(); }
    });
    await check(`${role}/${size}: OpenGlass sliders and comparison-only scope`, async () => {
      await tab.playwright.getByText('Advanced Glass Settings', {exact: true}).click();
      const slider = name => tab.playwright.getByRole('slider', {name, exact: true});
      try {
        for (const [name, key, expected] of [['Optical intensity','End','100'], ['Frost','Home','0']]) {
          await slider(name).press(key); assert.equal(await slider(name).evaluate(element => element.value), expected);
        }
        if (await button('Discard preview').isEnabled()) await button('Discard preview').click();
        assert.equal(await button('Apply appearance').isEnabled(), false);
        for (const name of ['Material comparison','Lighting angle','Lighting spread']) {
          const before = await slider(name).evaluate(element => Number(element.value)); await slider(name).press('ArrowRight');
          assert.equal(await slider(name).evaluate(element => Number(element.value)), before + 1);
        }
        await button('Compare Frosted').click(); await pressed('Compare Frosted');
        assert.equal(await button('Apply appearance').isEnabled(), false, 'Specimen controls must not dirty saved appearance');
        return await geometry(size);
      } finally { if (await button('Discard preview').isEnabled()) await button('Discard preview').click(); }
    });
    await check(`${role}/${size}: floating lens keyboard pause/resume`, async () => {
      await button('Hold floating glass lens').press('Space'); await pressed('Hold floating glass lens');
      await button('Hold floating glass lens').press('Space'); await pressed('Hold floating glass lens', false);
    });
    await check(`${role}/${size}: floating lens pointer pause/resume`, async () => {
      try {
        await button('Hold floating glass lens').click(); await pressed('Hold floating glass lens');
        await button('Hold floating glass lens').click(); await pressed('Hold floating glass lens', false);
      } finally {
        if (await button('Hold floating glass lens').getAttribute('aria-pressed') === 'true') await button('Hold floating glass lens').press('Space');
      }
    });
    await check(`${role}/${size}: Reset to Default is an unsaved preview`, async () => {
      try {
        await button(originalTheme === 'Dark' ? 'Light' : 'Dark').click(); await button('Reset to Default').click();
        assert.equal(await pressedTheme(), 'System'); assert.equal(await button('Motion').getAttribute('aria-pressed'), 'true');
        assert.equal(await button('Clear').getAttribute('aria-pressed'), 'true');
      } finally { if (await button('Discard preview').isEnabled()) await button('Discard preview').click(); }
      assert.equal(await pressedTheme(), originalTheme);
    });
    if (role === 'admin') await check(`${role}/${size}: branding draft/reset does not apply`, async () => {
      const name = await field('Centre display name').evaluate(element => element.value);
      try { await field('Centre display name').fill('QA Unsaved Centre'); assert.match(await tab.playwright.getByRole('complementary', {name: 'Centre branding preview'}).innerText(), /QA Unsaved Centre/); }
      finally { await button('Reset draft').click(); }
      assert.equal(await field('Centre display name').evaluate(element => element.value), name);
    });
    await open('/', 'Dashboard'); // discard local comparison/lens state by unmounting
    return results.filter(row => row.name.startsWith(`${role}/${size}`));
  }
  async function finish() {
    await check('cleanup: original demo identity and viewport', async () => {
      await tab.playwright.getByRole('combobox', {name: 'Demo user preview', exact: true}).selectOption(originalIdentity);
      await tab.goto(originalURL); await viewport.reset();
      assert.equal(await tab.playwright.getByRole('combobox', {name: 'Demo user preview', exact: true}).evaluate(element => element.value), originalIdentity);
    });
    await saveReport();
    return {passed: results.filter(row => row.status === 'passed').length, failed: results.filter(row => row.status === 'failed').length,
      failures: results.filter(row => row.status === 'failed').map(({name, error}) => ({name, error})), screenshots: screenshots.length};
  }
  return {routes, workflows, settings, finish, results, screenshots};
}
