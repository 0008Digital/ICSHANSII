import { test } from "node:test";
import assert from "node:assert/strict";
import { rankAssessmentPreview, validateAssessment, weeklyLeaderboardAvailability, rankWeeklyPreview } from "../src/components/ics/students/academic-model.mjs";

const roster=[{id:"DEMO-1",name:"A Student"},{id:"DEMO-2",name:"B Student"},{id:"DEMO-3",name:"C Student"}];

test("assessment preview validates date, maximum and explicit marks or absence",()=>{
 const draft={subject:"Maths",testDate:"2026-02-29",maximumMarks:"100",students:roster};
 assert.ok(validateAssessment(draft,{"DEMO-1":"90","DEMO-2":"85"},["DEMO-3"] ).testDate,"non-leap dates are rejected");
 assert.ok(validateAssessment({...draft,testDate:"2028-02-29"},{"DEMO-1":"101","DEMO-2":"85"},["DEMO-3"])["mark:DEMO-1"]);
 assert.deepEqual(validateAssessment({...draft,testDate:"2028-02-29"},{"DEMO-1":"90","DEMO-2":"85"},["DEMO-3"]),{});
});

test("assessment ranking keeps ties, absent and not-marked records separate",()=>{
 const preview=rankAssessmentPreview(roster,{"DEMO-1":"90","DEMO-2":"90"},["DEMO-3"]);
 assert.deepEqual(preview.ranked.map(row=>row.rank),[1,1]);
 assert.equal(preview.absent[0].id,"DEMO-3");
 assert.deepEqual(preview.notMarked,[]);
 assert.equal(rankAssessmentPreview(roster,{"DEMO-1":"90"}).notMarked.length,2);
});

test("weekly leaderboard excludes unpublished and mismatched test sets",()=>{
 assert.equal(weeklyLeaderboardAvailability([]).available,false);
 assert.equal(weeklyLeaderboardAvailability([{id:"T1",status:"draft",results:[]}]).available,false);
 assert.equal(weeklyLeaderboardAvailability([{id:"T1",status:"published",maximumMarks:100,results:[{studentId:"S1",marks:10}]},{id:"T2",status:"published",maximumMarks:50,results:[{studentId:"S1",marks:10},{studentId:"S2",marks:20}]}]).available,false);
 assert.equal(weeklyLeaderboardAvailability([{id:"T1",status:"published",maximumMarks:100,results:[{studentId:"S1",marks:80}]},{id:"T2",status:"published",maximumMarks:50,results:[{studentId:"S1",marks:40}]}]).available,true);
 assert.equal(weeklyLeaderboardAvailability([{id:"T1",status:"published",maximumMarks:100,results:[{studentId:"S1",marks:80}]}],[{id:"S1"},{id:"S2"}]).available,false,"roster members without a result row cannot disappear silently");
 assert.equal(weeklyLeaderboardAvailability([{id:"T1",status:"published",maximumMarks:100,results:[{studentId:"S1",marks:101}]}]).available,false);
});

test("weekly leaderboard normalizes different maxima, shares ties and omits absent students",()=>{
 const tests=[
  {id:"T1",status:"published",maximumMarks:100,results:[{studentId:"S1",name:"A Student",marks:80},{studentId:"S2",name:"B Student",marks:40},{studentId:"S3",name:"C Student",marks:70}]},
  {id:"T2",status:"published",maximumMarks:50,results:[{studentId:"S1",marks:40},{studentId:"S2",marks:20},{studentId:"S3",absent:true}]},
 ];
 const result=rankWeeklyPreview(tests);
 assert.equal(result.available,true);
 assert.deepEqual(result.ranked.map(row=>[row.studentId,row.percentage,row.rank]),[["S1",80,1],["S2",40,2]]);
 const tied=rankWeeklyPreview([{id:"T1",status:"published",maximumMarks:100,results:[{studentId:"S1",marks:80},{studentId:"S2",marks:80}]}]);
 assert.deepEqual(tied.ranked.map(row=>row.rank),[1,1]);
});
