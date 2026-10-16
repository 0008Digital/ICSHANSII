"use client";

import { useMemo, useRef, useState } from "react";
import { ChoiceSelect } from "./choice-select";
import { DatePicker } from "./date-picker";
import { GlassSurface } from "./glass";
import { localToday } from "./date-only.mjs";
import { batches, students, enrollmentSnapshotFor, type DemoStudent } from "./students/model";
import { enrollmentDisplayStatus } from "./students/lifecycle.mjs";
import { useWorkspaceRolePreview } from "./workspace-role-preview";
import { lookupAttendanceRoster } from "./attendance-model.mjs";

type Mark="Present"|"Absent"|"Leave";
export function AttendancePreview(){
 const {role}=useWorkspaceRolePreview();
 if(role==="teacher")return <section className="directory attendance-rapid"><p className="demo-banner"><strong>TEACHER PREVIEW</strong> Teacher assignments and rosters are not connected.</p><p className="section-footnote">Attendance requires a verified batch assignment.</p></section>;
 return <AttendanceForm/>;
}
function AttendanceForm(){
 const [batch,setBatch]=useState(batches[0]);
 const [date,setDate]=useState(localToday());
 const [lookup,setLookup]=useState("");
 const [selectedId,setSelectedId]=useState("");
 const lookupInput=useRef<HTMLInputElement>(null);
 const [marks,setMarks]=useState<Record<string,Mark>>({});
 const [review,setReview]=useState(false);
 const today=localToday();
 const inBatch=useMemo(()=>students.filter(student=>student.batch===batch),[batch]);
 const activeRoster=inBatch.filter(student=>!["Expired","Completed","Left"].includes(enrollmentSnapshotFor(student.id,today).status));
 const expiredRoster=inBatch.filter(student=>["Expired","Completed","Left"].includes(enrollmentSnapshotFor(student.id,today).status));
 const lookupResult=lookupAttendanceRoster(activeRoster,lookup) as {matches:DemoStudent[];kind:"empty"|"roll"|"text";duplicate:boolean};const lookupText=lookup.trim().toLocaleLowerCase();
 const numericLookup=lookupResult.kind==="roll";const lookupMatches=lookupResult.matches;
 const rollMatches=numericLookup?lookupMatches:[];
 const assignedRolls=activeRoster.map(student=>student.batchRollNumber?.trim()??"").filter(Boolean);
 const missingRollCount=activeRoster.length-assignedRolls.length;
 const duplicateRollCount=assignedRolls.length-new Set(assignedRolls).size;
 const selected=activeRoster.find(student=>student.id===selectedId)??(lookupMatches.length===1?lookupMatches[0]:null);
 const rollMessage=numericLookup?rollMatches.length>1?"Duplicate roll number detected. Choose students by name to review; roll lookup remains blocked.":rollMatches.length===1?"Matched one active fictional student.":"No active student has this issued batch roll.":lookupText&&lookupMatches.length===0?"No active student matches this name or demo reference.":"Enter a roll number; name or demo reference also works as a fallback.";
 function markStudent(mark:Mark){if(!selected)return;setMarks(current=>({...current,[selected.id]:mark}));setReview(false);setSelectedId("");setLookup("");requestAnimationFrame(()=>lookupInput.current?.focus());}
 const marked=Object.keys(marks).length;
 return <div className="attendance-preview-workspace">
  <p className="demo-banner"><strong>DEMO PREVIEW</strong> Attendance is not connected. Draft marks are not submitted and clear on refresh.</p>
  <section className="directory attendance-rapid" aria-labelledby="rapid-attendance-title">
   <header className="directory-heading"><div><h2 id="rapid-attendance-title">Rapid Attendance · preview</h2><p>Identify a student, confirm the details, then mark a draft status.</p></div></header>
   <div className="attendance-setup"><ChoiceSelect label="Preview batch" value={batch} onChange={value=>{setBatch(value);setSelectedId("");setLookup("");setMarks({});setReview(false);}} options={batches.map(value=>({value,label:`${value} · ${students.filter(student=>student.batch===value).length} demo`}))}/><DatePicker label="Attendance Date" value={date} onChange={value=>{setDate(value);setMarks({});setReview(false);}} max={today}/></div>
   <div className="attendance-lookup-bar"><label htmlFor="attendance-student-lookup">Roll number or student name<input ref={lookupInput} id="attendance-student-lookup" inputMode={lookup&&!numericLookup?"search":"numeric"} autoComplete="off" value={lookup} onChange={event=>{setLookup(event.currentTarget.value);setSelectedId("");setReview(false);}} placeholder="Enter roll number" aria-describedby="roll-status"/></label><div className="attendance-lookup-meta"><small id="roll-status" role="status">{rollMessage}</small><strong>{marked} / {activeRoster.length} marked</strong></div></div>
   {lookupText&&lookupMatches.length>1&&!numericLookup&&<ul className="attendance-student-matches" aria-label="Matching students">{lookupMatches.map(student=><li key={student.id}><button type="button" className="attendance-match" onClick={()=>setSelectedId(student.id)}><span><strong>{student.name}</strong><small>{student.id} · {student.batch} · roll {student.batchRollNumber??"not issued"}</small></span><span>{marks[student.id]?`Marked ${marks[student.id]}`:"Select"}</span></button></li>)}</ul>}
   {lookupText&&lookupMatches.length===0&&<p className="attendance-no-match" role="status">No active student matches. Expired enrollments remain in the separate list below.</p>}
   {selected&&<GlassSurface className="attendance-student-confirmation"><p className="quiet-label">CONFIRM STUDENT · FICTIONAL</p><h3>{selected.name}</h3><dl><div><dt>Student reference</dt><dd>{selected.id}</dd></div><div><dt>Batch</dt><dd>{selected.batch}</dd></div><div><dt>Batch roll</dt><dd>{selected.batchRollNumber??"Not issued"}</dd></div><div><dt>Enrollment</dt><dd>{enrollmentDisplayStatus(enrollmentSnapshotFor(selected.id,today).status)}</dd></div></dl><p>{marks[selected.id]?`Already marked ${marks[selected.id]}; choose a correction before review.`:"Confirm the matched student before marking attendance."}</p><div className="attendance-mark-actions">{(["Present","Absent","Leave"] as const).map(mark=><button key={mark} type="button" aria-pressed={marks[selected.id]===mark} className={marks[selected.id]===mark?"attendance-mark attendance-mark--selected":"attendance-mark"} onClick={()=>markStudent(mark)}>{mark}</button>)}</div></GlassSurface>}
   <section className="attendance-register-preview" aria-labelledby="attendance-register-title"><header><div><h3 id="attendance-register-title">Batch register preview</h3><p>{batch} · {date} · {marked} marked of {activeRoster.length} active demo students</p><small role="status">Roll audit: {missingRollCount} missing · {duplicateRollCount} duplicate numbers.</small></div><button type="button" className="primary-link" disabled={marked===0} onClick={()=>setReview(true)}>Review register</button></header>
    <ul>{activeRoster.map(student=><li key={student.id}><span><strong>{student.name}</strong><small>{student.id} · batch roll {student.batchRollNumber??"not issued"}</small></span><span>{marks[student.id]??"Not marked"}</span></li>)}</ul>
    {expiredRoster.length>0&&<div className="attendance-expired-roster"><strong>Expired or completed enrollments · separate from active register</strong><ul>{expiredRoster.map(student=><li key={student.id}>{student.name} · {student.id} · {enrollmentDisplayStatus(enrollmentSnapshotFor(student.id,today).status)}</li>)}</ul></div>}
    {review&&<div className="attendance-review" role="status"><strong>Unsaved register review</strong><span>Present {Object.values(marks).filter(mark=>mark==="Present").length} · Absent {Object.values(marks).filter(mark=>mark==="Absent").length} · Leave {Object.values(marks).filter(mark=>mark==="Leave").length}.</span><p>Not submitted. Recording attendance requires verified permissions and final confirmation.</p></div>}
   </section>
  </section>
 </div>;
}
