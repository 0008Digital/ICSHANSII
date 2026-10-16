"use client";

import { useState } from "react";
import { ChoiceSelect } from "../choice-select";
import { DatePicker } from "../date-picker";
import { DisclosureSummary } from "../disclosure-summary";
import { localToday } from "../date-only.mjs";
import { batches, type DemoStudent } from "./model";

export function TransferRequestPreview({student}:{student:DemoStudent}) {
 const [destination,setDestination]=useState("");
 const [reason,setReason]=useState("");
 const [effectiveDate,setEffectiveDate]=useState("");
 const [preview,setPreview]=useState(false);
 const valid=!!destination&&destination!==student.batch&&reason.trim().length>=10&&!!effectiveDate;
 return <details className="directory profile-workflow-disclosure"><DisclosureSummary>Preview batch transfer</DisclosureSummary><div className="profile-workflow-body">
  <p className="section-footnote">Unsaved request. Centre permission and teacher confirmation may be required; no records change.</p>
  <div className="form-grid">
   <label>Student<input value={`${student.name} · ${student.id}`} readOnly/></label>
   <label>Current batch<input value={student.batch} readOnly/></label>
   <ChoiceSelect label="Destination batch" value={destination} onChange={value=>{setDestination(value);setPreview(false);}} options={[{value:"",label:"Choose a destination"},...batches.filter(value=>value!==student.batch).map(value=>({value,label:value}))]}/>
   <div className="form-date-row"><DatePicker label="Effective date" value={effectiveDate} onChange={value=>{setEffectiveDate(value);setPreview(false);}} min={localToday()} max="2100-12-31" showToday={false}/></div>
   <label className="form-wide">Reason<input value={reason} maxLength={500} onChange={event=>{setReason(event.currentTarget.value);setPreview(false);}} placeholder="Required for this unsaved request preview"/></label>
   <label>Requested by<input value="Current user not configured" readOnly/></label>
  </div>
  <div className="workflow-checks"><span>Destination exists: {destination?"Yes · demo catalogue":"Choose a batch"}</span><span>Active status: Not verified</span><span>Capacity: Not configured</span><span>Conflicting enrollment: Requires backend check</span><span>Centre staff confirmation: Pending · not configured</span><span>Teacher acknowledgment: Pending · required status unknown</span></div>
  <button type="button" className="primary-link" disabled={!valid} onClick={()=>setPreview(true)}>Preview transfer request</button>
  {preview&&<p className="renewal-preview" role="status"><strong>UNSAVED TRANSFER REQUEST</strong>{student.name} · {student.batch} → {destination} · {effectiveDate} · {reason.trim()}. Approval, capacity, teacher confirmation and roll allocation remain unverified; no record was submitted.</p>}
  <p className="section-footnote">Transfers must preserve the Student ID and existing records. This preview submits no transfer.</p>
 </div></details>;
}

export function DisciplineReportPreview({student}:{student:DemoStudent}) {
 const [incidentDate,setIncidentDate]=useState("");
 const [incidentTime,setIncidentTime]=useState("");
 const [category,setCategory]=useState("");
 const [description,setDescription]=useState("");
 const [reporter,setReporter]=useState("");
 const [severity,setSeverity]=useState("Medium");
 const [action,setAction]=useState("");
 const [parentInformed,setParentInformed]=useState("No");
 const [followUp,setFollowUp]=useState("Not started");
 const [resolution,setResolution]=useState("");
 const [preview,setPreview]=useState(false);
 const valid=!!incidentDate&&!!incidentTime&&!!category&&description.trim().length>=10&&reporter.trim().length>=2;
 return <details className="directory profile-workflow-disclosure"><DisclosureSummary>Conduct report · restricted staff workflow</DisclosureSummary><div className="profile-workflow-body">
  <p className="form-notice">Unsaved sample report. Real conduct records require verified centre and teacher permissions; this preview does not grant access.</p>
  <div className="form-grid">
   <div className="form-date-row"><DatePicker label="Incident date" value={incidentDate} onChange={value=>{setIncidentDate(value);setPreview(false);}} max={localToday()} showToday={false}/></div>
   <label>Incident time<input type="time" value={incidentTime} onChange={event=>{setIncidentTime(event.currentTarget.value);setPreview(false);}}/></label>
   <ChoiceSelect label="Category" value={category} onChange={value=>{setCategory(value);setPreview(false);}} options={[{value:"",label:"Choose a category"},...(["Class disruption","Safety concern","Repeated absence","Other"] as const).map(value=>({value,label:value}))]}/>
   <label>Related batch<input value={student.batch} readOnly/></label>
   <label className="form-wide">Description<textarea rows={3} maxLength={1000} value={description} onChange={event=>{setDescription(event.currentTarget.value);setPreview(false);}}/></label>
   <label>Reporting staff member<input maxLength={100} value={reporter} onChange={event=>{setReporter(event.currentTarget.value);setPreview(false);}} placeholder="Fictional name for preview"/></label>
   <ChoiceSelect label="Severity" value={severity} onChange={setSeverity} options={["Low","Medium","High"].map(value=>({value,label:value}))}/>
   <label>Action taken<input maxLength={300} value={action} onChange={event=>{setAction(event.currentTarget.value);setPreview(false);}}/></label>
   <ChoiceSelect label="Parent informed" value={parentInformed} onChange={setParentInformed} options={["No","Yes"].map(value=>({value,label:value}))}/>
   <ChoiceSelect label="Follow-up status" value={followUp} onChange={setFollowUp} options={["Not started","In progress","Resolved"].map(value=>({value,label:value}))}/>
   <label className="form-wide">Resolution notes<input maxLength={500} value={resolution} onChange={event=>{setResolution(event.currentTarget.value);setPreview(false);}}/></label>
  </div>
  <button type="button" className="primary-link" disabled={!valid} onClick={()=>setPreview(true)}>Preview conduct report</button>
  {preview&&<dl className="entry-preview"><div><dt>Student</dt><dd>{student.name} · {student.id} (fictional)</dd></div><div><dt>Incident</dt><dd>{incidentDate} {incidentTime} · {category} · {severity}</dd></div><div><dt>Description</dt><dd>{description.trim()}</dd></div><div><dt>Reported by / batch</dt><dd>{reporter.trim()} · {student.batch}</dd></div><div><dt>Action / parent informed</dt><dd>{action||"Not provided"} · {parentInformed}</dd></div><div><dt>Follow-up / resolution</dt><dd>{followUp} · {resolution||"Not provided"}</dd></div><div><dt>Review history</dt><dd>Not recorded · preview only</dd></div><p role="status">Preview only. No conduct report was saved.</p></dl>}
 </div></details>;
}
