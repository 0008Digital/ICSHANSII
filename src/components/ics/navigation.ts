import {roleFeatures} from "./workspace-roles";
const descriptions:Record<string,string>={
 "/": "An overview of your centre.",
 "/students": "One place for student records and enrollment.",
 "/batches": "Batch structure, membership and teacher assignments.",
 "/fees": "Receipts, balances and approved financial operations.",
 "/ledger": "Chronological transaction history and reconciliation.",
 "/attendance": "Batch attendance and audited corrections.",
 "/staff": "Centre staff, roles and assignment oversight.",
 "/audit-logs": "Append-only centre activity and security evidence.",
 "/tests-results": "Assessments, marks and published results.",
 "/homework": "Assigned work and submission progress.",
 "/ics-updates": "Centre notices, photo statuses and timetable updates.",
 "/settings": "Appearance and centre preferences.",
};
export const navigation=roleFeatures("admin").map(entry=>({href:entry.href!,label:entry.label,icon:entry.icon,description:descriptions[entry.href!]??entry.scope}));
export { defaultBatches } from "./students/model";
