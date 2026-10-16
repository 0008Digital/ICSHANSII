"use client";
import { useMemo, useState } from "react";
import { ChoiceSelect } from "../choice-select";
import { DatePicker } from "../date-picker";
import { GlassSurface } from "../glass";
import { DisclosureSummary } from "../disclosure-summary";
import { localToday } from "../date-only.mjs";
import { batches, defaultBatches, enrollmentSnapshotFor, students } from "./model";
import { validateBatchPeriod, validateCustomBatch } from "./lifecycle.mjs";

const schedules = batches.map((name, index) => ({ name, type: defaultBatches.includes(name as typeof defaultBatches[number]) ? name.startsWith("New") ? "NEW" : "OLD" : "Custom", startDate: ["2026-01-01", "2025-08-01", "2026-09-01", "2025-06-01", "2026-10-01"][index], endDate: ["2026-12-31", "2026-10-31", "2026-10-31", "2026-08-31", "2027-03-31"][index], capacity: "Not configured" }));
const dayMs = 86400000;
function durationLabel(start: string, end: string) {
 const from = Date.parse(`${start}T00:00:00Z`), to = Date.parse(`${end}T00:00:00Z`);
 return Number.isFinite(from) && Number.isFinite(to) && to >= from ? `${Math.floor((to - from) / dayMs) + 1} days` : "—";
}

export function BatchManagement() {
 const [selected, setSelected] = useState(schedules[0].name);
 const [start, setStart] = useState(schedules[0].startDate);
 const [end, setEnd] = useState(schedules[0].endDate);
 const [message, setMessage] = useState("");
 const [customName,setCustomName]=useState(""),[customType,setCustomType]=useState("NEW"),[customStart,setCustomStart]=useState("2026-10-13"),[customEnd,setCustomEnd]=useState("2027-10-12"),[capacity,setCapacity]=useState(""),[customPreview,setCustomPreview]=useState(false);
 const current = schedules.find(batch => batch.name === selected)!;
 const validity = validateBatchPeriod(start, end);
 const counts = useMemo(() => {
  const members = students.filter(student => student.batch === current.name);
  return { active: members.filter(student => ["Active","Expiring Soon"].includes(enrollmentSnapshotFor(student.id, localToday()).status)).length, expiring: members.filter(student => enrollmentSnapshotFor(student.id, localToday()).status === "Expiring Soon").length, completed: members.filter(student => enrollmentSnapshotFor(student.id, localToday()).status === "Completed").length };
 }, [current.name]);
 const today=localToday(),batchStatus=today<current.startDate?"Upcoming":today>current.endDate?"Completed":"Active";
 return <div className="lifecycle-page">
  <p className="demo-banner"><strong>DEMO DATA</strong> Sample batches only. Changes are not saved.</p>
  <section className="directory batch-management" aria-labelledby="batch-catalog-title">
   <header className="directory-heading"><div><h2 id="batch-catalog-title">Batch catalogue</h2><p className="section-footnote">Sample batch catalogue.</p></div><span className="quiet-label">Preview only</span></header>
   <div className="batch-preview-picker"><ChoiceSelect label="Batch" value={selected} onChange={name=>{const item=schedules.find(batch=>batch.name===name)!;setSelected(name);setStart(item.startDate);setEnd(item.endDate);setMessage("");}} options={schedules.map(batch=>({value:batch.name,label:batch.name}))}/></div>
   <div className="batch-facts"><div><span>Batch type</span><strong>{current.type}</strong></div><div><span>Batch status</span><strong>{batchStatus} · demo schedule</strong></div><div><span>Scheduled start</span><strong>{current.startDate}</strong></div><div><span>Scheduled end</span><strong>{current.endDate}</strong></div><div><span>Duration</span><strong>{durationLabel(current.startDate,current.endDate)}</strong></div><div><span>Capacity</span><strong>{current.capacity}</strong></div><div><span>Assigned teachers</span><strong>Not configured</strong></div><div><span>Active demo enrollments</span><strong>{counts.active}</strong></div><div><span>Expiring demo enrollments</span><strong>{counts.expiring}</strong></div><div><span>Completed demo enrollments</span><strong>{counts.completed}</strong></div></div>
  </section>
  <section className="directory batch-date-preview" aria-labelledby="batch-date-title"><header className="directory-heading"><div><h2 id="batch-date-title">Preview date changes</h2><p className="section-footnote">Batch dates do not change student enrollment periods.</p></div></header>
   <div className="batch-date-fields"><DatePicker label="Scheduled start date" value={start} onChange={setStart} max="2100-12-31" showToday={false}/><DatePicker label="Scheduled end date" value={end} onChange={setEnd} min={start} max="2100-12-31" showToday={false}/><div className="batch-duration"><span>Preview duration</span><strong>{validity.valid ? durationLabel(start,end) : "—"}</strong></div></div>
   {!validity.valid&&<p className="field-error" role="alert">{validity.error}</p>}
   <div className="form-actions"><button className="primary-link" type="button" disabled={!validity.valid} onClick={()=>setMessage("Date preview checked. No batch dates were saved or historical enrollments changed.")}>Validate preview</button><button className="secondary-button" type="button" onClick={()=>{setStart(current.startDate);setEnd(current.endDate);setMessage("");}}>Reset</button></div>
   {message&&<p className="section-footnote" role="status">{message}</p>}
  </section>
  <details className="directory custom-batch-preview"><DisclosureSummary>Preview a custom batch</DisclosureSummary><div className="custom-batch-form"><p className="section-footnote">Choose NEW or OLD for registration numbering. This preview does not create a batch.</p><div className="form-grid"><label>Batch name<input value={customName} maxLength={80} onChange={event=>{setCustomName(event.currentTarget.value);setCustomPreview(false);}} aria-invalid={!!validateCustomBatch({name:customName,startDate:customStart,endDate:customEnd,capacity}).name}/></label><ChoiceSelect label="Registration group" value={customType} onChange={setCustomType} options={[{value:"NEW",label:"NEW"},{value:"OLD",label:"OLD"}]}/><DatePicker label="Start date" value={customStart} onChange={value=>{setCustomStart(value);setCustomPreview(false);}} max="2100-12-31" showToday={false}/><DatePicker label="End date" value={customEnd} onChange={value=>{setCustomEnd(value);setCustomPreview(false);}} min={customStart} max="2100-12-31" showToday={false}/><label>Capacity (optional)<input inputMode="numeric" value={capacity} onChange={event=>{setCapacity(event.currentTarget.value);setCustomPreview(false);}} aria-invalid={!!validateCustomBatch({name:customName,startDate:customStart,endDate:customEnd,capacity}).capacity}/></label></div><div className="form-actions"><button className="primary-link" type="button" disabled={Object.keys(validateCustomBatch({name:customName,startDate:customStart,endDate:customEnd,capacity})).length>0} onClick={()=>setCustomPreview(true)}>Preview custom batch</button></div>{customPreview&&<p className="renewal-preview" role="status"><strong>UNSAVED BATCH PREVIEW</strong>{customName.trim()} · {customType} · {customStart} to {customEnd} · {durationLabel(customStart,customEnd)} · capacity {capacity||"not set"}. Teachers are not assigned. No batch or student records were created.</p>}</div></details>
  <GlassSurface as="section" className="backend-note"><p>Assignments and batch updates are unavailable until centre records and permissions are connected.</p></GlassSurface>
 </div>;
}
