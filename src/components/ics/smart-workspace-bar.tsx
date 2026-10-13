"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useBranding } from "./branding/branding-provider";
import { GlassSurface } from "./glass";
import { Icon } from "./icon";
import { exportChoices, roleLabels, workspaceCommands, type WorkspaceRole } from "./workspace-roles";
import { batches, statuses, students } from "./students/model";
import { buildDemoEnrollmentCsv, buildDemoStudentCsv } from "./export-data.mjs";
import { ChoiceSelect } from "./choice-select";
import { enrollmentSnapshotFor } from "./students/model";
import { demoEnrollmentByStudent } from "./students/lifecycle.mjs";
import { localToday } from "./date-only.mjs";
import { demoAuditEvents, buildDemoAuditCsv } from "./audit-data.mjs";
import { demoLedgerEntries, buildDemoLedgerCsv, buildDemoLedgerSummaryCsv } from "./ledger-data.mjs";
import { useWorkspaceRolePreview } from "./workspace-role-preview";
import { DEMO_IDENTITIES, roleForDemoIdentity, workspaceRoleLanding, type DemoIdentityId } from "./workspace-role-model";
import { BugReportDialog } from "./bug-report";
import { useAppMotionReduced } from "@/app/providers";
import { lockDocumentScroll } from "./document-scroll-lock.mjs";

const noSubscribe=()=>()=>{};
const clientReady=()=>true;
const serverReady=()=>false;
type Command={id:string;label:string;description:string;icon:string;href:string;kind:"route"|"action"};

function CommandPalette({role,onClose,trigger}:{role:WorkspaceRole;onClose:()=>void;trigger:HTMLElement|null}) {
 const router=useRouter();
 const reduced=useAppMotionReduced();
 const [query,setQuery]=useState("");
 const [active,setActive]=useState(0);
 const input=useRef<HTMLInputElement>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const commands=useMemo(()=>workspaceCommands(role),[role]);
 const results=useMemo(()=>{const term=query.trim().toLocaleLowerCase();return commands.filter(command=>!term||`${command.label} ${command.description}`.toLocaleLowerCase().includes(term));},[commands,query]);
 useEffect(()=>{if(results[active])document.getElementById(`command-${results[active].id}`)?.scrollIntoView({block:"nearest",inline:"nearest"});},[active,results]);
 useEffect(()=>{const element=dialog.current;if(!element)return;element.showModal();const unlock=lockDocumentScroll(document,window);input.current?.focus();return()=>{if(element.open)element.close();unlock();if(trigger?.isConnected)trigger.focus({preventScroll:true});};},[trigger]);
 function onKeyDown(event:KeyboardEvent<HTMLInputElement>){
  if(event.key==="ArrowDown"){event.preventDefault();setActive(current=>results.length?(current+1)%results.length:0);}
  if(event.key==="ArrowUp"){event.preventDefault();setActive(current=>results.length?(current-1+results.length)%results.length:0);}
  if(event.key==="Home"&&results.length){event.preventDefault();setActive(0);}
  if(event.key==="End"&&results.length){event.preventDefault();setActive(results.length-1);}
  if(event.key==="Enter"&&results[active]){event.preventDefault();router.push(results[active].href);onClose();}
 }
 return <dialog ref={dialog} className="workspace-dialog command-dialog" aria-labelledby="command-title" onCancel={event=>{event.preventDefault();onClose();}}>
   <motion.div className="workspace-dialog-surface" initial={{opacity:reduced?1:0,y:reduced?0:8,scale:reduced?1:.99}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:reduced?1:0,y:reduced?0:5}} transition={{duration:reduced?0:.16,ease:[.22,1,.36,1]}}>
   <GlassSurface className="command-panel">
    <div className="command-title-row"><div><h2 id="command-title">Search workspace</h2><p>Pages and actions available for {roleLabels[role]}.</p></div><button type="button" className="icon-button" aria-label="Close search" onClick={onClose}>×</button></div>
    <label className="command-search"><Icon name="search"/><span className="sr-only">Search pages and actions</span><input ref={input} role="combobox" aria-expanded="true" aria-controls="command-results" aria-activedescendant={results[active]?`command-${results[active].id}`:undefined} value={query} onChange={event=>{setQuery(event.currentTarget.value);setActive(0);}} onKeyDown={onKeyDown} placeholder="Search pages and actions…"/><kbd>Esc</kbd></label>
    <div id="command-results" className="command-results" role="listbox" aria-label="Search results">
     {results.length?results.map((command,index)=><Link id={`command-${command.id}`} key={command.id} role="option" aria-selected={active===index} href={command.href} onMouseEnter={()=>setActive(index)} onClick={onClose}><Icon name={command.icon}/><span><strong>{command.label}</strong><small>{command.description}</small></span><span className="command-result-kind">{command.kind==="action"?"Action":"Page"}</span></Link>):<p className="command-empty">No matching pages or actions.</p>}
    </div>
    <p className="command-footer"><span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span></p>
   </GlassSurface>
  </motion.div>
 </dialog>;
}

function ExportCentre({role,onClose,trigger}:{role:WorkspaceRole;onClose:()=>void;trigger:HTMLElement|null}) {
 const reduced=useAppMotionReduced();
 const choices=useMemo(()=>exportChoices(role),[role]);
 const first=choices.find(item=>item.enabled)??choices[0];
 const [choiceId,setChoiceId]=useState(first?.id??"");
 const [batch,setBatch]=useState("");
 const [status,setStatus]=useState("");
 const [message,setMessage]=useState("");
 const dialog=useRef<HTMLDialogElement>(null);
 const choice=choices.find(item=>item.id===choiceId);
 const selectedStudents=students.filter(student=>(!batch||student.batch===batch)&&(!status||student.status===status));
 const selectedEnrollments=selectedStudents.flatMap(student=>{const enrollment=demoEnrollmentByStudent[student.id as keyof typeof demoEnrollmentByStudent];return enrollment?[{student,enrollment,snapshot:enrollmentSnapshotFor(student.id,localToday())}]:[];});
 useEffect(()=>{const element=dialog.current;if(!element)return;element.showModal();const unlock=lockDocumentScroll(document,window);return()=>{if(element.open)element.close();unlock();if(trigger?.isConnected)trigger.focus({preventScroll:true});};},[trigger]);
 function downloadReport(){
  const roleAllows=role==="admin"||(role==="manager"&&["student-directory","batch-lists"].includes(choice?.id??""));
  if(!roleAllows||!choice?.enabled){setMessage(choice?.reason??"This report is not available for this role.");return;}
  let content="";
  if(["student-directory","batch-lists"].includes(choice.id))content=buildDemoStudentCsv(selectedStudents);
  else if(choice.id==="enrollment-expiry")content=buildDemoEnrollmentCsv(selectedEnrollments);
  else if(choice.id==="audit-log")content=buildDemoAuditCsv(demoAuditEvents);
  else if(choice.id==="ledger-transactions")content=buildDemoLedgerCsv(demoLedgerEntries);
  else if(["income-statement","expense-report","payment-method-summary"].includes(choice.id))content=buildDemoLedgerSummaryCsv(demoLedgerEntries,choice.id);
  else {setMessage(choice.reason??"No valid demo data is available for this report.");return;}
  const url=URL.createObjectURL(new Blob([`\uFEFF${content}`],{type:"text/csv;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download=`DEMO-DATA-${choice.id}-${new Date().toISOString().slice(0,10)}.csv`;link.click();requestAnimationFrame(()=>URL.revokeObjectURL(url));
  setMessage(`Fictional ${choice.label} exported. The file is clearly marked DEMO DATA.`);
 }
 return <dialog ref={dialog} className="workspace-dialog export-dialog" aria-labelledby="export-title" onCancel={event=>{event.preventDefault();onClose();}}>
   <motion.div className="workspace-dialog-surface" initial={{opacity:reduced?1:0,y:reduced?0:8,scale:reduced?1:.99}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:reduced?1:0,y:reduced?0:5}} transition={{duration:reduced?0:.16,ease:[.22,1,.36,1]}}>
   <GlassSurface className="export-panel">
    <header className="command-title-row"><div><h2 id="export-title">Export Centre</h2><p>{roleLabels[role]} · local demo preview only</p></div><button type="button" className="icon-button" aria-label="Close Export Centre" onClick={onClose}>×</button></header>
    <p className="export-demo-notice"><strong>DEMO DATA</strong> Exports contain fictional preview records only. No institutional data or backend is connected.</p>
    {choices.length===0?<p className="command-empty">Administrative export is unavailable for this workspace role.</p>:<>
     <div className="export-field"><ChoiceSelect label="Report type" value={choiceId} onChange={value=>{setChoiceId(value);setMessage("");}} options={choices.map(item=>({value:item.id,label:`${item.label}${!item.enabled?" · unavailable":""}`,disabled:!item.enabled}))}/></div>
     {choice?.filter.includes("batch")&&<div className="export-field"><ChoiceSelect label="Batch" value={batch} onChange={setBatch} options={[{value:"",label:"All demo batches"},...batches.map(name=>({value:name,label:name}))]}/></div>}
     {choice?.filter==="batch-status"&&<div className="export-field"><ChoiceSelect label="Student status" value={status} onChange={setStatus} options={[{value:"",label:"All statuses"},...statuses.map(value=>({value,label:value}))]}/></div>}
     {choice?.filter==="date-batch"&&<fieldset className="export-date-range" disabled><legend>Date range</legend><label>From<input type="date" disabled/></label><label>To<input type="date" disabled/></label><small>Date-filtered records are unavailable until the authorized backend is connected.</small></fieldset>}
     <div className="export-formats"><span>File format</span><button type="button" className="primary-link" disabled={!choice?.enabled} onClick={downloadReport}>Download CSV</button><button type="button" disabled aria-describedby="export-format-note">Excel (.xlsx)</button><button type="button" disabled aria-describedby="export-format-note">PDF</button><small id="export-format-note">Excel and PDF are unavailable in this demo build.</small></div>
     {choice&&!choice.enabled&&<p className="export-unavailable">{choice.reason}</p>}
     {role==="manager"&&<p className="export-unavailable">Real Manager exports require verified centre grants. This demo CSV contains only fictional local fixtures.</p>}
     {role==="teacher"&&<p className="export-unavailable">Teacher exports require server-verified batch assignments. Financial and unrelated-centre exports are not offered.</p>}
     {message&&<p role="status" className="export-status">{message}</p>}
     {choice?.enabled&&<p className="export-summary">{choice.id==="audit-log"?`${demoAuditEvents.length} fictional events`:choice.id.startsWith("ledger-")||["income-statement","expense-report","payment-method-summary"].includes(choice.id)?`${demoLedgerEntries.length} fictional transactions`:choice.id==="enrollment-expiry"?`${selectedEnrollments.length} fictional enrollment previews`:`${selectedStudents.length} fictional demo records`} · DEMO DATA only</p>}
    </>}
   </GlassSurface>
  </motion.div>
 </dialog>;
}

export function SmartWorkspaceBar({role,platform,name,branch,logoUrl,initials}:{role:WorkspaceRole;platform:boolean;name:string;branch:string;logoUrl:string;initials:string}) {
 const reduced=useAppMotionReduced();
 const ready=useSyncExternalStore(noSubscribe,clientReady,serverReady);
 const [commandOpen,setCommandOpen]=useState(false);
 const [actionsOpen,setActionsOpen]=useState(false);
 const [exportOpen,setExportOpen]=useState(false);
 const [bugOpen,setBugOpen]=useState(false);
 const [lastTrigger,setLastTrigger]=useState<HTMLElement|null>(null);
 const root=useRef<HTMLDivElement>(null);
 const pathname=usePathname();
 const router=useRouter();
 const rolePreview=useWorkspaceRolePreview();
 const searchButton=useRef<HTMLButtonElement>(null);
 const actionButton=useRef<HTMLButtonElement>(null);
 const menu=useRef<HTMLDivElement>(null);
 const commands=workspaceCommands(role);
 const showExport=exportChoices(role).length>0;
 const {branding}=useBranding();
 const display=platform?"Platform workspace":branding.displayName||name;
 const branchLabel=platform?"Platform":branch;
 const modalOpen=commandOpen||exportOpen||bugOpen;
 useEffect(()=>{
  const handler=(event:globalThis.KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setActionsOpen(false);setExportOpen(false);const active=document.activeElement;setLastTrigger(active instanceof HTMLElement&&active!==document.body?active:searchButton.current);setCommandOpen(true);}};
  window.addEventListener("keydown",handler);return()=>window.removeEventListener("keydown",handler);
 },[]);
 useEffect(()=>{if(!actionsOpen)return;menu.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus({preventScroll:true});const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setActionsOpen(false);};const key=(event:globalThis.KeyboardEvent)=>{if(event.key==="Escape"){setActionsOpen(false);actionButton.current?.focus({preventScroll:true});}};document.addEventListener("pointerdown",outside,true);document.addEventListener("keydown",key);return()=>{document.removeEventListener("pointerdown",outside,true);document.removeEventListener("keydown",key);};},[actionsOpen]);
 const navigateMenu=(event:KeyboardEvent<HTMLDivElement>)=>{if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key))return;event.preventDefault();const items=[...(menu.current?.querySelectorAll<HTMLElement>("[role='menuitem']")??[])];if(!items.length)return;const current=items.indexOf(document.activeElement as HTMLElement);const index=event.key==="Home"?0:event.key==="End"?items.length-1:event.key==="ArrowDown"?(current+1)%items.length:(current-1+items.length)%items.length;items[index].focus();};
 const openSearch=()=>{const active=document.activeElement;setLastTrigger(active instanceof HTMLElement&&active!==document.body?active:searchButton.current);setCommandOpen(true);};
 const openExport=(trigger:HTMLElement)=>{setLastTrigger(trigger);setActionsOpen(false);setExportOpen(true);};
 const actionItems:Command[]=commands.filter(item=>["/students","/batches","/attendance","/fees","/tests-results","/homework"].includes(item.href));
 if(role==="admin"||role==="manager")actionItems.unshift({id:"add-student",label:"Add Student",description:"Open the admission preview workflow",icon:"students",href:"/students/new",kind:"action"});
 const quickActions=actionItems.filter((item,index,array)=>array.findIndex(other=>other.href===item.href)===index);
 const openBug=(trigger:HTMLElement)=>{setLastTrigger(trigger);setActionsOpen(false);setBugOpen(true);};
 return <>
  <div className="smart-workspace-bar" ref={root}>
  <GlassSurface className="workspace-header smart-workspace-header" style={{color:"var(--text)"}}>
    <Link href="/" className="workspace-identity" aria-label={`${display}, ${branchLabel}`}>
     {logoUrl&&!platform?<Image className="workspace-mark workspace-logo" src={logoUrl} width={36} height={36} alt="" unoptimized/>:<span className="workspace-mark" aria-hidden="true">{initials}</span>}
     <span className="workspace-identity-copy"><strong>{display}</strong><small>{branchLabel}</small></span>
    </Link>
    <div className="workspace-command-search">
     <motion.button ref={searchButton} type="button" className="workspace-search-trigger" aria-label="Search pages and actions" onClick={openSearch} aria-haspopup="dialog" aria-expanded={commandOpen} whileHover={reduced?undefined:{y:-1}} whileTap={reduced?undefined:{scale:.985}} transition={{duration:reduced?0:.13}}><Icon name="search"/><span>Search pages and actions</span><kbd>Ctrl K</kbd></motion.button>
    </div>
    <div className="workspace-tools">
     <div className="workspace-action-wrap">
      <motion.button ref={actionButton} type="button" className="workspace-action-trigger" aria-label="Quick actions" data-open={actionsOpen||undefined} aria-expanded={actionsOpen} aria-haspopup="menu" onClick={()=>setActionsOpen(open=>!open)} whileHover={reduced?undefined:{y:-1}} whileTap={reduced?undefined:{scale:.96}} transition={{duration:reduced?0:.13}}><Icon name="plus"/><span>Quick actions</span></motion.button>
      <AnimatePresence>{actionsOpen&&<motion.div ref={menu} className="workspace-action-menu" role="menu" aria-label="Quick actions" onKeyDown={navigateMenu} initial={{opacity:reduced?1:0,y:reduced?0:-5,scale:reduced?1:.99}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:reduced?1:0,y:reduced?0:-3}} transition={{duration:reduced?0:.14,ease:[.22,1,.36,1]}}>
       {quickActions.map(item=><Link role="menuitem" key={item.id} href={item.href} onClick={()=>setActionsOpen(false)}><Icon name={item.icon}/>{item.label}</Link>)}
       {showExport&&<button role="menuitem" type="button" onClick={event=>openExport(actionButton.current??event.currentTarget)}><Icon name="download"/>Export</button>}
       <button role="menuitem" type="button" onClick={event=>openBug(actionButton.current??event.currentTarget)}><Icon name="bug"/>Report a Bug</button>
      </motion.div>}</AnimatePresence>
     </div>
     {process.env.NODE_ENV!="production"?<label className="workspace-role-preview"><span>DEMO USER</span><select aria-label="Demo user preview" value={rolePreview.userId} onChange={event=>{const identity=event.currentTarget.value as DemoIdentityId;const next=roleForDemoIdentity(identity);rolePreview.setIdentity(identity);setActionsOpen(false);setCommandOpen(false);setExportOpen(false);setBugOpen(false);router.replace(workspaceRoleLanding(next));}}>{DEMO_IDENTITIES.map(identity=><option key={identity.id} value={identity.id}>{identity.label}</option>)}</select></label>:<div className="workspace-role-chip" aria-label={`Current role: ${roleLabels[role]}`} title={roleLabels[role]}><span aria-hidden="true">{role.slice(0,2).toUpperCase()}</span><small>{roleLabels[role]}</small></div>}
     <span className="workspace-connection" role="status" aria-label="Backend not connected" title="No backend connection is configured"><span className="note-dot" aria-hidden="true"/><span aria-hidden="true">Not connected</span></span>
    </div>
   </GlassSurface>
  </div>
  {ready&&createPortal(<><AnimatePresence onExitComplete={()=>{if(!modalOpen&&lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});}}>{commandOpen&&<CommandPalette key="commands" role={role} trigger={lastTrigger} onClose={()=>setCommandOpen(false)}/ >}{exportOpen&&<ExportCentre key="exports" role={role} trigger={lastTrigger} onClose={()=>setExportOpen(false)}/>}</AnimatePresence><BugReportDialog key={rolePreview.userId} open={bugOpen} role={role} route={pathname} trigger={lastTrigger} onClose={()=>setBugOpen(false)}/></>,document.body)}
 </>;
}
