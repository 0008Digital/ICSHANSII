import { SettingsHeading } from "./settings-heading";
import { notFound } from "next/navigation";
import { navigation } from "@/components/ics/navigation";
import { PageHeading, EmptyState } from "@/components/ics/page-heading";
import { PersonalSettings } from "@/components/ics/personal-settings";
import { BatchManagement } from "@/components/ics/students/batch-management";
import { AuditLogs, FinancialLedger } from "@/components/ics/audit-ledger";
import { AcademicPreview } from "@/components/ics/academic-preview";
import { FeeManagement } from "@/components/ics/students/fee-management";
import { AttendancePreview } from "@/components/ics/attendance-preview";
const routes = navigation.filter(e=>e.href!=="/");
const empty:Record<string,{title:string;description:string}>={
 fees:{title:"Your fee register will live here",description:"Receipts and balances will be available after secure financial workflows are implemented. No payment or balance is recorded in this preview."},
 attendance:{title:"Ready for the class register",description:"Choose a batch and session here once authorized attendance workflows are connected. No attendance has been recorded."},
 staff:{title:"A dedicated space for your team",description:"Staff records, approved role administration and teacher assignments will live here. Access changes require reviewed authorization and audit trails."},
 "tests-results":{title:"Make progress easy to follow",description:"Tests, marks entry and published results will share this canonical academic workflow. There are no live assessments yet."},
 homework:{title:"One place for assigned work",description:"Homework and submission tracking will appear here after assigned-batch permissions are implemented."},
};
export function ManagementPage({section}:{section:string}){
 const entry=routes.find(e=>e.href===`/${section}`);if(!entry)notFound();
 return <>{section==="settings"?<SettingsHeading/>:<PageHeading title={entry.label}/>}
 {section==="batches"?<BatchManagement/>:section==="audit-logs"?<AuditLogs/>:section==="ledger"?<FinancialLedger/>:section==="fees"?<FeeManagement/>:section==="attendance"?<AttendancePreview/>:section==="tests-results"?<AcademicPreview/>:section==="settings"?<PersonalSettings/>:section==="ics-updates"?<><section className="updates-section"><div className="section-heading"><h2>Pinned current timetables</h2><span className="quiet-label">No images published</span></div><p>Current timetable images will be pinned here, with dates and readable text alternatives.</p></section><EmptyState title="Updates, without the clutter">Centre notices and WhatsApp-style photo statuses will appear here. Previous timetable images will remain available in an accessible history. Publishing, uploads and history are not connected.</EmptyState></>:<EmptyState title={empty[section].title}>{empty[section].description}</EmptyState>}
 </>;
}
