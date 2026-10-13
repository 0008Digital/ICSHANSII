import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDemoFeeSummaryCsv, buildDemoPaymentHistoryCsv } from "../src/components/ics/export-data.mjs";

test("fee summary export includes fee totals and honest unavailable values",()=>{
 const csv=buildDemoFeeSummaryCsv([{id:"DEMO-001",permanentStudentId:"",registrationNumber:"H06/26 09",batch:"New General",totalFeeMinor:null,totalPaidMinor:null,remainingMinor:null,promisedPaymentDate:null,status:"Not connected"}]);
 for(const column of ["Total Fees","Total Paid","Remaining Balance","Promised Payment Date","Fee Status"])assert.ok(csv.includes(column));
 assert.ok(csv.includes("Not connected"));
 assert.ok(csv.includes("DEMO DATA"));
});

test("payment history export has one row per supplied event and preserves audit reference fields",()=>{
 const csv=buildDemoPaymentHistoryCsv([{permanentStudentId:"IH260001",enrollmentReference:"ENR-1",amountMinor:125050,paymentDate:"2026-11-15",recordedAt:"2026-11-15T10:00:00Z",paymentMode:"UPI",transactionReference:"TX-1",receiptNumber:"R-1",recordedBy:"Manager Example",correctionOf:"",reversalOf:""}]);
 for(const column of ["Enrollment / fee obligation reference","Payment date","Recorded timestamp","Payment mode","Transaction ID / reference","Receipt number","Recorded-by staff identity","Correction history","Reversal history"])assert.ok(csv.includes(column));
 assert.ok(csv.includes("₹1250.50"));
 assert.ok(csv.includes("IH260001"));
 assert.ok(csv.includes("Manager Example"));
 assert.equal(csv.split("\r\n").length,3);
});

test("empty transaction export is explicit and contains no fabricated payment row",()=>{
 const csv=buildDemoPaymentHistoryCsv([]);
 assert.ok(csv.includes("no confirmed payment events are connected"));
 assert.equal(csv.split("\r\n").length,2);
});
