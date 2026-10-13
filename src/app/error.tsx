"use client";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GlassSurface } from "@/components/ics/glass";
import { useWorkspaceRolePreview } from "@/components/ics/workspace-role-preview";
import { BugReportDialog } from "@/components/ics/bug-report";
import type { WorkspaceRole } from "@/components/ics/workspace-roles";

export default function ErrorBoundary({reset}:{error:Error&{digest?:string};reset:()=>void}){
 const {role}=useWorkspaceRolePreview();const pathname=usePathname();const [open,setOpen]=useState(false);const [trigger,setTrigger]=useState<HTMLElement|null>(null);
 return <main className="app-error-page"><GlassSurface className="app-error-panel" role="alert"><span>APPLICATION ERROR</span><h1>This page could not be displayed</h1><p>The error detail is hidden to avoid exposing private data. This frontend does not automatically send diagnostics.</p><div><button type="button" onClick={reset}>Try again</button><button type="button" onClick={event=>{setTrigger(event.currentTarget);setOpen(true);}}>Report this issue</button></div></GlassSurface><BugReportDialog open={open} role={role as WorkspaceRole} route={pathname} trigger={trigger} onClose={()=>setOpen(false)}/></main>;
}
