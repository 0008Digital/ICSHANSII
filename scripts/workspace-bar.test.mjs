import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exportChoices,workspaceCommands} from '../src/components/ics/workspace-roles.ts';
import {buildDemoStudentCsv,escapeCsvCell} from '../src/components/ics/export-data.mjs';
import {students} from '../src/components/ics/students/model.ts';
import {activeSettingsSection,settingsSectionFromHash,settingsSectionsForRole} from '../src/components/ics/settings-navigation.mjs';

test('workspace command registry exposes only real role-accessible routes and workflows',()=>{
 const admin=workspaceCommands('admin');
 assert.ok(admin.some(item=>item.href==='/students/new'&&item.kind==='action'));
 assert.ok(admin.every(item=>item.href==='/'||item.href.startsWith('/')));
 const teacher=workspaceCommands('teacher');assert.ok(teacher.some(item=>item.href==='/teacher-dashboard'));assert.ok(teacher.some(item=>item.href==='/attendance'));assert.ok(teacher.every(item=>!['/fees','/ledger','/staff'].includes(item.href)));
 const owner=workspaceCommands('platform-owner');assert.ok(owner.some(item=>item.href==='/developer'));assert.ok(owner.every(item=>!item.href.startsWith('/students')&&!item.href.startsWith('/fees')));
 assert.deepEqual(workspaceCommands('student').map(item=>item.href),['/student-portal','/student-portal#batch','/student-portal#attendance','/student-portal#results','/student-portal#fees','/student-portal#profile','/student-portal#homework','/student-portal#updates','/chatrooms','/settings']);
});

test('workspace route titles keep Add Student and Student Home distinct from student profiles',()=>{
 const source=readFileSync(new URL('../src/components/ics/shell.tsx',import.meta.url),'utf8');
 assert.match(source,/pathname!=="\/students\/new"/);
 assert.match(source,/"\/students\/new":"Add Student"/);
 assert.match(source,/"\/student-portal":"Student Home"/);
});

test('export choices avoid student administration for Student and centre exports for Platform Owner',()=>{
 assert.deepEqual(exportChoices('student'),[]);assert.deepEqual(exportChoices('platform-owner'),[]);
 const teacher=exportChoices('teacher');
 assert.deepEqual(teacher.map(choice=>choice.id),['assigned-students','attendance','results','homework']);
 assert.ok(teacher.every(choice=>!choice.enabled&&!choice.id.includes('fee')&&!choice.id.includes('staff')));
});

test('admin demo exports are labeled and Manager permissions remain grant-dependent',()=>{
 const choices=exportChoices('admin');
 assert.deepEqual(choices.filter(choice=>choice.enabled).map(choice=>choice.id),['student-directory','batch-lists','enrollment-expiry','audit-log','ledger-transactions','income-statement','expense-report','payment-method-summary']);
 assert.ok(choices.filter(choice=>choice.id.includes('fee')||choice.id==='renewal-collections').every(choice=>!choice.enabled));
 const csv=buildDemoStudentCsv(students);
 assert.match(csv,/^"DEMO DATA — fictional preview only; not institutional records"/);
 assert.match(csv,/"Demo student reference","Permanent Student ID","Registration Number","Batch roll number","Student name","Batch","Student status"/);
 assert.doesNotMatch(csv,/00000|Example Lane|guardian/i);
 assert.ok(exportChoices('manager').find(choice=>choice.id==='fees')?.enabled===false);
});

test('CSV safely quotes delimiters and neutralizes spreadsheet formulas',()=>{
 assert.equal(escapeCsvCell('A,"B"'), '"A,""B"""');
 for(const value of ['=1+1',' +SUM(A1:A2)','\t@HYPERLINK("x")','-cmd','+1'])assert.match(escapeCsvCell(value),/^"'/);
 assert.equal(escapeCsvCell('Safe name'),'"Safe name"');
 assert.equal(buildDemoStudentCsv([]).split('\r\n').length,2);
});

test('Settings tabs parse direct hashes and manual scroll chooses the visible section',()=>{
 assert.equal(settingsSectionFromHash('#branding-title'),'branding');
 assert.equal(settingsSectionFromHash('#unknown'),'appearance');
 assert.deepEqual(settingsSectionsForRole('admin'),['appearance','branding']);
 for(const role of ['platform-owner','manager','teacher','student'])assert.deepEqual(settingsSectionsForRole(role),['appearance']);
 assert.equal(activeSettingsSection([{id:'appearance-title',top:-40},{id:'branding-title',top:120}],100),'appearance');
 assert.equal(activeSettingsSection([{id:'appearance-title',top:-160},{id:'branding-title',top:80}],100),'branding');
 assert.equal(activeSettingsSection([{id:'appearance-title',top:-120},{id:'branding-title',top:244}],155,720,true),'branding');
});

test('Settings sticky offsets measure the full-width global navbar',()=>{
 const source=readFileSync(new URL('../src/components/ics/settings-heading.tsx',import.meta.url),'utf8');
 assert.match(source,/querySelector\("\.global-workspace-header"\)/);
 assert.doesNotMatch(source,/querySelector\("\.workspace > header"\)/);
});
