"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useAppMotionReduced } from "@/app/providers";
import { GlassSurface } from "./glass";
import { roleLabels, type WorkspaceRole } from "./workspace-roles";
import { validateBugReport } from "./bug-report-model.mjs";
import { lockDocumentScroll } from "./document-scroll-lock.mjs";

type Props = { open: boolean; role: WorkspaceRole; route: string; trigger: HTMLElement | null; onClose: () => void };
function ReportDialogSurface({trigger,onClose,reduced,children}:{trigger:HTMLElement|null;onClose:()=>void;reduced:boolean;children:ReactNode}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const present=useIsPresent();
 useEffect(()=>{const element=dialog.current;if(!element)return;element.showModal();const unlock=lockDocumentScroll(document,window);return()=>{if(element.open)element.close();unlock();if(trigger?.isConnected)trigger.focus({preventScroll:true});};},[trigger]);
 return <dialog ref={dialog} inert={!present} aria-hidden={!present||undefined} className="workspace-dialog bug-report-dialog" aria-labelledby="bug-report-title" onCancel={event=>{event.preventDefault();onClose();}}>
  <motion.div className="workspace-dialog-surface" initial={{opacity:reduced?1:0,y:reduced?0:8}} animate={{opacity:1,y:0}} exit={{opacity:reduced?1:0,y:reduced?0:5}} transition={{duration:reduced?0:.16}}>{children}</motion.div>
 </dialog>;
}
export function BugReportDialog({ open, role, route, trigger, onClose }: Props) {
 const reduced = useAppMotionReduced();
 const [context,setContext]=useState({timestamp:"Only available while previewing",browser:"Not available"});
 const [title,setTitle]=useState("");const [happened,setHappened]=useState("");const [expected,setExpected]=useState("");const [category,setCategory]=useState("Interface");const [steps,setSteps]=useState("");const [attachment,setAttachment]=useState("");const [attachmentError,setAttachmentError]=useState("");const [errors,setErrors]=useState<Record<string,string>>({});const [preview,setPreview]=useState(false);
 function submit(event:FormEvent){event.preventDefault();const next=validateBugReport({title,happened,expected,category,steps}) as unknown as Record<string,string>;setErrors(next);if(Object.keys(next).length)return;const ua=navigator.userAgent;const browser=ua.includes("Firefox")?"Firefox":ua.includes("Edg/")?"Edge":ua.includes("Chrome/")?"Chromium-based browser":ua.includes("Safari/")?"Safari":"Other browser";setContext({timestamp:new Date().toLocaleString(),browser:window.matchMedia("(max-width: 767px)").matches?`Mobile · ${browser}`:`Desktop · ${browser}`});setPreview(true);}
 return <AnimatePresence>{open&&<ReportDialogSurface trigger={trigger} onClose={onClose} reduced={!!reduced}>
   <GlassSurface className="bug-report-panel"><header className="command-title-row"><div><h2 id="bug-report-title">Report a Bug</h2><p>Demo Preview · this report stays in this browser session.</p></div><button type="button" className="icon-button" aria-label="Close bug report" onClick={onClose}>×</button></header>
   <p className="bug-report-notice">No report is sent or saved. Do not include student details, passwords, payment data or other private information.</p>
   {preview?<section className="bug-report-preview" aria-live="polite"><h3>Local report preview</h3><dl><div><dt>Title</dt><dd>{title}</dd></div><div><dt>Category</dt><dd>{category}</dd></div><div><dt>Page</dt><dd>{route}</dd></div><div><dt>Role preview</dt><dd>{roleLabels[role]}</dd></div><div><dt>Application version</dt><dd>0.1.0 demo</dd></div><div><dt>Browser category</dt><dd>{context.browser}</dd></div><div><dt>Timestamp</dt><dd>{context.timestamp}</dd></div><div><dt>Attachment metadata</dt><dd>{attachment||"None"}</dd></div><div><dt>What happened?</dt><dd>{happened}</dd></div><div><dt>Expected</dt><dd>{expected}</dd></div><div><dt>Reproduction steps</dt><dd>{steps||"None"}</dd></div></dl><p>Preview only. It has not reached a developer and has no ticket ID.</p><button type="button" className="secondary-button" onClick={()=>setPreview(false)}>Edit report</button></section>:<form className="bug-report-form" onSubmit={submit}>
    <label>Issue title<input required minLength={4} maxLength={120} value={title} onChange={event=>setTitle(event.target.value)}/>{errors.title&&<small className="field-error">{errors.title}</small>}</label>
    <label>What happened?<textarea required minLength={8} maxLength={2000} rows={3} value={happened} onChange={event=>setHappened(event.target.value)}/>{errors.happened&&<small className="field-error">{errors.happened}</small>}</label>
    <label>What should have happened?<textarea required minLength={8} maxLength={2000} rows={3} value={expected} onChange={event=>setExpected(event.target.value)}/>{errors.expected&&<small className="field-error">{errors.expected}</small>}</label>
    <label>Category<select value={category} onChange={event=>setCategory(event.target.value)}><option>Interface</option><option>Accessibility</option><option>Performance</option><option>Other</option></select></label>
    <label>Reproduction steps (optional)<textarea maxLength={2000} rows={2} value={steps} onChange={event=>setSteps(event.target.value)}/></label>
    <label>Screenshot attachment (optional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{const file=event.target.files?.[0];const problem=validateBugReport({title:"okay",happened:"valid example",expected:"valid example",category,attachment:file?{type:file.type,size:file.size}:null}).attachment??"";setAttachmentError(problem);setAttachment(problem?"":file?`${file.name} · ${file.type} · ${file.size} bytes (metadata only; not uploaded)` : "");}}/>{attachmentError&&<small className="field-error">{attachmentError}</small>}</label>
    <div className="form-actions"><button type="submit" className="primary-link">Preview report</button><button type="button" className="secondary-button" onClick={onClose}>Cancel</button></div>
   </form>}
  </GlassSurface>
 </ReportDialogSurface>}</AnimatePresence>;
}
