"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ChoiceSelect } from "../choice-select";
import { DatePicker } from "../date-picker";
import { localToday, displayDate } from "../date-only.mjs";
import { batches, formatMoneyMinor, parseMoneyMinor, students } from "./model";
import { daysOverdue, feeStatus, paymentModes, validatePaymentPreview } from "./fee-model.mjs";
import { buildDemoFeeSummaryCsv, buildDemoPaymentHistoryCsv } from "../export-data.mjs";

type FeeView="Pending"|"Expired Fees"|"Paid";
type PaymentDraft={id:number;studentName:string;studentRef:string;enrollmentRef:string;amountMinor:number;paymentDate:string;mode:string;reference:string;promisedDate:string;remainingMinor:number;status:string};
function download(name:string,contents:string){const url=URL.createObjectURL(new Blob([`\uFEFF${contents}`],{type:"text/csv;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download=name;link.click();requestAnimationFrame(()=>URL.revokeObjectURL(url));}

export function FeeManagement(){
 const today=useSyncExternalStore(subscribeToFeeDateFocus,localToday,()=>"");
 const locationSearch=useSyncExternalStore(subscribeToLocationSearch,getLocationSearch,()=>"");
 const requestedStudent=new URLSearchParams(locationSearch).get("student")??"";
 const requestedStudentValid=students.some(item=>item.id===requestedStudent);
 const [view,setView]=useState<FeeView>("Pending");
 const [search,setSearch]=useState("");
 const [batch,setBatch]=useState("");
 const [formOpen,setFormOpen]=useState(false);
 const [dismissedRequestedStudent,setDismissedRequestedStudent]=useState(false);
 const [studentOverride,setStudentOverride]=useState("");
 const [balance,setBalance]=useState("");
 const [amount,setAmount]=useState("");
 const [paymentDateDraft,setPaymentDateDraft]=useState("");
 const [paymentDateTouched,setPaymentDateTouched]=useState(false);
 const [mode,setMode]=useState("");
 const [reference,setReference]=useState("");
 const [promisedDate,setPromisedDate]=useState("");
 const [errors,setErrors]=useState<Record<string,string>>({});
 const [drafts,setDrafts]=useState<PaymentDraft[]>([]);
 const [notice,setNotice]=useState("");
 const studentId=studentOverride||(requestedStudentValid?requestedStudent:"")||students[0]?.id||"";
 const paymentDate=paymentDateDraft||(!paymentDateTouched?today:"");
 const effectiveFormOpen=formOpen||(requestedStudentValid&&!dismissedRequestedStudent);
 const student=students.find(item=>item.id===studentId)??students[0];
 const balanceMinor=parseMoneyMinor(balance);
 const amountMinor=parseMoneyMinor(amount);
 const remaining=balanceMinor!==null&&amountMinor!==null&&amountMinor<=balanceMinor?balanceMinor-amountMinor:null;
 const status=remaining===null?"Unavailable":feeStatus(remaining,promisedDate,today);
 const filtered=useMemo(()=>students.filter(item=>(!batch||item.batch===batch)&&(!search||[item.name,item.id,item.paperRegistrationNumber??"",item.batch].some(value=>value.toLowerCase().includes(search.toLowerCase())))),[batch,search]);
 const previewable=!!student&&!!studentId;
 function resetForm(){setBalance("");setAmount("");setPaymentDateDraft("");setPaymentDateTouched(false);setMode("");setReference("");setPromisedDate("");setErrors({});setNotice("");}
 function previewPayment(){
  const outstanding=parseMoneyMinor(balance),payment=parseMoneyMinor(amount);
  const next:Record<string,string>={...validatePaymentPreview({amountMinor:payment,balanceMinor:outstanding,paymentDate,paymentMode:mode,reference,promisedPaymentDate:promisedDate,today})};
  if(!outstanding)next.balance="Enter a fictional current outstanding balance; no connected fee balance is available.";
  if(payment===null)next.amount="Enter a non-negative amount with up to two decimal places.";
  if(outstanding!==null&&payment!==null&&payment>outstanding)next.amount="Payment cannot exceed the outstanding balance.";
  setErrors(next);
  if(Object.keys(next).length)return;
  const after=outstanding!-payment!;
  const item:PaymentDraft={id:drafts.length+1,studentName:student.name,studentRef:student.id,enrollmentRef:`${student.id} · current enrollment (demo)`,amountMinor:payment!,paymentDate,mode,reference,promisedDate,remainingMinor:after,status:feeStatus(after,promisedDate,today)};
  setDrafts(current=>[...current,item]);
  setBalance(formatMoneyMinor(after).replace(/^₹/,"").replaceAll(",", ""));
  setAmount("");setReference("");setErrors({});
  setNotice(`Unsaved installment preview ${item.id} added to this page session. No payment was confirmed or recorded.`);
 }
 function previewPromise(){
  if(!balanceMinor||balanceMinor<=0){setNotice("Enter a fictional outstanding amount before previewing a payment promise.");return;}
  if(!promisedDate||promisedDate<today){setErrors({promisedDate:"Choose today or a future promised payment date."});return;}
  setErrors({});setNotice(`Unsaved promise-date preview: Pending through ${displayDate(promisedDate)}; Expired Fees begins ${displayDate(new Date(Date.parse(`${promisedDate}T00:00:00Z`)+86400000).toISOString().slice(0,10))} if balance remains. No fee record changed.`);
 }
 function exportSummary(){
  const rows=students.map(item=>({id:item.id,permanentStudentId:item.permanentStudentId,registrationNumber:item.paperRegistrationNumber,batch:item.batch,totalFeeMinor:null,totalPaidMinor:null,remainingMinor:null,promisedPaymentDate:null,status:"Not connected"}));
  download("DEMO-DATA-fee-summary.csv",buildDemoFeeSummaryCsv(rows));
 }
 return <div className="fee-management-workspace">
  <p className="demo-banner"><strong>DEMO PREVIEW</strong> Sample scenarios only. Balances, payments and receipts are not connected.</p>
  <section className="directory fee-register" aria-labelledby="fee-register-title">
   <header className="directory-heading"><div><h2 id="fee-register-title">Fee register</h2><p>Fee status follows promised payment dates, independently of enrollment expiry.</p></div><button type="button" className="primary-link" onClick={()=>{if(requestedStudentValid&&effectiveFormOpen)setDismissedRequestedStudent(true);else setFormOpen(value=>!value);setNotice("");}}> {effectiveFormOpen?"Close preview":"Preview Collect Fee"}</button></header>
   <div className="fee-status-tabs" role="group" aria-label="Fee status view">{(["Pending","Expired Fees","Paid"] as const).map(item=><button key={item} type="button" aria-pressed={view===item} onClick={()=>setView(item)}>{item}<small>0 connected</small></button>)}</div>
   <div className="directory-toolbar fee-filters"><label>Search fees<input type="search" value={search} onChange={event=>setSearch(event.currentTarget.value)} placeholder="Name, student ID, registration number or batch"/></label><ChoiceSelect label="Batch" value={batch} onChange={setBatch} options={[{value:"",label:"All batches"},...batches.map(value=>({value,label:value}))]}/></div>
   <ul className="fee-student-preview-list" aria-label="Matching fictional students">{filtered.map(item=><li key={item.id}><span><strong>{item.name}</strong><small>{item.id} · {item.paperRegistrationNumber||"Registration Number unavailable"} · {item.batch}</small></span><button type="button" className="secondary-button" aria-pressed={studentId===item.id} onClick={()=>{setStudentOverride(item.id);setDrafts([]);resetForm();}}>{studentId===item.id?"Selected":"Select"}</button></li>)}</ul>
   <div className="fee-empty-state"><strong>No connected {view.toLowerCase()} fee records</strong><p>Search sample students above. Real fees and balances are not connected.</p></div>
   {effectiveFormOpen&&<section className="fee-preview-form" aria-labelledby="collect-fee-preview-title">
    <header><div><h3 id="collect-fee-preview-title">Collect Fee · unsaved preview</h3><p>No transaction is confirmed, receipt issued or ledger updated.</p></div></header>
    <div className="admission-field-grid fee-collect-grid">
     <ChoiceSelect label="Student" value={studentId} onChange={value=>{setStudentOverride(value);setDrafts([]);resetForm();}} options={students.map(item=>({value:item.id,label:`${item.name} · ${item.batch}`}))}/>
     <label>Enrollment / fee obligation reference<input readOnly value={student?`${student.id} · current enrollment (fictional)`:"Not connected"}/></label>
     <label>Current outstanding balance (fictional scenario)<input inputMode="decimal" value={balance} onChange={event=>{setBalance(event.currentTarget.value);setErrors(current=>({...current,balance:""}));}} aria-invalid={!!errors.balance}/>{errors.balance&&<small className="field-error">{errors.balance}</small>}</label>
     <label>Amount to preview<input inputMode="decimal" value={amount} onChange={event=>{setAmount(event.currentTarget.value);setErrors(current=>({...current,amount:""}));}} aria-invalid={!!errors.amount}/>{errors.amount&&<small className="field-error">{errors.amount}</small>}</label>
     <ChoiceSelect label="Payment Mode" value={mode} onChange={setMode} error={errors.paymentMode} options={[{value:"",label:"Choose payment mode"},...paymentModes.map(value=>({value,label:value}))]}/>
     <label>Transaction ID / Payment Reference{mode&&mode!=="Cash"&&<span className="required-mark" aria-hidden="true"> *</span>}<input maxLength={100} value={reference} onChange={event=>setReference(event.currentTarget.value)} aria-invalid={!!errors.reference}/>{errors.reference&&<small className="field-error">{errors.reference}</small>}<small>Optional for cash; required for other modes.</small></label>
     <div className="form-date-row"><DatePicker label="Payment Date" value={paymentDate} onChange={value=>{setPaymentDateTouched(true);setPaymentDateDraft(value);}} max={today}/></div>
     <div className="form-date-row"><DatePicker label="Promised Payment Date (optional)" value={promisedDate} onChange={value=>{setPromisedDate(value);setErrors(current=>({...current,promisedDate:""}));}} min={today} max="2100-12-31" error={errors.promisedDate}/></div>
     <label>Remaining Fees after preview<input readOnly value={remaining===null?"Enter valid amounts":formatMoneyMinor(remaining)}/></label>
     <label>Fee status after preview<input readOnly value={status}/></label>
    </div>
    <div className="form-actions"><button className="primary-link" type="button" onClick={previewPayment} disabled={!previewable}>Preview installment</button><button className="secondary-button" type="button" onClick={previewPromise}>Preview promised-date update</button><button className="secondary-button" type="button" onClick={()=>{setDrafts([]);resetForm();}}>Reset preview</button></div>
    {notice&&<p role="status" className="fee-preview-status">{notice}</p>}
    {drafts.length>0&&<div className="fee-draft-history"><h4>Unsaved installment previews</h4><ol>{drafts.map(item=><li key={item.id}><strong>Draft {item.id} · {item.studentName}</strong><span>{formatMoneyMinor(item.amountMinor)} · {displayDate(item.paymentDate)} · {item.mode}</span><span>Remaining {formatMoneyMinor(item.remainingMinor)} · {item.status}</span>{item.status==="Expired Fees"&&<small>{daysOverdue(item.promisedDate,today)} days overdue</small>}<small>{item.reference?`Reference ${item.reference}`:"No transaction reference"} · no receipt issued</small></li>)}</ol><p>Draft installments clear on refresh.</p></div>}
   </section>}
   <div className="fee-export-actions"><button type="button" className="secondary-button" onClick={exportSummary}>Export fee summary · DEMO CSV</button><button type="button" className="secondary-button" onClick={()=>download("DEMO-DATA-payment-history.csv",buildDemoPaymentHistoryCsv([]))}>Export payment history · DEMO CSV</button><span>Summary rows show “Not connected”; payment-history export has no transaction rows.</span></div>
   <p className="section-footnote">Preview only. No installment is posted and no receipt is issued.</p>
  </section>
 </div>;
}

function subscribeToFeeDateFocus(callback:()=>void){
 if(typeof window==="undefined")return ()=>{};
 window.addEventListener("focus",callback);
 return ()=>window.removeEventListener("focus",callback);
}

function subscribeToLocationSearch(callback:()=>void){
 if(typeof window==="undefined")return ()=>{};
 window.addEventListener("popstate",callback);
 window.addEventListener("hashchange",callback);
 return ()=>{window.removeEventListener("popstate",callback);window.removeEventListener("hashchange",callback);};
}

function getLocationSearch(){
 return typeof window==="undefined"?"":window.location.search;
}
