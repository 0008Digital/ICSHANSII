"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ChoiceSelect } from "../choice-select";
import { DatePicker } from "../date-picker";
import { localToday, displayDate } from "../date-only.mjs";
import { Button } from "@/vendor/open-glass-ui/dist/index.js";
import { batches, validateAdmission, validateDetails, parseMoneyMinor, formatMoneyMinor, admissionPaymentFieldState, type AdmissionDraft, type DemoStudent } from "./model";
import { renewalDueDateForDuration, enrollmentEndForDuration } from "./lifecycle.mjs";

type Errors=Partial<Record<keyof AdmissionDraft,string>>;
const paymentModes=["Cash","UPI","Bank Transfer","Card","Other"] as const;
const durationOptions=[{value:"1",label:"1 month"},{value:"2",label:"2 months"},{value:"3",label:"3 months"},{value:"6",label:"6 months"},{value:"12",label:"12 months"},{value:"custom",label:"Custom duration"}];
const detailFields=[
 {key:"name",label:"Student Full Name",required:true,max:100},
 {key:"fatherName",label:"Father's Name",required:true,max:100},
 {key:"motherName",label:"Mother's Name",required:true,max:100},
 {key:"guardianPhone",label:"Parent / Guardian Phone Number",required:true,max:10},
] as const;

function initialDraft(student?:DemoStudent):AdmissionDraft{
 return {name:student?.name??"",fatherName:student?.fatherName??"",motherName:student?.motherName??"",guardianPhone:student?.guardianPhone??"",studentPhone:student?.studentPhone??"",address:student?.address??"",batch:student?.batch??"",birthDate:"",admissionDate:"",paperRegistrationNumber:"",batchDuration:"3",customDurationMonths:"",totalFees:"",amountPaid:"0",paymentMethod:"",paymentDate:"",paymentReference:"",promisedPaymentDate:"",promiseDateRequested:false,status:student?.status??"Pending"};
}

function Field({field,value,error,change}:{field:(typeof detailFields)[number];value:AdmissionDraft;error?:string;change:(key:keyof AdmissionDraft,value:string)=>void}){
 return <label className={field.key==="guardianPhone"?"form-wide":""} htmlFor={field.key}>
  <span>{field.label}{field.required&&<span className="required-mark" aria-hidden="true"> *</span>}</span>
  <input id={field.key} name={field.key} aria-label={field.label} type={field.key==="guardianPhone"?"tel":"text"} required={field.required} maxLength={field.max} autoComplete="off" value={value[field.key]} onChange={event=>change(field.key,event.currentTarget.value)} aria-invalid={!!error} aria-describedby={error?`${field.key}-error`:undefined}/>
  {error&&<span id={`${field.key}-error`} className="field-error">{error}</span>}
 </label>;
}

function AdmissionPreview({draft}:{draft:AdmissionDraft}){
 const total=parseMoneyMinor(draft.totalFees??"")??0;
 const paid=parseMoneyMinor(draft.amountPaid??"")??0;
 const due=renewalDueDateForDuration(draft.admissionDate??"",draft.batchDuration==="custom"?Number(draft.customDurationMonths):Number(draft.batchDuration));
 const lastDay=due?enrollmentEndForDuration(draft.admissionDate??"",draft.batchDuration==="custom"?Number(draft.customDurationMonths):Number(draft.batchDuration)):"";
 return <section className="entry-preview fee-admission-preview" aria-label="Unsaved admission and payment preview">
  <h2>Admission preview</h2><p role="status">DEMO PREVIEW · Nothing is saved. No payment is confirmed, receipt issued or ledger entry created.</p>
  <dl className="details-list">
   <div><dt>Student</dt><dd>{draft.name}</dd></div><div><dt>Registration Number</dt><dd>{draft.paperRegistrationNumber}</dd></div>
   <div><dt>Batch</dt><dd>{draft.batch}</dd></div><div><dt>Admission date</dt><dd>{displayDate(draft.admissionDate??"")}</dd></div>
   <div><dt>Enrollment period ends</dt><dd>{displayDate(lastDay)}</dd></div><div><dt>Renewal due date</dt><dd>{displayDate(due)}</dd></div>
   <div><dt>Total Fees</dt><dd>{formatMoneyMinor(total)}</dd></div><div><dt>Amount Paid</dt><dd>{formatMoneyMinor(paid)} · unconfirmed note</dd></div>
   <div><dt>Remaining Fees</dt><dd>{formatMoneyMinor(Math.max(0,total-paid))}</dd></div>
   <div><dt>Payment mode / reference</dt><dd>{paid?`${draft.paymentMethod||"Not selected"} · ${draft.paymentReference||"No reference"}`:"No payment noted"}</dd></div>
   <div><dt>Payment date</dt><dd>{paid?displayDate(draft.paymentDate??""):"Not applicable"}</dd></div>
   {total>paid&&draft.promisedPaymentDate&&<div><dt>Promised Payment Date</dt><dd>{displayDate(draft.promisedPaymentDate)}</dd></div>}
   <div><dt>Permanent Student ID</dt><dd>Not issued · trusted backend allocation required</dd></div>
  </dl>
 </section>;
}

export function StudentForm({student,onClose}:{student?:DemoStudent;onClose?:()=>void}){
 const [value,setValue]=useState<AdmissionDraft>(()=>initialDraft(student));
 const [dirty,setDirty]=useState(false);
 const [errors,setErrors]=useState<Errors>({});
 const [preview,setPreview]=useState<AdmissionDraft|null>(null);
 const [dateTouched,setDateTouched]=useState({admissionDate:false,paymentDate:false});
 const [promiseOpen,setPromiseOpen]=useState(false);
 const today=useSyncExternalStore(subscribeToDateFocus,localToday,()=>"");
 const summary=useRef<HTMLDivElement>(null);
 const admissionDate=value.admissionDate||(!dateTouched.admissionDate?today:"");
 const paymentDate=value.paymentDate||(!dateTouched.paymentDate?today:"");
 const change=(key:keyof AdmissionDraft,next:string)=>{setValue(current=>({...current,[key]:next}));setDirty(true);setPreview(null);setErrors(current=>({...current,[key]:undefined}));};
 const changeDate=(key:"admissionDate"|"paymentDate",next:string)=>{setDateTouched(current=>({...current,[key]:true}));change(key,next);};
 const duration=value.batchDuration==="custom"?Number(value.customDurationMonths):Number(value.batchDuration);
 const renewalDue=admissionDate&&Number.isInteger(duration)&&duration>0?renewalDueDateForDuration(admissionDate,duration):"";
 const total=parseMoneyMinor(value.totalFees??"");const paid=parseMoneyMinor(value.amountPaid??"");const paymentFieldState=admissionPaymentFieldState(value.amountPaid??"0");
 const remaining=total!==null&&paid!==null&&paid<=total?total-paid:null;
 function cancel(){if(dirty&&!window.confirm("Discard your unsaved changes?"))return;if(onClose)onClose();}
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const draft={...value,admissionDate,paymentDate};
  const next=student?validateDetails(draft):validateAdmission(draft);setErrors(next);
  if(Object.keys(next).length){setPreview(null);for(const key of Object.keys(next)){document.getElementById(key)?.focus();}requestAnimationFrame(()=>summary.current?.focus());return;}
  setPreview(draft);
 }
 const dateMax=today||"2100-12-31";
 return <>
  <p className="form-notice">Demo preview — admission is not saved.</p>
  <form className="student-form admission-compact-form" data-dirty={dirty?"true":"false"} onSubmit={submit} noValidate>
   {Object.values(errors).some(Boolean)&&<div ref={summary} className="error-summary" role="alert" tabIndex={-1}><h2>Check the highlighted details</h2><ul>{Object.entries(errors).filter(([,error])=>error).map(([key,error])=><li key={key}><a href={`#${key}`}>{error}</a></li>)}</ul></div>}
   <div className="admission-field-grid">
    <Field field={detailFields[0]} value={value} error={errors.name} change={change}/>
    {!student&&<label htmlFor="paperRegistrationNumber"><span>Registration Number<span className="required-mark" aria-hidden="true"> *</span></span><input id="paperRegistrationNumber" required maxLength={40} value={value.paperRegistrationNumber??""} onChange={event=>change("paperRegistrationNumber",event.currentTarget.value)} aria-invalid={!!errors.paperRegistrationNumber} aria-describedby={errors.paperRegistrationNumber?"registration-error":undefined}/>{errors.paperRegistrationNumber&&<span id="registration-error" className="field-error">{errors.paperRegistrationNumber}</span>}</label>}
    {!student&&<>
     <ChoiceSelect id="batch" label="Admission Batch" required value={value.batch} onChange={next=>change("batch",next)} error={errors.batch} options={[{value:"",label:"Choose a batch"},...batches.map(option=>({value:option,label:option}))]}/>
     <div><ChoiceSelect label="Batch Duration" required value={value.batchDuration??""} onChange={next=>change("batchDuration",next)} error={errors.batchDuration} options={durationOptions}/>{value.batchDuration==="custom"&&<label className="custom-duration-field">Custom duration (months)<input id="customDurationMonths" inputMode="numeric" min="1" max="120" value={value.customDurationMonths??""} onChange={event=>change("customDurationMonths",event.currentTarget.value)} aria-invalid={!!errors.customDurationMonths}/>{errors.customDurationMonths&&<span className="field-error">{errors.customDurationMonths}</span>}</label>}</div>
     <div className="form-date-row"><DatePicker id="admissionDate" label="Admission Date" required min="1900-01-01" value={admissionDate} onChange={next=>changeDate("admissionDate",next)} max={dateMax} error={errors.admissionDate}/></div>
     <label className="readonly-date-field">Renewal Due Date<input aria-label="Renewal Due Date" readOnly value={displayDate(renewalDue)||"Choose date and duration"}/><small>Period ends {displayDate(renewalDue?enrollmentEndForDuration(admissionDate,duration):"")||"—"}</small></label>
    </>}
    <Field field={detailFields[1]} value={value} error={errors.fatherName} change={change}/>
    <Field field={detailFields[2]} value={value} error={errors.motherName} change={change}/>
    <Field field={detailFields[3]} value={value} error={errors.guardianPhone} change={change}/>
    {student&&<label>Student&apos;s Personal Phone (Optional)<input type="tel" maxLength={10} value={value.studentPhone} onChange={event=>change("studentPhone",event.currentTarget.value)} aria-invalid={!!errors.studentPhone}/>{errors.studentPhone&&<span className="field-error">{errors.studentPhone}</span>}</label>}
    {student&&<label className="form-wide">Address<input maxLength={300} value={value.address} onChange={event=>change("address",event.currentTarget.value)}/></label>}
   </div>
   {!student&&<section className="admission-fees-section" aria-labelledby="admission-fees-title">
    <header><h2 id="admission-fees-title">Fees &amp; Payment</h2><span>Unconfirmed admission preview</span></header>
    <div className="admission-field-grid fee-field-grid">
     <label><span>Total Fees<span className="required-mark" aria-hidden="true"> *</span></span><input id="totalFees" inputMode="decimal" value={value.totalFees??""} onChange={event=>change("totalFees",event.currentTarget.value)} aria-invalid={!!errors.totalFees}/>{errors.totalFees&&<span className="field-error">{errors.totalFees}</span>}</label>
     <label>Amount Paid<input id="amountPaid" inputMode="decimal" value={value.amountPaid??"0"} onChange={event=>change("amountPaid",event.currentTarget.value)} aria-invalid={!!errors.amountPaid}/>{errors.amountPaid&&<span className="field-error">{errors.amountPaid}</span>}</label>
     <label>Remaining Fees<input readOnly aria-label="Remaining Fees" value={remaining===null?"—":formatMoneyMinor(remaining)}/></label>
     <ChoiceSelect label="Payment Mode" disabled={paymentFieldState.disabled} required={paymentFieldState.referenceRequired} value={value.paymentMethod??""} onChange={next=>change("paymentMethod",next)} error={errors.paymentMethod} options={[{value:"",label:"Select Payment Mode"},...paymentModes.map(option=>({value:option,label:option}))]}/>
     <label><span>Transaction ID / Payment Reference{value.paymentMethod&&value.paymentMethod!=="Cash"&&paymentFieldState.referenceRequired&&<span className="required-mark" aria-hidden="true"> *</span>}</span><input id="paymentReference" disabled={paymentFieldState.disabled} maxLength={100} value={value.paymentReference??""} onChange={event=>change("paymentReference",event.currentTarget.value)} aria-invalid={!!errors.paymentReference}/>{errors.paymentReference&&<span className="field-error">{errors.paymentReference}</span>}<small>Optional for cash; required for other modes.</small></label>
     <div className="form-date-row"><DatePicker id="paymentDate" label="Payment Date" value={paymentDate} onChange={next=>changeDate("paymentDate",next)} max={dateMax} error={errors.paymentDate} disabled={paymentFieldState.disabled}/></div>
     {remaining!==null&&remaining>0&&<div className="form-wide promise-date-control"><label><input type="checkbox" checked={promiseOpen} onChange={event=>{const checked=event.currentTarget.checked;setPromiseOpen(checked);setValue(current=>({...current,promiseDateRequested:checked,...(!checked?{promisedPaymentDate:""}:{})}));setDirty(true);setPreview(null);if(!checked)setErrors(current=>({...current,promisedPaymentDate:undefined}));}}/>Add a promised payment date</label>{promiseOpen&&<div className="form-date-row"><DatePicker id="promisedPaymentDate" label="Promised Payment Date" required value={value.promisedPaymentDate??""} onChange={next=>change("promisedPaymentDate",next)} min={admissionDate||today||"1900-01-01"} max="2100-12-31" error={errors.promisedPaymentDate}/></div>}</div>}
    </div>
   </section>}
   <p className="section-footnote">Permanent Student ID and batch roll numbers are issued only by trusted backend workflows. Registration Number is manually entered by centre staff. Enrollment expiry and promised payment dates are separate.</p>
   <div className="form-actions"><Button type="submit" variant="primary">{student?"Preview changes":"Review Admission"}</Button>{onClose?<button className="secondary-button" type="button" onClick={cancel}>Cancel</button>:<Link className="text-link" href={student?`/students/${student.id}`:"/students"}>Cancel</Link>}</div>
  </form>
  {preview&&!student&&<AdmissionPreview draft={preview}/>}
  {preview&&student&&<section className="entry-preview" aria-label="Unsaved student details preview"><h2>Changes preview</h2><p role="status">Not saved. No student record was changed.</p><dl className="details-list">{detailFields.map(field=><div key={field.key}><dt>{field.label}</dt><dd>{preview[field.key]||"Not provided"}</dd></div>)}</dl></section>}
 </>;
}

function subscribeToDateFocus(callback:()=>void){
 if(typeof window==="undefined")return ()=>{};
 window.addEventListener("focus",callback);
 return ()=>window.removeEventListener("focus",callback);
}
