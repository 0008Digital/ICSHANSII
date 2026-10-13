import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teacherDashboardSections} from '../src/components/ics/teacher-dashboard-model.mjs';
import {roleFeatures} from '../src/components/ics/workspace-roles.ts';

test('every teacher dashboard anchor has an existing, unique preview target',()=>{
 const targets=teacherDashboardSections.map(section=>section.id);
 assert.equal(new Set(targets).size,targets.length);
 const anchored=roleFeatures('teacher').flatMap(feature=>feature.href?.startsWith('/teacher-dashboard#')?[feature.href.split('#')[1]]:[]);
 assert.ok(anchored.length>0);
 for(const target of anchored)assert.ok(targets.includes(target),`Missing teacher dashboard target: ${target}`);
});
