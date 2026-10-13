import {test} from 'node:test';
import assert from 'node:assert/strict';
import {roleFeatures,dashboardSummaries,roleLabels} from '../src/components/ics/workspace-roles.ts';

test('five role plans have unique feature IDs and honest dashboard summaries',()=>{
 assert.deepEqual(Object.keys(roleLabels).sort(),['admin','manager','platform-owner','student','teacher']);
 for(const role of Object.keys(roleLabels)){const items=roleFeatures(role);assert.equal(new Set(items.map(i=>i.id)).size,items.length);assert.equal(dashboardSummaries[role].length,4);assert.ok(items.every(i=>i.scope));}
});
test('admin keeps centre routes; manager has no unrestricted ledger or audit destination',()=>{
 assert.deepEqual(roleFeatures('manager').map(i=>i.href),['/','/students','/batches','/attendance','/tests-results','/homework','/fees','/staff','/ics-updates','/chatrooms','/settings']);
 assert.deepEqual(roleFeatures('admin').map(i=>i.href),['/','/students','/batches','/attendance','/tests-results','/homework','/fees','/ledger','/staff','/audit-logs','/ics-updates','/chatrooms','/settings']);
 assert.match(roleFeatures('manager').find(i=>i.id==='staff').scope,/explicit staff grant/);
 assert.ok(!roleFeatures('manager').some(i=>['ledger','audit-logs'].includes(i.id)));
});
test('platform owner has technical and centre-metadata routes, never private centre-record routes',()=>{
 const items=roleFeatures('platform-owner');assert.ok(items.some(i=>i.href==='/developer'));
 for(const href of ['/students','/fees','/attendance','/ledger','/audit-logs'])assert.ok(!items.some(i=>i.href===href));
 assert.ok(items.some(i=>i.id==='centres'));assert.ok(items.some(i=>i.href==='/developer#centres'));
});
test('teacher and student routes stay within teaching or personal preview workspaces',()=>{
 const teacher=roleFeatures('teacher');assert.ok(teacher.some(i=>i.href==='/teacher-dashboard'));assert.ok(teacher.some(i=>i.href==='/attendance'));assert.ok(!teacher.some(i=>['fees','ledger','audit-logs','staff'].includes(i.id)));
 const student=roleFeatures('student');assert.ok(student.some(i=>i.href==='/student-portal'));assert.ok(student.some(i=>i.href==='/student-portal#fees'));assert.ok(!student.some(i=>['students','staff','assigned-students','ledger','audit-logs'].includes(i.id)));assert.ok(student.every(i=>i.href==='/settings'||i.href==='/chatrooms'||i.href?.startsWith('/student-portal')));
});
