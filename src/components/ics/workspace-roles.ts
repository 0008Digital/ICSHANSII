// Presentation planning only. Neither these routes nor role labels authorize data access.
import { DEFAULT_BRANDING } from "./branding/branding.ts";
export type WorkspaceRole="platform-owner"|"admin"|"manager"|"teacher"|"student";
export type NavigationGroup="Overview"|"Academics"|"Operations"|"Bottom";
export type RoleFeature={id:string;label:string;icon:string;group:NavigationGroup;href:string|null;scope:string};
export type WorkspaceCommand={id:string;label:string;description:string;icon:string;href:string;kind:"route"|"action"};
export const roleLabels:Record<WorkspaceRole,string>={"platform-owner":"Platform Owner",admin:"Centre Admin",manager:"Manager",teacher:"Teacher",student:"Student"};
export const DEMO_WORKSPACE={role:"admin" as WorkspaceRole,kind:"centre" as const,name:DEFAULT_BRANDING.displayName,branch:DEFAULT_BRANDING.branchName,demo:true};
const feature=(id:string,label:string,icon:string,group:NavigationGroup,href:string|null,scope:string):RoleFeature=>({id,label,icon,group,href,scope});
const centre=[
 feature("dashboard","Dashboard","dashboard","Overview","/","centre overview"),
 feature("students","Students","students","Academics","/students","centre admissions and directory"),
 feature("batches","Batches","batches","Academics","/batches","centre batches; assignments require authorization"),
 feature("attendance","Attendance","attendance","Academics","/attendance","centre register"),
 feature("tests-results","Tests & Results","tests","Academics","/tests-results","centre assessments"),
 feature("homework","Homework","homework","Academics","/homework","centre oversight; physical checking"),
 feature("fees","Fees","fees","Operations","/fees","financial authorization required"),
 feature("ledger","Ledger","ledger","Operations","/ledger","append-only financial transaction history; permissions required"),
 feature("staff","Staff","staff","Operations","/staff","admin management; manager coordination only with grants"),
 feature("audit-logs","Audit Logs","audit","Operations","/audit-logs","centre audit events; security and role scope required"),
 feature("ics-updates","ICS Updates","updates","Operations","/ics-updates","centre updates"),
 feature("chatrooms","Chatrooms","chat","Operations","/chatrooms","demo chat only; future memberships require server authorization"),
 feature("settings","Settings","settings","Bottom","/settings","personal appearance; device-local centre branding preview only"),
];
export function roleFeatures(role:WorkspaceRole):RoleFeature[] {
 if(role==="admin")return centre;
 if(role==="manager")return centre.filter(item=>item.id!=="ledger"&&item.id!=="audit-logs").map(item=>({...item,scope:item.id==="staff"?"coordination only with explicit staff grant":item.scope}));
 const planned=(id:string,label:string,icon:string,group:NavigationGroup,scope:string)=>feature(id,label,icon,group,null,scope);
 if(role==="student")return [
  feature("student-home","Home","dashboard","Overview","/student-portal","personal student portal preview only"),
  feature("student-batch","Classes / Batch","batches","Academics","/student-portal#batch","own enrollment only after authenticated sign-in"),
  feature("student-attendance","Attendance","attendance","Academics","/student-portal#attendance","own attendance only after authenticated sign-in"),
  feature("student-results","Results","tests","Academics","/student-portal#results","published own results only"),
  feature("student-fees","Fees","fees","Operations","/student-portal#fees","own invoices and receipts only; no centre ledger"),
  feature("student-profile","Profile","students","Academics","/student-portal#profile","own profile only after authenticated sign-in"),
  feature("student-homework","Homework","homework","Academics","/student-portal#homework","own homework only"),
  feature("student-updates","ICS Updates","updates","Operations","/student-portal#updates","centre notices only"),
  feature("student-chat","Chatrooms","chat","Operations","/chatrooms","demo room access only; membership is not authenticated"),
  feature("student-settings","Settings","settings","Bottom","/settings","personal appearance"),
 ];
 if(role==="platform-owner")return [
  feature("developer-console","Developer Console","dashboard","Overview","/developer","simulated technical overview; no production telemetry"),
  feature("bug-reports","Bug Reports","audit","Operations","/developer#bug-reports","fictional reports and local-only preview state"),
  feature("application-errors","Application Errors","audit","Operations","/developer#application-errors","no error ingestion is configured"),
  feature("system-health","System Health","settings","Operations","/developer#system-health","unconfigured services stay Unknown"),
  feature("release-updates","Release Updates","updates","Operations","/developer#release-updates","local release-note preview only"),
  feature("feedback","Feedback","students","Operations","/developer#feedback","fictional feedback queue"),
  feature("chat-moderation","Chatroom Moderation","chat","Operations","/developer#chat-moderation","minimum incident metadata; support access requires explicit audit"),
  feature("centres","Centre Overview","batches","Operations","/developer#centres","tenant metadata only; no private student access"),
  feature("developer-settings","Developer Settings","settings","Bottom","/developer#developer-settings","local preferences only"),
  feature("personal-settings","Appearance Settings","settings","Bottom","/settings","personal appearance only; centre branding is separate"),
 ];
 const teacher=role==="teacher";
 return [
  ...(teacher?[feature("teacher-dashboard","Teacher Dashboard","dashboard","Overview","/teacher-dashboard","simulated teaching overview; assignments are not connected")]:[planned("dashboard","Dashboard","dashboard","Overview","own overview")]),
  ...(teacher?[feature("assigned-students","Assigned Students","students","Academics","/teacher-dashboard#assigned-students","no verified batch assignments or student roster are connected")]:[planned("own-profile","My profile","students","Academics","office-linked own student record only")]),
  ...(teacher?[feature("batches","Assigned Batches","batches","Academics","/teacher-dashboard#assigned-batches","no verified batch assignments are connected")]:[planned("batches","My batch","batches","Academics","own current enrollment")]),
  ...(teacher?[feature("attendance","Rapid Attendance","attendance","Academics","/attendance","demo preview only; teacher assignments are unverified")]:[planned("attendance","Attendance","attendance","Academics","own attendance read only")]),
  ...(teacher?[feature("tests-results","Tests & Results","tests","Academics","/teacher-dashboard#tests","no assessment data is connected")]:[planned("tests-results","Test results","tests","Academics","own published results")]),
  ...(teacher?[feature("homework","Homework","homework","Academics","/teacher-dashboard#homework","no assignment data is connected")]:[planned("homework","Homework","homework","Academics","own homework status")]),
  ...(teacher?[feature("teacher-chat","Chatrooms","chat","Operations","/chatrooms","demo rooms only; assignment scope is not verified")]:[]),
  ...(!teacher?[planned("student-chat","Chatrooms","chat","Operations","authorized membership required")]:[]),
  ...(!teacher?[planned("own-fees","Fees & payments","fees","Operations","own fee information; no ledger mutations")]:[]),
  planned("ics-updates","ICS Updates","updates","Operations",teacher?"relevant assigned-centre notices":"own centre notices"),
  feature("personal-settings","Settings","settings","Bottom","/settings","personal appearance only; centre branding is separate"),
 ];
}
/** Client-visible navigation only; this registry is presentation, never authorization. */
export function workspaceCommands(role:WorkspaceRole):WorkspaceCommand[] {
 const commands:WorkspaceCommand[]=roleFeatures(role).flatMap(item=>item.href===null?[]:[{id:item.id,label:item.label,description:item.scope,icon:item.icon,href:item.href,kind:"route" as const}]);
 if((role==="admin"||role==="manager")&&commands.some(item=>item.href==="/students"))commands.splice(2,0,{id:"add-student",label:"Add Student",description:"Open the admission preview workflow",icon:"students",href:"/students/new",kind:"action"});
 return commands;
}
export type ExportChoice={id:string;label:string;formats:readonly ("csv"|"xlsx"|"pdf")[];enabled:boolean;reason?:string;filter:"batch-status"|"date-batch"|"none"};
export function exportChoices(role:WorkspaceRole):ExportChoice[] {
 const disabled=(id:string,label:string,filter:ExportChoice["filter"],reason:string):ExportChoice=>({id,label,formats:[],enabled:false,reason,filter});
 if(role==="admin")return [
  {id:"student-directory",label:"Student directory · demo data",formats:["csv"],enabled:true,filter:"batch-status"},
  disabled("admissions","Admission records","date-batch","No admission export source is connected."),
  {id:"batch-lists",label:"Batch-wise student lists · demo data",formats:["csv"],enabled:true,filter:"batch-status"},
  {id:"enrollment-expiry",label:"Enrollment expiry · demo data",formats:["csv"],enabled:true,filter:"batch-status"},
  disabled("renewal-due","Renewals due","batch-status","Renewal due records require an authorized live enrollment source."),
  disabled("renewal-history","Renewal history","batch-status","No renewal history fixture is provided."),
  {id:"audit-log",label:"Audit log examples · demo data",formats:["csv"],enabled:true,filter:"none"},
  {id:"ledger-transactions",label:"Transaction ledger · demo data",formats:["csv"],enabled:true,filter:"none"},
  {id:"income-statement",label:"Income statement · demo data",formats:["csv"],enabled:true,filter:"none"},
  {id:"expense-report",label:"Expense report · demo data",formats:["csv"],enabled:true,filter:"none"},
  {id:"payment-method-summary",label:"Payment method summary · demo data",formats:["csv"],enabled:true,filter:"none"},
  disabled("fees","Fee records and summaries","date-batch","Financial records are not connected."),
  disabled("student-fee-collections","Student fee collections","date-batch","No verified student payment or invoice source is connected."),
  disabled("renewal-collections","Renewal collections","date-batch","No renewal payment records are connected."),
  disabled("outstanding-fees","Outstanding fee report","date-batch","Outstanding balances must be derived from authorized invoices and payments."),
  disabled("attendance","Attendance reports","date-batch","Attendance records are not connected."),
  disabled("results","Test results and performance","date-batch","Assessment records are not connected."),
  disabled("staff","Staff directory and reports","none","Staff records are not connected."),
 ];
 if(role==="manager")return [
  {id:"student-directory",label:"Student directory · demo data",formats:["csv"],enabled:true,filter:"batch-status"},
  {id:"batch-lists",label:"Batch-wise student lists · demo data",formats:["csv"],enabled:true,filter:"batch-status"},
  disabled("fees","Fee collection and pending fees","date-batch","Centre grants and financial records are not connected."),
  disabled("attendance","Attendance reports","date-batch","Attendance records are not connected."),
  disabled("results","Test results","date-batch","Assessment records are not connected."),
  disabled("operations","Operational summaries","date-batch","Operational records are not connected."),
 ];
 if(role==="teacher")return [
  disabled("assigned-students","Assigned batch student lists","batch-status","Verified teacher-to-batch assignments are not available."),
  disabled("attendance","Assigned-batch attendance","date-batch","Verified teacher-to-batch assignments and attendance data are not available."),
  disabled("results","Assigned-batch tests and results","date-batch","Verified teacher-to-batch assignments and assessment data are not available."),
  disabled("homework","Assigned homework tracking","date-batch","Verified teacher-to-batch assignments and homework data are not available."),
 ];
 return [];
}
export const dashboardSummaries:Record<WorkspaceRole,{label:string;icon:string}[]>={
 admin:[{label:"Total Students",icon:"students"},{label:"Today's Attendance",icon:"attendance"},{label:"Pending Fees",icon:"fees"},{label:"Upcoming Tests",icon:"tests"}],
 manager:[{label:"Total Students",icon:"students"},{label:"Today's Attendance",icon:"attendance"},{label:"Fee Follow-ups",icon:"fees"},{label:"Upcoming Tests",icon:"tests"}],
 teacher:[{label:"Assigned Batches",icon:"batches"},{label:"Assigned Students",icon:"students"},{label:"Attendance to Mark",icon:"attendance"},{label:"Upcoming Tests",icon:"tests"}],
 student:[{label:"My Batch",icon:"batches"},{label:"My Attendance",icon:"attendance"},{label:"Fee Information",icon:"fees"},{label:"Published Results",icon:"tests"}],
 "platform-owner":[{label:"Centres",icon:"batches"},{label:"Provisioning Requests",icon:"settings"},{label:"Centre Administrators",icon:"staff"},{label:"Module Configuration",icon:"settings"}],
};
