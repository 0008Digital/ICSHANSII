import {test} from "node:test";
import assert from "node:assert/strict";
import {isCurrentNavigationHref,mobileNavigationLabel} from "../src/components/ics/navigation-current.mjs";

test("dashboard section navigation marks only one teacher, owner or student destination active",()=>{
 for(const path of ["/teacher-dashboard","/developer","/student-portal"]) {
  const hrefs=[path,`${path}#first`,`${path}#second`,"/settings"];
  for(const hash of ["","#first","#second"]) {
   const active=hrefs.filter(href=>isCurrentNavigationHref(href,path,hash,hrefs));
   assert.deepEqual(active,[`${path}${hash}`]);
  }
 }
});

test("management routes retain nested-profile active states without matching route prefixes",()=>{
 const hrefs=["/","/students","/students/new","/batches"];
 assert.equal(isCurrentNavigationHref("/students","/students/demo-example","",hrefs),true);
 assert.equal(isCurrentNavigationHref("/","/students","",hrefs),false);
 assert.equal(isCurrentNavigationHref("/students","/students-other","",hrefs),false);
 assert.equal(isCurrentNavigationHref("/students","/students","#results",hrefs),true);
});

test("compact role docks preserve full accessible module titles",()=>{
 const entries=[
  ["teacher-dashboard","Teacher Dashboard","Dashboard"],
  ["assigned-students","Assigned Students","Students"],
  ["attendance","Rapid Attendance","Attendance"],
  ["homework","Homework","Homework"],
  ["developer-console","Developer Console","Console"],
  ["bug-reports","Bug Reports","Reports"],
  ["application-errors","Application Errors","Errors"],
  ["system-health","System Health","Health"],
  ["student-home","Home","Home"],
  ["student-batch","Classes / Batch","Batch"],
  ["student-attendance","Attendance","Attendance"],
  ["student-results","Results","Results"],
  ["students","Students","Students"],
 ];
 for(const [id,title,label] of entries)assert.deepEqual(mobileNavigationLabel({id,label:title}),{label,accessibleLabel:title});
});
