"use client";

import { useMemo, useState } from "react";
import { ChoiceSelect } from "./choice-select";
import { DatePicker } from "./date-picker";
import { batches, students } from "./students/model";
import { localToday } from "./date-only.mjs";
import { rankAssessmentPreview, validateAssessment, rankWeeklyPreview } from "./students/academic-model.mjs";

export function AcademicPreview() {
 const [batch,setBatch]=useState(batches[0]);
 const [subject,setSubject]=useState("");
 const [testDate,setTestDate]=useState("");
 const [maximumMarks,setMaximumMarks]=useState("100");
 const [marks,setMarks]=useState<Record<string,string>>({});
 const [absentIds,setAbsentIds]=useState<string[]>([]);
 const [review,setReview]=useState(false);
 const [publicationPreview,setPublicationPreview]=useState(false);
 const [attempted,setAttempted]=useState(false);
 const [leaderboardBatch,setLeaderboardBatch]=useState(batches[0]);
 const [weeklyBatch,setWeeklyBatch]=useState("all-demo");
 const [weekStart,setWeekStart]=useState("");
 const roster=useMemo(()=>students.filter(student=>student.batch===batch&&student.status!=="Inactive"),[batch]);
 const reviewErrors=validateAssessment({subject,testDate,maximumMarks,students:roster},marks,absentIds) as unknown as Record<string,string>;
 const proposed=review?rankAssessmentPreview(roster,marks,absentIds) as {ranked:Array<{studentId:string;name:string;marks:number;rank:number}>;absent:typeof roster;notMarked:typeof roster}:null;
 const weeklyPreview=rankWeeklyPreview([]);
 function resetAssessment(){setSubject("");setTestDate("");setMaximumMarks("100");setMarks({});setAbsentIds([]);setReview(false);setPublicationPreview(false);setAttempted(false);}
 function changeBatch(next:string){setBatch(next);resetAssessment();}
 function setAbsent(id:string,checked:boolean){setAbsentIds(current=>checked?[...new Set([...current,id])]:current.filter(value=>value!==id));setReview(false);setPublicationPreview(false);setAttempted(false);}
 return <div className="academic-workspace">
  <p className="demo-banner"><strong>DEMO WORKSPACE</strong> Assessment forms and marks stay in this page session. Nothing is saved, published, or shown as an official result.</p>
  <section className="directory academic-assessment" aria-labelledby="assessment-preview-title">
   <header className="directory-heading"><div><h2 id="assessment-preview-title">Create test preview</h2><p className="section-footnote">Unsaved assessment for the selected batch.</p></div></header>
   <div className="academic-fields">
    <ChoiceSelect label="Batch" value={batch} onChange={changeBatch} options={batches.map(value=>({value,label:value}))}/>
    <label>Subject<input value={subject} maxLength={80} onChange={event=>{setSubject(event.currentTarget.value);setReview(false);setPublicationPreview(false);}} aria-invalid={attempted&&!!reviewErrors.subject}/>{attempted&&reviewErrors.subject&&<span className="field-error">{reviewErrors.subject}</span>}</label>
    <DatePicker label="Test date" value={testDate} onChange={value=>{setTestDate(value);setReview(false);setPublicationPreview(false);}} min="1900-01-01" max="2100-12-31" showToday={false} error={attempted?reviewErrors.testDate:undefined}/>
    <label>Maximum marks<input inputMode="decimal" value={maximumMarks} onChange={event=>{setMaximumMarks(event.currentTarget.value);setReview(false);setPublicationPreview(false);}} aria-invalid={attempted&&!!reviewErrors.maximumMarks}/>{attempted&&reviewErrors.maximumMarks&&<span className="field-error">{reviewErrors.maximumMarks}</span>}</label>
   </div>
   <div className="academic-roster-heading"><h3>Marks entry</h3><span>{roster.length} fictional roster records</span></div>
   {roster.length===0?<p className="no-results">This batch has no eligible fictional students in the demo roster.</p>:<div className="academic-roster">{roster.map(student=>{
    const absent=absentIds.includes(student.id),error=attempted&&reviewErrors[`mark:${student.id}`];
     return <div className="academic-roster-row" key={student.id}><div><strong>{student.name}</strong><small>{student.id} · fictional</small></div><label>Marks<input aria-label={`Marks for ${student.name}`} inputMode="decimal" disabled={absent} value={marks[student.id]??""} onChange={event=>{const nextValue=event.currentTarget.value;setMarks(current=>({...current,[student.id]:nextValue}));setReview(false);setPublicationPreview(false);}} aria-invalid={!!error}/>{error&&<span className="field-error">{error}</span>}</label><label className="academic-absent"><input type="checkbox" checked={absent} onChange={event=>setAbsent(student.id,event.currentTarget.checked)}/> Absent</label></div>;
   })}</div>}
   <div className="form-actions"><button type="button" className="primary-link" onClick={()=>{setAttempted(true);setReview(Object.keys(reviewErrors).length===0);setPublicationPreview(false);}} disabled={!roster.length}>Review results</button><button type="button" className="secondary-button" onClick={resetAssessment}>Reset</button></div>
   {attempted&&Object.keys(reviewErrors).length>0&&<p className="section-footnote" role="status">Complete the subject, date, maximum marks, and each roster row (marks or absent) to review.</p>}
   {proposed&&<section className="academic-result-preview" aria-labelledby="proposed-results-title"><div className="academic-result-heading"><div><h3 id="proposed-results-title">Proposed order · unpublished preview</h3><p>{subject.trim()} · {batch} · {testDate} · out of {maximumMarks}</p></div><button className="secondary-button" type="button" onClick={()=>setPublicationPreview(true)}>Preview publication</button></div>
    {proposed.ranked.length>0?<div className="history-table"><table><thead><tr><th>Proposed rank</th><th>Student</th><th>Marks</th><th>Percentage</th></tr></thead><tbody>{proposed.ranked.map(result=><tr key={result.studentId}><td>{result.rank}{proposed.ranked.filter(item=>item.rank===result.rank).length>1?" (tie)":""}</td><th scope="row">{result.name}</th><td>{result.marks} / {maximumMarks}</td><td>{(result.marks/Number(maximumMarks)*100).toFixed(2)}%</td></tr>)}</tbody></table></div>:<p className="no-results">No scored students. Absent students remain outside the proposed order.</p>}
    <p className="section-footnote">Absent: {proposed.absent.map(row=>row.name).join(", ")||"None"} · Not marked: {proposed.notMarked.map(row=>row.name).join(", ")||"None"}. Equal marks share competition rank; the next rank skips tied positions.</p>
    {publicationPreview&&<p className="renewal-preview" role="status"><strong>UNSAVED PUBLICATION PREVIEW</strong> Results remain unpublished. Publishing requires verified centre permissions and complete batch records.</p>}
   </section>}
  </section>

  <section className="directory academic-leaderboards" aria-labelledby="batch-leaderboard-title">
   <header className="directory-heading"><div><h2 id="batch-leaderboard-title">Batch leaderboard</h2><p className="section-footnote">Only published results can appear in an official leaderboard.</p></div></header>
   <div className="academic-fields academic-filter-fields"><ChoiceSelect label="Batch" value={leaderboardBatch} onChange={setLeaderboardBatch} options={batches.map(value=>({value,label:value}))}/><ChoiceSelect label="Published test" value="" onChange={()=>{}} options={[{value:"",label:"No published tests connected",disabled:true}]}/></div>
   <p className="student-view-empty"><strong>No published results are connected.</strong> Proposed marks above do not enter this leaderboard.</p>
  </section>

  <section className="directory academic-leaderboards" aria-labelledby="weekly-leaderboard-title">
   <header className="directory-heading"><div><h2 id="weekly-leaderboard-title">Weekly leaderboard</h2><p className="section-footnote">Scoring rule: average percentage across the same complete set of published tests.</p></div></header>
   <div className="academic-fields academic-filter-fields"><ChoiceSelect label="Batch" value={weeklyBatch} onChange={setWeeklyBatch} options={[{value:"all-demo",label:"All demo batches · fictional only"},...batches.map(value=>({value,label:value}))]}/><DatePicker label="Week starting" value={weekStart} onChange={setWeekStart} max={localToday()} showToday={false}/></div>
   <p className="student-view-empty"><strong>{weeklyPreview.reason}</strong> Absent students are excluded; tied averages share a rank. Rankings are unavailable until published results are connected.</p>
  </section>
 </div>;
}
