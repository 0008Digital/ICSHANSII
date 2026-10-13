import {test} from "node:test";
import assert from "node:assert/strict";
import {percent,studentPreview,studentProgress,percentageSegments,studentChartSegments,severityCounts,dashboardPreview,chartFraction} from "../src/components/ics/analytics-model.mjs";

test("student preview calculations keep fee and attendance totals consistent",()=>{
 const result=studentProgress();
 assert.equal(result.paidPercent,70);assert.equal(result.remainingMinor,300000);
 assert.equal(result.attendanceTotal,50);assert.equal(result.attendancePercent,84);assert.equal(result.homeworkPercent,80);
 assert.equal(studentPreview.fees.totalMinor,studentPreview.fees.paidMinor+result.remainingMinor);
});
test("missing and zero totals return unavailable percentages",()=>{assert.equal(percent(0,0),null);assert.equal(percent(NaN,4),null);assert.equal(percent(5,2),100);});
test("chart fill fractions cannot overflow tracks or invent positive zero-value bars",()=>{
 assert.equal(chartFraction(0,20),0);
 assert.equal(chartFraction(5,20),.25);
 assert.equal(chartFraction(25,20),1);
 assert.equal(chartFraction(-5,20),0);
 assert.equal(chartFraction(NaN,20),0);
 assert.equal(chartFraction(5,0),0);
 assert.equal(chartFraction(5,Infinity),0);
 assert.equal(chartFraction(80),.8);
});
test("student status charts keep semantic categories, labels and correct proportions",()=>{
 assert.deepEqual(percentageSegments(studentChartSegments.fees).map(item=>[item.label,item.percent,item.offset]),[["Paid",70,0],["Pending",30,70]]);
 assert.deepEqual(percentageSegments(studentChartSegments.attendance).map(item=>[item.label,item.percent,item.offset]),[["Present",84,0],["Absent",10,84],["Leave",6,94]]);
});
test("operational chart series remain explicitly fictional and semantically colored",()=>{
 assert.deepEqual(dashboardPreview.admin.financial.map(row=>[row.income>0,row.expenses>0,row.outstanding>0]),[[true,true,true],[true,true,true],[true,true,true]]);
 assert.deepEqual(severityCounts([{severity:"Critical"},{severity:"Low"}]).map(row=>[row.label,row.value,row.tone]),[["Critical",1,"critical"],["High",0,"high"],["Medium",0,"medium"],["Low",1,"low"]]);
});
