import {test} from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {workspaceRoleLanding} from '../src/components/ics/workspace-role-model.ts';
import {roleFeatures, workspaceCommands, exportChoices} from '../src/components/ics/workspace-roles.ts';
import {filterStudents, validateAdmission, students} from '../src/components/ics/students/model.ts';
import {localToday} from '../src/components/ics/date-only.mjs';
import {lookupAttendanceRoster} from '../src/components/ics/attendance-model.mjs';
import {validatePaymentPreview} from '../src/components/ics/students/fee-model.mjs';
import {validateAssessment, rankAssessmentPreview} from '../src/components/ics/students/academic-model.mjs';
import {settingsSectionsForRole} from '../src/components/ics/settings-navigation.mjs';
import {routesFor, detailRoutes, isApprovedBaseline} from './phase1/contracts.mjs';
import {verifyPreservation} from './phase1/preservation.mjs';
import {verifyBaselines} from './phase1/baselines.mjs';
import {consolidateBrowserReports} from './phase1/report.mjs';

for (const role of ['admin', 'manager']) {
  test(`Phase 1 ${role}: root landing and exact ordered navigation remain available`, () => {
    assert.equal(workspaceRoleLanding(role), '/');
    assert.deepEqual(roleFeatures(role).map(({label, href}) => [label, href]), routesFor(role));
  });
  test(`Phase 1 ${role}: every linked centre route and student detail route has a page`, async () => {
    for (const [, href] of [...routesFor(role), ...detailRoutes]) {
      const route = href.replace('/DEMO-001', '/[studentId]');
      await access(new URL(`../src/app${route === '/' ? '' : route}/page.tsx`, import.meta.url));
    }
  });
  test(`Phase 1 ${role}: global search preserves admission action and navigation destinations`, () => {
    const commands = workspaceCommands(role);
    assert.deepEqual(commands.filter(item => item.kind === 'route').map(item => item.href), routesFor(role).map(([, href]) => href));
    assert.equal(commands.find(item => item.id === 'add-student')?.href, '/students/new');
    assert.ok(commands.every(item => !['/admin', '/manager', '/developer', '/student-portal', '/teacher-dashboard'].includes(item.href)));
  });
  test(`Phase 1 ${role}: export availability remains explicitly demo-scoped`, () => {
    const enabled = exportChoices(role).filter(item => item.enabled);
    assert.deepEqual(enabled.map(item => item.id), role === 'admin'
      ? ['student-directory', 'batch-lists', 'enrollment-expiry', 'audit-log', 'ledger-transactions', 'income-statement', 'expense-report', 'payment-method-summary']
      : ['student-directory', 'batch-lists']);
    assert.ok(enabled.every(item => item.label.includes('demo data') && item.formats.join() === 'csv'));
  });
}

test('Phase 1: preservation boundary includes Settings without approving its layout', async () => {
  const result = await verifyPreservation();
  assert.ok(result.checked > 100);
  assert.deepEqual(result.issues, []);
});
test('Phase 1: directory filters compose and do not mutate the shared records', () => {
  const before = JSON.stringify(students);
  assert.deepEqual(filterStudents('Aarav', 'New General', 'Active').map(row => row.id), ['DEMO-001']);
  assert.deepEqual(filterStudents('Aarav', 'Old General', 'Active'), []);
  assert.deepEqual(filterStudents('not-a-fictional-student', '', ''), []);
  assert.equal(JSON.stringify(students), before);
});
test('Phase 1: admission accepts a valid draft, rejects overpayment and missing references', () => {
  const valid = {name: 'QA Fictional Student', fatherName: 'QA Father', motherName: 'QA Mother', guardianPhone: '9999999999',
    studentPhone: '', address: '', paperRegistrationNumber: 'QA-LOCAL-001', batch: 'New General', batchDuration: '3',
    admissionDate: localToday(), totalFees: '1000', amountPaid: '0'};
  assert.deepEqual(validateAdmission(valid), {});
  assert.ok(validateAdmission({...valid, amountPaid: '1001'}).amountPaid);
  assert.ok(validateAdmission({...valid, amountPaid: '250', paymentMethod: 'UPI', paymentDate: localToday()}).paymentReference);
});
test('Phase 1: attendance matches the selected fictional roster only', () => {
  const roster = students.filter(row => row.batch === 'New General');
  assert.deepEqual(lookupAttendanceRoster(roster, '101').matches.map(row => row.id), ['DEMO-001']);
  assert.deepEqual(lookupAttendanceRoster(roster, '201').matches, []);
});
test('Phase 1: fee preview rejects a payment beyond the fictional outstanding balance', () => {
  const draft = {amountMinor: 25000, balanceMinor: 100000, paymentDate: '2026-10-13', paymentMode: 'Cash', reference: '', promisedPaymentDate: '', today: '2026-10-14'};
  assert.deepEqual(validatePaymentPreview(draft), {});
  assert.ok(validatePaymentPreview({...draft, amountMinor: 100001}).amount);
});
test('Phase 1: proposed assessment ordering remains separate from publication', () => {
  const roster = students.slice(0, 2);
  const assessment = {subject: 'QA Mathematics', testDate: '2026-10-13', maximumMarks: '100', students: roster};
  assert.deepEqual(validateAssessment(assessment, {'DEMO-001': '75', 'DEMO-002': '90'}, []), {});
  assert.ok(Object.keys(validateAssessment(assessment, {'DEMO-001': '101', 'DEMO-002': '90'}, [])).length);
  assert.deepEqual(rankAssessmentPreview(roster, {'DEMO-001': '75', 'DEMO-002': '90'}, []).ranked.map(row => row.studentId), ['DEMO-002', 'DEMO-001']);
});
test('Phase 1: personal Settings and centre branding remain separate role contracts', () => {
  assert.deepEqual(settingsSectionsForRole('admin'), ['appearance', 'branding']);
  assert.deepEqual(settingsSectionsForRole('manager'), ['appearance']);
});
test('Phase 1: screenshot policy excludes Settings from approved visual baselines', () => {
  assert.equal(isApprovedBaseline('/settings'), false);
  for (const [, href] of routesFor('admin').filter(([, href]) => href !== '/settings')) assert.equal(isApprovedBaseline(href), true);
});
test('Phase 1: all approved desktop/mobile references exist and retain their hashes', async () => {
  const result = await verifyBaselines();
  assert.equal(result.expected, 56);
  assert.equal(result.checked, result.expected);
  assert.equal(result.settingsVisualApproval, false);
  assert.deepEqual(result.issues, []);
});
test('Phase 1: report aggregation never hides an unrechecked failure or uses stale rechecks', () => {
  const primary = {updatedAt: '2026-10-14T02:00:00Z', baseURL: 'http://localhost:3000', screenshots: [],
    results: [{name: 'directory', status: 'failed'}, {name: 'lens', status: 'failed'}]};
  const recheck = {updatedAt: '2026-10-14T02:01:00Z', baseURL: primary.baseURL, results: [{name: 'directory', status: 'passed'}]};
  assert.deepEqual(consolidateBrowserReports(primary, recheck).summary, {passed: 1, failed: 1});
  assert.deepEqual(consolidateBrowserReports(primary, {...recheck, updatedAt: '2026-10-14T01:00:00Z'}).summary, {passed: 0, failed: 2});
  assert.throws(() => consolidateBrowserReports(primary, {...recheck, results: [{name: 'unknown', status: 'passed'}]}));
});
