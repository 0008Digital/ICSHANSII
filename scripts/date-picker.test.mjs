import {test} from "node:test";
import assert from "node:assert/strict";
import {parseDateOnly,addDays,addMonths,allowedDate,displayDate,utcDate,monthGrid} from "../src/components/ics/date-only.mjs";
import {validateAdmission,validateDetails} from "../src/components/ics/students/model.ts";
import {localToday} from "../src/components/ics/date-only.mjs";
test("Gregorian leap years and invalid date input",()=>{
 for(const date of ['2024-02-29','2000-02-29','1900-02-28'])assert.ok(parseDateOnly(date));
 for(const date of ['2023-02-29','1900-02-29','2024-04-31','2024-13-01','2024-00-01','2024-01-00','2024-1-2','2024-01-01T00:00:00Z',''])assert.equal(parseDateOnly(date),null);
});
test("date-only day/month and fast-year navigation",()=>{
 assert.equal(addDays('2024-02-28',1),'2024-02-29');assert.equal(addDays('2024-02-29',1),'2024-03-01');
 assert.equal(addDays('2024-01-01',-1),'2023-12-31');
 assert.equal(addMonths('2024-01-31',1),'2024-02-29');assert.equal(addMonths('2024-02-29',12),'2025-02-28');assert.equal(addMonths('2024-03-31',-1),'2024-02-29');assert.equal(addMonths('2024-03-01',-120),'2014-03-01');
});
test("inclusive min/max restrictions",()=>{
 const min='2024-02-10',max='2024-03-05';for(const date of [min,max,'2024-02-29'])assert.equal(allowedDate(date,min,max),true);
 for(const date of ['2024-02-09','2024-03-06','invalid'])assert.equal(allowedDate(date,min,max),false);
});
test("display and storage do not shift date-only values across timezones",()=>{
 const previous=process.env.TZ;
 for(const tz of ['UTC','Asia/Kolkata','America/Los_Angeles','Pacific/Kiritimati']){process.env.TZ=tz;assert.equal(displayDate('2008-02-29'),'29 February 2008');assert.equal(addDays('2008-02-29',1),'2008-03-01');assert.equal(utcDate('2008-02-29').getUTCDate(),29);}
 if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous;
});
test("optional DOB clearing and required preview admission date validation",()=>{
 const valid={name:'Fictional Example',fatherName:'Fictional Father',motherName:'Fictional Mother',guardianPhone:'9876543210',studentPhone:'',address:'',batch:'New General',paperRegistrationNumber:'H06/26 09',batchDuration:'3',totalFees:'1000.00',amountPaid:'0'};
 assert.ok(validateAdmission({...valid,birthDate:'',admissionDate:''}).admissionDate);
 assert.deepEqual(validateAdmission({...valid,birthDate:'',admissionDate:localToday()}),{});
 assert.ok(validateDetails({...valid,birthDate:'2023-02-29'}).birthDate);
 assert.ok(validateAdmission({...valid,birthDate:'2008-02-29',admissionDate:'2007-01-01'}).admissionDate);
 assert.ok(validateAdmission({...valid,admissionDate:'9999-01-01'}).admissionDate);
});

test("calendar grids remain valid at the first and last supported Gregorian years",()=>{
 assert.equal(monthGrid('0001-01-01').length,42);assert.equal(monthGrid('9999-12-31').length,42);
 assert.ok(monthGrid('0001-01-01').some(date=>date===null));assert.ok(monthGrid('9999-12-31').some(date=>date===null));
 assert.ok(monthGrid('2024-02-01').includes('2024-02-29'));
});
