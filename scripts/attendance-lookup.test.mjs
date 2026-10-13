import {test} from "node:test";
import assert from "node:assert/strict";
import {lookupAttendanceRoster} from "../src/components/ics/attendance-model.mjs";
import {students} from "../src/components/ics/students/model.ts";
test("rapid attendance searches fictional batch roll and student name without cross-batch results",()=>{
 const roster=students.filter(student=>student.batch==="New General");
 assert.deepEqual(lookupAttendanceRoster(roster,"101").matches.map(item=>item.id),["DEMO-001"]);
 assert.deepEqual(lookupAttendanceRoster(roster,"aarav").matches.map(item=>item.id),["DEMO-001"]);
 assert.equal(lookupAttendanceRoster(roster,"201").matches.length,0);
 assert.equal(lookupAttendanceRoster(roster," ").kind,"empty");
});
test("duplicate roll matches are surfaced for safe review",()=>{
 const result=lookupAttendanceRoster([{name:"One",id:"1",batchRollNumber:"7"},{name:"Two",id:"2",batchRollNumber:"7"}],"7");
 assert.equal(result.duplicate,true);assert.equal(result.matches.length,2);
});
