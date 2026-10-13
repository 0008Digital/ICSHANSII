import { test } from "node:test";
import assert from "node:assert/strict";
import { filterStudents, validateAdmission, validateDetails, students, batches, defaultBatches, normalizeMobile, parseMoneyMinor, formatMoneyMinor, studentOverview, studentContactLabel, groupStudentsByBatch, admissionPaymentFieldState } from "../src/components/ics/students/model.ts";
import { localToday } from "../src/components/ics/date-only.mjs";
import { renewalDueDateForDuration,enrollmentEndForDuration } from "../src/components/ics/students/lifecycle.mjs";
const valid = { name:"Fictional Student",fatherName:"Fictional Father",motherName:"Fictional Mother",guardianPhone:"9876543210",studentPhone:"", address:"Example only", batch:batches[0], admissionDate:localToday(),paperRegistrationNumber:"H06/26 09",batchDuration:"3",totalFees:"1000.00",amountPaid:"0" };
test("directory searches name, ID and normalized phone",()=>{
 assert.equal(filterStudents("diYA", "", "")[0].id,"DEMO-002");
 assert.equal(filterStudents("demo-003", "", "")[0].name,"Kabir Example");
 assert.equal(filterStudents("0000000004", "", "")[0].id,"DEMO-004");
 assert.equal(filterStudents("  ", "", "").length,students.length);
 assert.equal(filterStudents("missing", "", "").length,0);
});
test("batch and status compose with search",()=>{
 assert.equal(filterStudents("", "New General", "Active").length,1);
 assert.equal(filterStudents("", "New General", "Inactive").length,0);
 assert.equal(filterStudents("Riya", batches[4], "Active").length,1);
 assert.equal(defaultBatches.length,4);
});
test("By Batch grouping keeps each demo student exactly once and labels custom or unassigned groups",()=>{
 const rows=[...students,{...students[0],id:"DEMO-UNASSIGNED",batch:""}];
 const groups=groupStudentsByBatch(rows);
 assert.equal(groups.reduce((total,group)=>total+group.rows.length,0),rows.length);
 assert.equal(new Set(groups.flatMap(group=>group.rows.map(student=>student.id))).size,rows.length);
 assert.ok(groups.some(group=>group.kind==="official"&&group.label==="New General"));
 assert.ok(groups.some(group=>group.kind==="custom-demo"&&group.label.includes("custom demo")));
 assert.ok(groups.some(group=>group.kind==="unassigned-legacy"&&group.label==="Unassigned / legacy demo"));
});
test("student overview derives consistent demo counts from directory and enrollment fixtures",()=>{
 assert.deepEqual(studentOverview("2026-10-13"),{activeStudents:3,inactiveStudents:1,totalEnrollments:5,feeDueCases:null,expiringSoon:2,expiredEnrollments:1,activeBatches:4});
 assert.equal(studentOverview("2026-10-13").feeDueCases,null,"fee status is unavailable rather than guessed");
});
test("overview metric filters return their matching students and expired enrollment stays visible as a filter",()=>{
 const today="2026-10-13";
 assert.deepEqual(filterStudents("","","Active","",today).map(student=>student.id),["DEMO-001","DEMO-002","DEMO-005"]);
 assert.deepEqual(filterStudents("","","Inactive","",today).map(student=>student.id),["DEMO-004"]);
 assert.deepEqual(filterStudents("","","","Expired",today).map(student=>student.id),["DEMO-004"]);
 assert.deepEqual(filterStudents("","","","Expiring Soon",today).map(student=>student.id),["DEMO-002","DEMO-003"]);
});
test("admission accepts default and approved demo custom batches",()=>{
 for (const batch of batches) assert.deepEqual(validateAdmission({...valid,batch}),{});
});
test("admission requires valid personal details and an allowlisted batch",()=>{
 assert.deepEqual(Object.keys(validateAdmission({...valid,name:"",fatherName:"",motherName:"",guardianPhone:"",address:"",batch:"",paperRegistrationNumber:"",batchDuration:"",totalFees:"",amountPaid:""})).sort(),["amountPaid","batch","batchDuration","fatherName","guardianPhone","motherName","name","paperRegistrationNumber","totalFees"]);
 assert.ok(validateAdmission({...valid,batch:"Unapproved"}).batch);
 for(const phone of ["123","abcdefghij","0000000000000000","123-45<script>"]) assert.ok(validateAdmission({...valid,guardianPhone:phone}).guardianPhone);
 assert.ok(validateAdmission({...valid,name:"a"}).name);
 assert.ok(validateAdmission({...valid,address:"x".repeat(301)}).address);
});
test("details edit validation does not authorize enrollment or create IDs",()=>{
 assert.deepEqual(validateDetails(valid),{});
 assert.ok(validateDetails({...valid,fatherName:" "}).fatherName);
 assert.equal("studentId" in valid,false);
 assert.equal("registrationNumber" in valid,false);
 assert.ok(students.every(s=>s.id.startsWith("DEMO-")));
});

test("guardian phone is mandatory; student phone never substitutes",()=>{
 assert.deepEqual(validateDetails(valid),{});
 assert.deepEqual(validateDetails({...valid,studentPhone:"8765432109"}),{});
 assert.ok(validateDetails({...valid,guardianPhone:"",studentPhone:"9876543210"}).guardianPhone);
 for(const guardianPhone of ["5123456789","987654321","98765432100","+919876543210","98765 43210","abcdefghi0"])assert.ok(validateDetails({...valid,guardianPhone}).guardianPhone);
 assert.ok(validateDetails({...valid,studentPhone:"123"}).studentPhone);
});
test("missing fixture contacts stay missing; legacy values remain explicitly unclassified",()=>{
 assert.ok(students.every(student=>student.guardianPhone===""&&student.studentPhone===""&&student.legacyContactPhone));
 assert.ok(students.every(student=>studentContactLabel(student)==="Unclassified legacy contact"));
 assert.equal(normalizeMobile("+91 (98765) 43210"),"+919876543210");
});

test("admission fee preview uses decimal-safe minor units and rejects overpayment or malformed values",()=>{
 assert.deepEqual(admissionPaymentFieldState("0"),{visible:true,disabled:true,referenceRequired:false});
 assert.deepEqual(admissionPaymentFieldState("10.00"),{visible:true,disabled:false,referenceRequired:true});
 assert.equal(parseMoneyMinor("1250.50"),125050);
 assert.equal(formatMoneyMinor(125050),"₹1,250.50");
 assert.equal(parseMoneyMinor("12.345"),null);
 assert.ok(validateAdmission({...valid,totalFees:"100.00",amountPaid:"100.01"}).amountPaid);
 assert.deepEqual(validateAdmission({...valid,totalFees:"100.00",amountPaid:"99.99",paymentMethod:"Cash",paymentDate:localToday()}),{});
 assert.ok(validateAdmission({...valid,totalFees:"-1",amountPaid:"0"}).totalFees);
 assert.ok(validateAdmission({...valid,totalFees:"100",amountPaid:"10",paymentMethod:"UPI",paymentReference:"",paymentDate:localToday()}).paymentReference);
 assert.deepEqual(validateAdmission({...valid,totalFees:"100",amountPaid:"10",paymentMethod:"Cash",paymentReference:"",paymentDate:localToday()}),{});
 assert.ok(validateAdmission({...valid,totalFees:"100",amountPaid:"50",paymentMethod:"Cash",paymentDate:localToday(),promiseDateRequested:true,promisedPaymentDate:""}).promisedPaymentDate);
 assert.ok(validateAdmission({...valid,totalFees:"100",amountPaid:"50",paymentMethod:"Cash",paymentDate:localToday(),promiseDateRequested:true,promisedPaymentDate:"2026-10-12"}).promisedPaymentDate);
});

test("admission requires a manually entered registration number and duration",()=>{
 assert.deepEqual(validateAdmission(valid),{});
 assert.ok(validateAdmission({...valid,paperRegistrationNumber:" "}).paperRegistrationNumber);
 assert.ok(validateAdmission({...valid,batchDuration:"custom",customDurationMonths:"0"}).customDurationMonths);
 assert.deepEqual(validateAdmission({...valid,batchDuration:"custom",customDurationMonths:"18"}),{});
});

test("renewal due date uses calendar-month arithmetic and inclusive period end",()=>{
 assert.equal(renewalDueDateForDuration("2026-11-01",3),"2027-02-01");
 assert.equal(enrollmentEndForDuration("2026-11-01",3),"2027-01-31");
 assert.equal(renewalDueDateForDuration("2024-01-31",1),"2024-02-29");
 assert.equal(enrollmentEndForDuration("2024-01-31",1),"2024-02-28");
 assert.equal(renewalDueDateForDuration("2026-01-31",1),"2026-02-28");
});
