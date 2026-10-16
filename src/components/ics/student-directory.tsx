"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { useAppMotionReduced } from "@/app/providers";
import { ChoiceSelect } from "./choice-select";
import { GlassSurface } from "./glass";
import { DisclosureSummary } from "./disclosure-summary";
import { StudentForm } from "./students/student-form";
import { studentContact, studentContactLabel, batches, statuses, students, filterStudents, enrollmentSnapshotFor, studentOverview, type DemoStudent } from "./students/model";
import { localToday } from "./date-only.mjs";
import { demoEnrollmentByStudent, enrollmentDisplayStatus } from "./students/lifecycle.mjs";

const subscribeLocation=(listener:()=>void)=>{window.addEventListener("popstate",listener);window.addEventListener("pageshow",listener);return()=>{window.removeEventListener("popstate",listener);window.removeEventListener("pageshow",listener);};};
const currentSearch=()=>window.location.search,serverSearch=()=>"";
type DirectoryView="all"|"batch"|"enrollments"|"fees"|"renewals"|"archive";
type EnrollmentRecord={id:string;student:DemoStudent;record:{startDate:string;endDate:string;batch:string;rollNumber:string};snapshot:ReturnType<typeof enrollmentSnapshotFor>};

function Metric({label,value,detail,action,onClick,href,active=false,disabled=false}:{label:string;value:string|number;detail:string;action?:string;onClick?:()=>void;href?:string;active?:boolean;disabled?:boolean}) {
 const className=`student-metric${onClick||href?" student-metric--interactive":""}${active?" is-active":""}`;
 const content=<><span>{label}</span><strong>{value}</strong><small>{detail}</small>{(onClick||href)&&<span className="student-metric-action" aria-hidden="true">{action??"View records"}<svg viewBox="0 0 16 16" focusable="false"><path d="M5 11 11 5M5.5 5H11v5.5"/></svg></span>}</>;
 if(href)return <Link className={className} href={href}>{content}</Link>;
 if(onClick)return <button type="button" className={className} aria-pressed={active} onClick={onClick}>{content}</button>;
 return <GlassSurface as="section" className="student-metric" aria-label={`${label}: ${value}. ${detail}`} aria-disabled={disabled||undefined}>{content}</GlassSurface>;
}

function EnrollmentRecordsView({records,page,pageSize,onPage}:{records:EnrollmentRecord[];page:number;pageSize:number;onPage:(page:number)=>void}){
 const visible=records.slice(page*pageSize,(page+1)*pageSize);
 return <>
  <div className="table-scroll student-desktop enrollment-record-list" role="region" aria-label="Fictional enrollment records" tabIndex={0}><table><caption className="sr-only">Enrollment periods are records distinct from unique student profiles.</caption><thead><tr><th scope="col">Student</th><th scope="col">Enrollment reference</th><th scope="col">Batch</th><th scope="col">Validity period</th><th scope="col">Status</th><th scope="col">Batch roll</th></tr></thead><tbody>{visible.map(item=><tr key={item.id}><th scope="row"><Link className="text-link" href={`/students/${item.student.id}`}>{item.student.name}</Link><small>{item.student.id} · demo student reference</small></th><td>{item.id}</td><td>{item.record.batch}</td><td>{item.record.startDate} – {item.record.endDate}</td><td>{enrollmentDisplayStatus(item.snapshot.status)}</td><td>{item.record.rollNumber}</td></tr>)}</tbody></table></div>
  <ul className="student-mobile enrollment-mobile-list">{visible.map(item=><li key={item.id}><div><Link className="text-link" href={`/students/${item.student.id}`}>{item.student.name}</Link><span className="record-status">{enrollmentDisplayStatus(item.snapshot.status)}</span></div><p>Enrollment reference: {item.id}</p><p>{item.record.batch} · {item.record.startDate} – {item.record.endDate}</p><p>Batch roll: {item.record.rollNumber}</p></li>)}</ul>
  {records.length>pageSize&&<div className="student-pagination"><button type="button" className="secondary-button" disabled={page===0} onClick={()=>onPage(Math.max(0,page-1))}>Previous</button><span>Page {page+1} of {Math.ceil(records.length/pageSize)}</span><button type="button" className="secondary-button" disabled={(page+1)*pageSize>=records.length} onClick={()=>onPage(Math.min(Math.ceil(records.length/pageSize)-1,page+1))}>Next</button></div>}
 </>;
}

export function StudentDirectory() {
 const [search,setSearch]=useState("");
 const [batch,setBatch]=useState("");
 const [status,setStatus]=useState("");
 const [enrollmentOverride,setEnrollmentOverride]=useState<string|null>(null);
 const [renewalEligibility,setRenewalEligibility]=useState("");
 const [view,setView]=useState<DirectoryView>("all");
 const [admissionOpen,setAdmissionOpen]=useState(false);
 const [archiveStatus,setArchiveStatus]=useState("");
 const [archiveYear,setArchiveYear]=useState("");
 const [page,setPage]=useState(0);
 const panel=useRef<HTMLElement>(null);
 const directoryPanel=useRef<HTMLElement>(null);
 const advanced=useRef<HTMLDetailsElement>(null);
 const reduced=useAppMotionReduced();
 const [activeMetric,setActiveMetric]=useState<string|null>(null);
 const [directoryJump,setDirectoryJump]=useState(0);
 const locationSearch=useSyncExternalStore(subscribeLocation,currentSearch,serverSearch);
 const requested=new URLSearchParams(locationSearch).get("enrollment");
 const enrollment=enrollmentOverride??(["Upcoming","Active","Expiring Soon","Expired","Completed","Left"].includes(requested??"")?requested!:"");
 const today=localToday();
 const summary=studentOverview(today);
 const candidates=filterStudents(search,view==="batch"?batch:"",view==="archive"?archiveStatus:status,enrollment,today).filter(student=>{
  if(view==="fees"||view==="archive")return false;
  const snapshot=enrollmentSnapshotFor(student.id,today);
  if(view==="renewals"&&!snapshot.eligibleForRenewal)return false;
  if(renewalEligibility==="eligible"&&!snapshot.eligibleForRenewal)return false;
  if(renewalEligibility==="not-due"&&snapshot.eligibleForRenewal)return false;
  return true;
 });
 const rows=view==="batch"?[...(batch?candidates:[])].sort((a,b)=>a.name.localeCompare(b.name)):candidates;
 const pageSize=25;
 const visibleRows=rows.slice(page*pageSize,(page+1)*pageSize);
 const batchOptions=useMemo(()=>batches.map(name=>({value:name,label:`${name} · ${students.filter(student=>student.batch===name).length}`})),[]);
 const allowedEnrollments=["Upcoming","Active","Expiring Soon","Expired","Completed","Left"] as const;
 const filteredStudentIds=new Set(filterStudents(search,batch,status,enrollment,today).map(student=>student.id));
 const enrollmentRecords=Object.entries(demoEnrollmentByStudent).flatMap(([studentId,record],index)=>{
  const student=students.find(item=>item.id===studentId);
  if(!student||!filteredStudentIds.has(studentId))return [];
  const snapshot=enrollmentSnapshotFor(studentId,today);
  return [{id:`DEMO-ENR-${String(index+1).padStart(3,"0")}`,student,record,snapshot}];
 });
 useEffect(()=>{if(admissionOpen&&panel.current)panel.current.scrollIntoView({behavior:reduced?"instant":"smooth",block:"start"});},[admissionOpen,reduced]);
 useEffect(()=>{if(directoryJump)directoryPanel.current?.scrollIntoView({behavior:reduced?"instant":"smooth",block:"start"});},[directoryJump,reduced]);
 function clearFilters(){setSearch("");setBatch("");setStatus("");setEnrollmentOverride("");setRenewalEligibility("");setArchiveStatus("");setArchiveYear("");setActiveMetric(null);setPage(0);if(advanced.current)advanced.current.open=false;}
 function selectView(next:DirectoryView){clearFilters();setView(next);if(next==="batch")setBatch(batches[0]);}
 function selectMetric(metric:"active"|"inactive"|"enrollments"|"expiring"|"expired"){
  setSearch("");setBatch("");setStatus(metric==="active"?"Active":metric==="inactive"?"Inactive":"");setEnrollmentOverride(metric==="expiring"?"Expiring Soon":metric==="expired"?"Expired":"");setRenewalEligibility("");setArchiveStatus("");setArchiveYear("");setView(metric==="enrollments"?"enrollments":"all");setPage(0);setActiveMetric(metric);setDirectoryJump(current=>current+1);
 }
 function clearOneFilter(kind:"search"|"batch"|"status"|"enrollment"|"renewal"){
  if(kind==="search")setSearch("");if(kind==="batch")setBatch("");if(kind==="status")setStatus("");if(kind==="enrollment")setEnrollmentOverride("");if(kind==="renewal")setRenewalEligibility("");setActiveMetric(null);setPage(0);
 }
 function closeAdmission(){const form=panel.current?.querySelector("form");if(form?.dataset.dirty==="true"&&!window.confirm("Discard the unsaved admission draft and close this workspace?"))return;setAdmissionOpen(false);}
 return <div className="student-workspace">
  <section className="student-overview" aria-labelledby="student-overview-title">
   <div className="student-overview-heading"><h2 id="student-overview-title">Student overview</h2><span>FICTIONAL DEMO</span></div>
   <div className="student-metrics">
    <Metric label="Active Students" value={summary.activeStudents} detail="Fictional directory records" action="View active students" active={activeMetric==="active"} onClick={()=>selectMetric("active")}/>
    <Metric label="Inactive Students" value={summary.inactiveStudents} detail="Fictional directory records" action="View inactive students" active={activeMetric==="inactive"} onClick={()=>selectMetric("inactive")}/>
    <Metric label="Total Enrollments" value={summary.totalEnrollments} detail="Enrollment periods · not unique students" action="View enrollment history" active={activeMetric==="enrollments"} onClick={()=>selectMetric("enrollments")}/>
    <Metric label="Fee Due Cases" value="—" detail="Unavailable · fee records not connected" disabled/>
    <Metric label="Expiring Soon" value={summary.expiringSoon} detail="Renewals due within 30 days · demo" action="View renewals" active={activeMetric==="expiring"} onClick={()=>selectMetric("expiring")}/>
    <Metric label="Expired Enrollments" value={summary.expiredEnrollments} detail="Fictional enrollment periods" action="View expired enrollments" active={activeMetric==="expired"} onClick={()=>selectMetric("expired")}/>
    <Metric label="Active Batches" value={summary.activeBatches} detail="With active demo enrollments" action="Open batches" href="/batches"/>
   </div>
  </section>

  {admissionOpen&&<motion.section ref={panel} className="directory inline-admission" aria-labelledby="inline-admission-title" initial={reduced?false:{opacity:0,y:-8}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.18,ease:[.22,1,.36,1]}}>
   <header className="directory-heading"><div><h2 id="inline-admission-title">Add Student</h2><p className="section-footnote">Unsaved admission draft.</p></div><button className="secondary-button" type="button" onClick={closeAdmission}>Close admission</button></header>
   <StudentForm onClose={()=>setAdmissionOpen(false)}/>
  </motion.section>}

  <section ref={directoryPanel} className="directory student-directory" aria-label="Fictional student directory">
   <div className="directory-heading"><div><h2>Student directory</h2><span className="quiet-label">Sample records · not connected</span></div><div className="student-directory-heading-actions"><span className="quiet-label">{students.length} demo records</span><button className="primary-link" type="button" aria-expanded={admissionOpen} onClick={()=>admissionOpen?closeAdmission():setAdmissionOpen(true)}>{admissionOpen?"Hide admission":"Add Student"}</button></div></div>
   <div className="student-view-tabs" role="group" aria-label="Student directory views">
    <button type="button" aria-pressed={view==="all"} onClick={()=>selectView("all")}>All Students</button>
    <button type="button" aria-pressed={view==="batch"} onClick={()=>selectView("batch")}>By Batch</button>
    <button type="button" aria-pressed={view==="enrollments"} onClick={()=>selectView("enrollments")}>Enrollments</button>
    <button type="button" aria-pressed={view==="fees"} onClick={()=>selectView("fees")}>Fee Follow-ups</button>
    <button type="button" aria-pressed={view==="renewals"} onClick={()=>selectView("renewals")}>Renewal Due</button>
    <button type="button" aria-pressed={view==="archive"} onClick={()=>selectView("archive")}>Archive</button>
   </div>
   {view==="batch"&&<div className="batch-selector-row"><ChoiceSelect label="Batch directory" value={batch} onChange={value=>{setBatch(value);setPage(0);setActiveMetric(null);}} options={[{value:"",label:"Choose a batch"},...batchOptions]}/><span>{batch?`${students.filter(student=>student.batch===batch).length} demo students`:"Select one batch to view its records"}</span></div>}
   <div className="directory-toolbar student-filters">
    <label className="student-search">Search students<input type="search" placeholder="Search name, ID, registration or phone" value={search} onChange={event=>{setSearch(event.currentTarget.value);setPage(0);setActiveMetric(null);}}/></label>
    {view!=="archive"&&<ChoiceSelect label="Student status" value={status} onChange={value=>{setStatus(value);setPage(0);setActiveMetric(null);}} options={[{value:"",label:"All student statuses"},...statuses.map(value=>({value,label:value}))]}/>}
   </div>
   {view==="archive"&&<div className="archive-filters"><ChoiceSelect label="Archive status" value={archiveStatus} onChange={value=>{setArchiveStatus(value);setActiveMetric(null);}} options={[{value:"",label:"Left or Completed"},{value:"Left",label:"Left"},{value:"Completed",label:"Completed"}]}/><ChoiceSelect label="Archive year" value={archiveYear} onChange={value=>{setArchiveYear(value);setActiveMetric(null);}} options={[{value:"",label:"All years"},...Array.from({length:5},(_,index)=>String(new Date().getFullYear()-index)).map(value=>({value,label:value}))]}/></div>}
   {(search||batch||status||enrollment||renewalEligibility)&&<div className="active-filter-summary" aria-label="Active student filters"><span>Showing filtered records</span>{search&&<button type="button" onClick={()=>clearOneFilter("search")}>Search: {search} <span aria-hidden="true">×</span></button>}{batch&&<button type="button" onClick={()=>clearOneFilter("batch")}>Batch: {batch} <span aria-hidden="true">×</span></button>}{status&&<button type="button" onClick={()=>clearOneFilter("status")}>Status: {status} <span aria-hidden="true">×</span></button>}{enrollment&&<button type="button" onClick={()=>clearOneFilter("enrollment")}>Enrollment: {enrollmentDisplayStatus(enrollment)} <span aria-hidden="true">×</span></button>}{renewalEligibility&&<button type="button" onClick={()=>clearOneFilter("renewal")}>Renewal: {renewalEligibility} <span aria-hidden="true">×</span></button>}<button className="clear-all-filters" type="button" onClick={clearFilters}>Clear all</button></div>}
   <details ref={advanced} className="directory advanced-filter-disclosure">
    <DisclosureSummary>Advanced filters</DisclosureSummary>
    <div className="advanced-filter-grid">
     {view!=="batch"&&<ChoiceSelect label="Batch" value={batch} onChange={value=>{setBatch(value);setPage(0);setActiveMetric(null);}} options={[{value:"",label:"All batches"},...batchOptions]}/>}
     <ChoiceSelect label="Enrollment status" value={enrollment} onChange={value=>{setEnrollmentOverride(value);setPage(0);setActiveMetric(null);}} options={[{value:"",label:"All enrollment statuses"},...allowedEnrollments.map(value=>({value,label:enrollmentDisplayStatus(value)}))]}/>
     <ChoiceSelect label="Renewal eligibility" value={renewalEligibility} onChange={value=>{setRenewalEligibility(value);setPage(0);setActiveMetric(null);}} options={[{value:"",label:"All eligibility"},{value:"eligible",label:"Eligible for renewal"},{value:"not-due",label:"Not currently due"}]}/>
     <label className="unavailable-filter">Fee status<input value="Not connected" disabled aria-label="Fee status filter not connected"/></label>
     <label className="unavailable-filter">Admission period<input value="Admission dates unavailable" disabled aria-label="Admission period filter unavailable"/></label>
     <button className="secondary-button student-reset" type="button" onClick={clearFilters}>Reset filters</button>
    </div>
   </details>
   {view==="fees"?<div className="student-view-empty"><h3>Fee follow-ups are unavailable</h3><p>No fee statuses or confirmed payment records are connected, so this view will not invent due cases.</p><Link className="text-link" href="/fees">Open Fees</Link></div>:view==="archive"?<div className="student-view-empty archive-empty"><h3>Student Archive · preview only</h3><p>No students are marked Left or Completed in this fictional dataset. Expired enrollments and expired fees do not archive students. Authorized archive and rejoin actions require backend history and centre permissions.</p></div>:view==="enrollments"?enrollmentRecords.length===0?<p className="no-results">No enrollment periods match these filters.</p>:<EnrollmentRecordsView records={enrollmentRecords} page={page} pageSize={pageSize} onPage={setPage}/>:rows.length===0?<p className="no-results">{view==="batch"&&!batch?"Choose a batch to display its students.":"No students match these filters."}</p>:<>
    {view==="batch"&&<p className="batch-directory-status" role="status">{batch?`${batch} · ${rows.length} fictional students`:`Choose a batch above · ${rows.length} students across all demo batches`}</p>}
    <div className="table-scroll student-desktop" role="region" aria-label="Student records" tabIndex={0}>
     <table><caption className="sr-only">Fictional students. Demo IDs are not official Student IDs.</caption><thead><tr><th scope="col">Student</th><th scope="col">Permanent Student ID</th><th scope="col">Registration Number</th><th scope="col">Parent / guardian contact</th><th scope="col">Batch / roll</th><th scope="col">Status / enrollment</th></tr></thead><tbody>{visibleRows.map(student=>{const current=enrollmentSnapshotFor(student.id,today);return <tr key={student.id}><th scope="row"><Link className="text-link" href={`/students/${student.id}`}>{student.name}</Link><small>Demo reference: {student.id}</small><small>Parent: {[student.fatherName,student.motherName].filter(Boolean).join(" / ")||"Names unavailable"}</small></th><td className="tabular">{student.permanentStudentId??"Not issued"}</td><td className="tabular">{student.paperRegistrationNumber||"Not recorded"}</td><td><span>{studentContactLabel(student)}</span><small>{studentContact(student)}</small></td><td>{student.batch||"Unassigned / legacy demo"}<small>Batch roll: {student.batchRollNumber??"Not issued"}</small></td><td><span className="record-status">{student.status}</span><small>{enrollmentDisplayStatus(current.status)}</small></td></tr>})}</tbody></table>
    </div>
    <ul className="student-mobile">{visibleRows.map(student=>{const current=enrollmentSnapshotFor(student.id,today);return <li className="student-mobile-record" key={student.id}><div><Link className="text-link" href={`/students/${student.id}`}>{student.name}</Link><span className="record-status">{student.status}</span></div><p>Permanent Student ID: {student.permanentStudentId??"Not issued"}</p><p>Registration Number: {student.paperRegistrationNumber||"Not recorded"}</p><p>{student.batch||"Unassigned / legacy demo"} · Batch roll: {student.batchRollNumber??"Not issued"}</p><p>{studentContactLabel(student)}: {studentContact(student)}</p><p>Enrollment: {enrollmentDisplayStatus(current.status)}</p><Link className="text-link" href={`/students/${student.id}`}>View profile</Link></li>})}</ul>
    {rows.length>pageSize&&<div className="student-pagination"><button type="button" className="secondary-button" disabled={page===0} onClick={()=>setPage(current=>Math.max(0,current-1))}>Previous</button><span>Page {page+1} of {Math.ceil(rows.length/pageSize)}</span><button type="button" className="secondary-button" disabled={(page+1)*pageSize>=rows.length} onClick={()=>setPage(current=>current+1)}>Next</button></div>}
   </>}
   {view!=="fees"&&view!=="archive"&&<p className="table-footer" role="status">{view==="enrollments"?`${enrollmentRecords.length} fictional enrollment ${enrollmentRecords.length===1?"record":"records"}`:`${rows.length} of ${students.length} fictional students · showing ${visibleRows.length} on this page`}</p>}
  </section>
  <p className="section-footnote">Demo references are not official Student IDs or roll numbers. Staff enter Registration Numbers manually.</p>
 </div>;
}
