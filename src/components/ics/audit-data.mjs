// Fictional examples for the disconnected preview. Never represents actual actors or activity.
export const demoAuditEvents = [
 { id:"DEMO-AUD-006", timestamp:"2026-10-13T09:25:00+05:30", actor:"Demo Centre Admin", role:"Centre Admin", module:"Exports", action:"CSV preview exported", target:"Fictional directory", targetType:"report", targetId:"DEMO-REPORT-001", outcome:"Success", reason:"Example event only", beforeAfter:"No institutional records were accessed." },
 { id:"DEMO-AUD-005", timestamp:"2026-10-12T16:10:00+05:30", actor:"Demo Manager", role:"Manager", module:"Enrollment", action:"Renewal preview opened", target:"DEMO-003", targetType:"student preview", targetId:"DEMO-003", outcome:"Success", reason:"Preview only", beforeAfter:"No enrollment was changed." },
 { id:"DEMO-AUD-004", timestamp:"2026-10-11T13:40:00+05:30", actor:"Demo Centre Admin", role:"Centre Admin", module:"Batches", action:"Date validation checked", target:"New Guarantee (demo)", targetType:"batch preview", targetId:"DEMO-BATCH-003", outcome:"Success", reason:"Preview only", beforeAfter:"No batch dates were saved." },
 { id:"DEMO-AUD-003", timestamp:"2026-10-10T12:30:00+05:30", actor:"Demo Centre Admin", role:"Centre Admin", module:"Fees", action:"Unconfirmed payment note previewed", target:"Fictional admission", targetType:"admission preview", targetId:"DEMO-ADMISSION-001", outcome:"Success", reason:"No confirmation", beforeAfter:"No payment or receipt was created." },
 { id:"DEMO-AUD-002", timestamp:"2026-10-09T10:15:00+05:30", actor:"Demo Teacher", role:"Teacher", module:"Attendance", action:"Unavailable action blocked", target:"Assigned batch scope", targetType:"authorization check", targetId:"DEMO-CHECK-002", outcome:"Failure", reason:"No assignment verification in demo", beforeAfter:"No attendance data was changed." },
 { id:"DEMO-AUD-001", timestamp:"2026-10-08T08:00:00+05:30", actor:"Demo Centre Admin", role:"Centre Admin", module:"Settings", action:"Appearance preview opened", target:"Local device settings", targetType:"local setting", targetId:"DEMO-SETTING-001", outcome:"Success", reason:"Device-local demo", beforeAfter:"No centre records were changed." },
];
const escape=(value)=>{const text=String(value??"");const safe=/^[\u0000-\u0020\u007f]*[=+\-@]/.test(text)?`'${text}`:text;return `"${safe.replaceAll('"','""')}"`;};
export function buildDemoAuditCsv(events) {
 const header=["Demo event ID","Timestamp","Actor","Role","Module","Action","Target type","Target ID","Target","Outcome","Reason","Change summary"];
 const lines=events.map(row=>[row.id,row.timestamp,row.actor,row.role,row.module,row.action,row.targetType,row.targetId,row.target,row.outcome,row.reason,row.beforeAfter]);
 return ["DEMO DATA — fictional audit examples; not actual user activity",header,...lines].map(row=>Array.isArray(row)?row.map(escape).join(","):escape(row)).join("\r\n");
}
