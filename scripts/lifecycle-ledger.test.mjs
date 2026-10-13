import { test } from "node:test";
import assert from "node:assert/strict";
import { addDaysDateOnly, addMonthsDateOnly, enrollmentEndForDuration, enrollmentPeriodsOverlap, enrollmentSnapshot, validateBatchPeriod, validateCustomBatch, validateRenewal } from "../src/components/ics/students/lifecycle.mjs";
import { buildDemoEnrollmentCsv } from "../src/components/ics/export-data.mjs";
import { demoAuditEvents, buildDemoAuditCsv } from "../src/components/ics/audit-data.mjs";
import { demoLedgerEntries, formatMinor, reconcileLedger, buildDemoLedgerCsv } from "../src/components/ics/ledger-data.mjs";
import { exportChoices, roleFeatures } from "../src/components/ics/workspace-roles.ts";
import { students, filterStudents, enrollmentSnapshotFor } from "../src/components/ics/students/model.ts";

test("batch dates reject invalid and reversed ranges without rewriting enrollment history",()=>{
 assert.equal(validateBatchPeriod("2026-02-02","2026-02-01").valid,false);
 assert.equal(validateBatchPeriod("2026-02-01","2026-02-01").valid,true);
 const before=students.map(row=>row.id);
 assert.deepEqual(students.map(row=>row.id),before);
});
test("custom batch preview validates name, dates and optional whole-number capacity",()=>{
 assert.deepEqual(validateCustomBatch({name:"Evening General",startDate:"2026-10-01",endDate:"2027-09-30",capacity:"24"}),{});
 assert.ok(validateCustomBatch({name:"X",startDate:"2026-10-02",endDate:"2026-10-01",capacity:"2.5"}).name);
 assert.ok(validateCustomBatch({name:"Valid batch",startDate:"2026-10-01",endDate:"2027-09-30",capacity:"0"}).capacity);
});

test("expiry uses date-only local calendar arithmetic and the configured warning threshold",()=>{
 assert.equal(enrollmentSnapshot({startDate:"2026-02-28",endDate:"2026-03-31"},"2026-03-01").daysRemaining,30);
 assert.equal(enrollmentSnapshot({startDate:"2026-03-01",endDate:"2026-04-30"},"2026-03-01").status,"Active");
 assert.equal(enrollmentSnapshot({startDate:"2026-01-01",endDate:"2026-02-28"},"2026-03-01").status,"Expired");
 assert.equal(enrollmentSnapshot({startDate:"2028-02-29",endDate:"2028-03-31"},"2028-02-29").status,"Active");
 assert.equal(addMonthsDateOnly("2028-01-31",1),"2028-02-29");
 assert.equal(addMonthsDateOnly("2027-01-31",1),"2027-02-28");
 assert.equal(addDaysDateOnly("2026-12-31",1),"2027-01-01");
 assert.equal(enrollmentEndForDuration("2026-01-01",12),"2026-12-31");
});

test("renewal validation detects overlaps and accepts adjacent date-only periods",()=>{
 const old={startDate:"2026-01-01",endDate:"2026-12-31"};
 assert.ok(enrollmentPeriodsOverlap({startDate:"2026-12-01",endDate:"2027-11-30"},old));
 assert.equal(enrollmentPeriodsOverlap({startDate:"2027-01-01",endDate:"2027-12-31"},old),false);
 assert.ok(validateRenewal({batch:"New General",startDate:"2026-12-01",endDate:"2027-11-30",fee:""},[old],"2026-10-13").overlap);
 assert.deepEqual(validateRenewal({batch:"New General",startDate:"2027-01-01",endDate:"2027-12-31",fee:"1250.50"},[old],"2026-10-13"),{});
 assert.ok(validateRenewal({batch:"New General",startDate:"2027-01-01",endDate:"2027-12-31",fee:"12.345"},[old],"2026-10-13").fee);
 assert.ok(validateRenewal({batch:"Old General",currentBatch:"New General",startDate:"2027-01-01",endDate:"2027-12-31"},[old],"2026-10-13").batch);
 assert.deepEqual(validateRenewal({batch:"Old General",currentBatch:"New General",authorizedBatchChange:true,startDate:"2027-01-01",endDate:"2027-12-31"},[old],"2026-10-13"),{});
});

test("directory enrollment filters support expiring and expired states without changing IDs",()=>{
 assert.ok(filterStudents("","","","Expiring Soon","2026-10-13").length>=1);
 assert.ok(filterStudents("","","","Expired","2026-10-13").length>=1);
 assert.equal(enrollmentSnapshotFor("DEMO-004","2026-10-13").status,"Expired");
 assert.ok(students.every(row=>row.id.startsWith("DEMO-")));
});

test("ledger uses integer paise, excludes unpaid invoices, and reconciles reversals/refunds",()=>{
 const summary=reconcileLedger(demoLedgerEntries);
 assert.ok(demoLedgerEntries.every(entry=>Number.isInteger(entry.amountMinor)));
 assert.equal(summary.incomeMinor,1000000);
 assert.equal(summary.expensesMinor,227000);
 assert.equal(summary.netMinor,773000);
 assert.equal(formatMinor(12345),"₹123.45");
 assert.equal(formatMinor(-125),"−₹1.25");
 assert.ok(!demoLedgerEntries.some(entry=>entry.status==="Unpaid"));
 assert.match(buildDemoLedgerCsv(demoLedgerEntries),/^"DEMO DATA/);
});

test("audit demo rows are chronological, privacy-minimized and safely exported",()=>{
 const ordered=[...demoAuditEvents].sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
 assert.deepEqual(demoAuditEvents.map(event=>event.timestamp),ordered.map(event=>event.timestamp));
 assert.ok(demoAuditEvents.every(event=>!/(password|token|secret|9876\d{6})/i.test(JSON.stringify(event))));
 assert.match(buildDemoAuditCsv(demoAuditEvents),/^"DEMO DATA/);
});

test("new routes and exports honor current presentation boundaries",()=>{
 assert.ok(roleFeatures("admin").some(item=>item.href==="/ledger"));
 assert.ok(roleFeatures("admin").some(item=>item.href==="/audit-logs"));
 assert.ok(!roleFeatures("manager").some(item=>["/ledger","/audit-logs"].includes(item.href)));
 for(const role of ["teacher","student","platform-owner"])assert.ok(!roleFeatures(role).some(item=>["/ledger","/audit-logs"].includes(item.href)));
 const admin=exportChoices("admin");
 assert.ok(admin.find(item=>item.id==="ledger-transactions")?.enabled);
 assert.ok(admin.find(item=>item.id==="student-fee-collections")?.enabled===false);
 assert.ok(exportChoices("teacher").every(item=>!item.enabled));
 assert.ok(exportChoices("student").length===0);
});

test("enrollment export includes no official IDs or personal phone details",()=>{
 const csv=buildDemoEnrollmentCsv([{student:{id:"DEMO-001",status:"Active"},enrollment:{batch:"New General",startDate:"2026-01-01",endDate:"2026-12-31",rollNumber:"Not issued"},snapshot:{status:"Active",daysRemaining:79}}]);
 assert.match(csv,/DEMO DATA/);
 assert.doesNotMatch(csv,/phone|guardian|IH260001|H06\/26/);
});
