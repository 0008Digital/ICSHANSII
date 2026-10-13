// Client-side demo export helper. Never use this for real records or authorization.
export function escapeCsvCell(value) {
 const text=String(value??"");
 // Prefix a quote when spreadsheets would interpret leading formula/control whitespace.
 const safe=/^[\u0000-\u0020\u007f]*[=+\-@]/.test(text)?`'${text}`:text;
 return `"${safe.replaceAll('"','""')}"`;
}

export function buildDemoStudentCsv(rows) {
 const header=["Demo student reference","Permanent Student ID","Registration Number","Batch roll number","Student name","Batch","Student status"];
 const body=rows.map(row=>[row.id??"",row.permanentStudentId??"",row.paperRegistrationNumber??"",row.batchRollNumber??"",row.name,row.batch,row.status]);
 return ["DEMO DATA — fictional preview only; not institutional records",header,...body]
  .map(row=>Array.isArray(row)?row.map(escapeCsvCell).join(","):escapeCsvCell(row)).join("\r\n");
}

export function buildDemoEnrollmentCsv(rows) {
 const header=["Demo student reference","Permanent Student ID","Registration Number","Batch","Student status","Enrollment start","Enrollment end","Enrollment status","Days remaining","Batch roll number"];
 const body=rows.map(row=>[row.student.id,row.student.permanentStudentId??"",row.student.paperRegistrationNumber??"",row.enrollment.batch,row.student.status,row.enrollment.startDate,row.enrollment.endDate,row.snapshot.status,row.snapshot.daysRemaining??"",row.enrollment.rollNumber]);
 return ["DEMO DATA — fictional enrollment previews only; not institutional records",header,...body]
  .map(row=>Array.isArray(row)?row.map(escapeCsvCell).join(","):escapeCsvCell(row)).join("\r\n");
}

export function buildDemoFeeSummaryCsv(rows) {
 const header=["Demo student reference","Permanent Student ID","Registration Number","Batch","Total Fees","Total Paid","Remaining Balance","Promised Payment Date","Fee Status"];
 const body=rows.map(row=>[row.id??"",row.permanentStudentId??"",row.registrationNumber??"",row.batch??"",row.totalFeeMinor==null?"Not connected":formatMinor(row.totalFeeMinor),row.totalPaidMinor==null?"Not connected":formatMinor(row.totalPaidMinor),row.remainingMinor==null?"Not connected":formatMinor(row.remainingMinor),row.promisedPaymentDate??"Not connected",row.status??"Not connected"]);
 return ["DEMO DATA — fee totals are unavailable until authorized fee records are connected",header,...body]
  .map(row=>Array.isArray(row)?row.map(escapeCsvCell).join(","):escapeCsvCell(row)).join("\r\n");
}

export function buildDemoPaymentHistoryCsv(rows) {
 const header=["Permanent Student ID","Enrollment / fee obligation reference","Amount","Payment date","Recorded timestamp","Payment mode","Transaction ID / reference","Receipt number","Recorded-by staff identity","Correction history","Reversal history"];
 const body=rows.map(row=>[row.permanentStudentId??"Not connected",row.enrollmentReference??"Not connected",Number.isSafeInteger(row.amountMinor)?formatMinor(row.amountMinor):"Not connected",row.paymentDate??"",row.recordedAt??"",row.paymentMode??"",row.transactionReference??"",row.receiptNumber??"Not issued",row.recordedBy??"Not connected",row.correctionOf??"",row.reversalOf??""]);
 return ["DEMO DATA — no confirmed payment events are connected; this file contains no payment rows",header,...body]
  .map(row=>Array.isArray(row)?row.map(escapeCsvCell).join(","):escapeCsvCell(row)).join("\r\n");
}

function formatMinor(value){return `₹${Math.floor(value/100)}.${String(value%100).padStart(2,"0")}`;}
