// Fictional examples only. Amounts are stored as signed integer paise, never floating point.
export const demoLedgerEntries = [
 { id:"DEMO-TXN-004", date:"2026-10-12", type:"adjustment", category:"Refund", amountMinor:-250000, method:"UPI", reference:"DEMO-REFUND-04", studentId:"DEMO-002", description:"Example partial refund", recordedBy:"Demo Admin", status:"Reversed", reversalOf:"DEMO-TXN-002" },
 { id:"DEMO-TXN-003", date:"2026-10-11", type:"expense", category:"Utilities", amountMinor:-185000, method:"Bank transfer", reference:"DEMO-EXP-03", studentId:"", description:"Example electricity expense", recordedBy:"Demo Admin", status:"Posted" },
 { id:"DEMO-TXN-002", date:"2026-10-10", type:"income", category:"Course fee payment", amountMinor:1250000, method:"UPI", reference:"DEMO-PAY-02", studentId:"DEMO-002", description:"Example course fee receipt", recordedBy:"Demo Admin", status:"Posted" },
 { id:"DEMO-TXN-001", date:"2026-10-02", type:"expense", category:"Supplies", amountMinor:-42000, method:"Cash", reference:"DEMO-EXP-01", studentId:"", description:"Example classroom supplies", recordedBy:"Demo Admin", status:"Posted" },
 { id:"DEMO-TXN-005", date:"2026-09-30", type:"adjustment", category:"Expense correction", amountMinor:50000, method:"Bank transfer", reference:"DEMO-REV-05", studentId:"", description:"Example reversal of duplicate expense", recordedBy:"Demo Admin", status:"Posted", reversalOf:"DEMO-TXN-006" },
 { id:"DEMO-TXN-006", date:"2026-09-30", type:"expense", category:"Maintenance", amountMinor:-50000, method:"Bank transfer", reference:"DEMO-EXP-06", studentId:"", description:"Example expense later reversed", recordedBy:"Demo Admin", status:"Reversed" },
];
export function ledgerSummary(entries) {
 return entries.reduce((totals, entry) => {
  if (entry.type === "income") totals.incomeMinor += entry.amountMinor;
  else if (entry.type === "expense") totals.expensesMinor += Math.abs(entry.amountMinor);
  else if (entry.type === "adjustment") {
   if (entry.amountMinor >= 0) totals.expensesMinor -= entry.amountMinor;
   else totals.incomeMinor += entry.amountMinor;
  }
  return totals;
 }, { incomeMinor: 0, expensesMinor: 0, netMinor: 0 }).valueOf();
}
export function reconcileLedger(entries) {
 const summary=ledgerSummary(entries);summary.netMinor=summary.incomeMinor-summary.expensesMinor;return summary;
}
export function formatMinor(minor) {
 const sign=minor<0?"−":"";const absolute=Math.abs(minor);return `${sign}₹${Math.floor(absolute/100).toLocaleString("en-IN")}.${String(absolute%100).padStart(2,"0")}`;
}
const escape=(value)=>{const text=String(value??"");const safe=/^[\u0000-\u0020\u007f]*[=+\-@]/.test(text)?`'${text}`:text;return `"${safe.replaceAll('"','""')}"`;};
export function buildDemoLedgerCsv(entries) {
 const header=["Transaction ID","Date","Type","Category","Amount (INR)","Method","Reference","Student demo ID","Description","Recorded by","Status","Reversal of"];
 const lines=entries.map(row=>[row.id,row.date,row.type,row.category,(row.amountMinor/100).toFixed(2),row.method,row.reference,row.studentId,row.description,row.recordedBy,row.status,row.reversalOf??""]);
 return ["DEMO DATA — fictional ledger entries; not institutional transactions",header,...lines].map(row=>Array.isArray(row)?row.map(escape).join(","):escape(row)).join("\r\n");
}
export function buildDemoLedgerSummaryCsv(entries, report) {
 const totals=reconcileLedger(entries);
 let rows=[];
 if(report==="income-statement") rows=[["Net income (INR)",(totals.incomeMinor/100).toFixed(2)],["Total expenses (INR)",(totals.expensesMinor/100).toFixed(2)],["Net cash flow (INR)",(totals.netMinor/100).toFixed(2)]];
 else if(report==="expense-report") rows=[["Total expenses (INR)",(totals.expensesMinor/100).toFixed(2)],["Net cash flow (INR)",(totals.netMinor/100).toFixed(2)]];
 else if(report==="payment-method-summary"){
  const methods=entries.reduce((map,row)=>map.set(row.method,(map.get(row.method)??0)+row.amountMinor),new Map());
  rows=[...methods].map(([method,minor])=>[method,`${(minor/100).toFixed(2)}`]);
 }
 const escape=(value)=>{const text=String(value??""),safe=/^[\u0000-\u0020\u007f]*[=+\-@]/.test(text)?`'${text}`:text;return `"${safe.replaceAll('"','""')}"`;};
 return ["DEMO DATA — fictional financial summary; not institutional records",["Line item","Amount (INR)"],...rows].map(row=>row.map(escape).join(",")).join("\r\n");
}
