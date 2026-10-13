import { test } from "node:test";
import assert from "node:assert/strict";
import { daysOverdue, feeStatus, paymentHistoryRow, remainingFeeMinor, summarizeFees, validatePaymentPreview } from "../src/components/ics/students/fee-model.mjs";

test("fee status is independent of enrollment expiry and changes only after promised date",()=>{
 assert.equal(feeStatus(15000,"2026-11-15","2026-11-15"),"Pending");
 assert.equal(feeStatus(15000,"2026-11-15","2026-11-16"),"Expired Fees");
 assert.equal(feeStatus(0,"2026-11-15","2026-11-16"),"Paid");
 assert.equal(daysOverdue("2026-11-15","2026-11-15"),0);
 assert.equal(daysOverdue("2026-11-15","2026-11-18"),3);
});

test("integer-paise fee summaries reject negative and overpaid balances",()=>{
 assert.equal(remainingFeeMinor(10000,2500),7500);
 assert.equal(remainingFeeMinor(10000,10001),null);
 assert.deepEqual(summarizeFees(10000,[{amountMinor:1250},{amountMinor:2500}]),{totalFeeMinor:10000,totalPaidMinor:3750,remainingMinor:6250});
 assert.equal(summarizeFees(-1,[]).remainingMinor,null);
});

test("payment preview requires mode/reference as appropriate and cannot exceed balance",()=>{
 const valid={amountMinor:2500,balanceMinor:10000,paymentDate:"2026-11-15",paymentMode:"Cash",reference:"",promisedPaymentDate:"2026-11-20",today:"2026-11-15"};
 assert.deepEqual(validatePaymentPreview(valid),{});
 assert.ok(validatePaymentPreview({...valid,paymentMode:"UPI"}).reference);
 assert.ok(validatePaymentPreview({...valid,amountMinor:10001}).amount);
 assert.ok(validatePaymentPreview({...valid,paymentDate:"2026-11-16"}).paymentDate);
 assert.ok(validatePaymentPreview({...valid,promisedPaymentDate:"2026-11-14"}).promisedPaymentDate);
});

test("payment event projection retains immutable reference fields for future backend exports",()=>{
 assert.deepEqual(paymentHistoryRow({permanentStudentId:"IH260001",enrollmentReference:"ENR-01",amountMinor:5000,paymentDate:"2026-11-15",recordedAt:"2026-11-15T10:00:00Z",paymentMode:"UPI",transactionReference:"TX-01",receiptNumber:"RCPT-01",recordedBy:"staff-1",correctionOf:"",reversalOf:""}),{
  permanentStudentId:"IH260001",enrollmentReference:"ENR-01",amountMinor:5000,paymentDate:"2026-11-15",recordedAt:"2026-11-15T10:00:00Z",paymentMode:"UPI",transactionReference:"TX-01",receiptNumber:"RCPT-01",recordedBy:"staff-1",correctionOf:"",reversalOf:""
 });
});
