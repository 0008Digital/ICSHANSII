"use client";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppNavigation } from "./app-navigation";
import { AppearanceScene } from "./appearance/scene";
import { GlassSurface } from "./glass";
import {DEMO_WORKSPACE,type WorkspaceRole} from "./workspace-roles";
import { useWorkspaceRolePreview } from "./workspace-role-preview";
import { useBranding } from "./branding/branding-provider";
import { brandInitials } from "./branding/branding";
import { SmartWorkspaceBar } from "./smart-workspace-bar";
export function AppShell({children,role:explicitRole,centre={name:DEMO_WORKSPACE.name,branch:DEMO_WORKSPACE.branch}}:{children:ReactNode;role?:WorkspaceRole;centre?:{name:string;branch:string}}) {
 const {role:previewRole}=useWorkspaceRolePreview();
 const role=explicitRole??previewRole??DEMO_WORKSPACE.role;
 const {branding,logoUrl}=useBranding();
 const pathname=usePathname();
 const platform=role==="platform-owner",name=platform?"ICS Platform":branding.displayName||centre.name,branch=platform?"Platform workspace":branding.branchName||centre.branch;
 useEffect(()=>{
  const routeTitle:Record<string,string>={"/":"Dashboard","/students":"Students","/students/new":"Add Student","/batches":"Batches","/fees":"Fees","/attendance":"Attendance","/staff":"Staff","/tests-results":"Tests & Results","/homework":"Homework","/ics-updates":"ICS Updates","/settings":"Settings","/chatrooms":"Chatrooms","/developer":"Developer Console","/teacher-dashboard":"Teacher Dashboard","/student-portal":"Student Home"};
  const profile=pathname!=="/students/new"&&pathname.match(/^\/students\/[^/]+(?:\/edit)?$/);
  document.title=`${profile?(pathname.endsWith("/edit")?"Edit Student":"Student Profile"):routeTitle[pathname]??"ICS Coaching"} · ${name}`;
 },[name,pathname]);
 return <div className="ics-shell"><AppearanceScene/><a className="skip-link" href="#main">Skip to content</a>
  <header className="global-workspace-header"><SmartWorkspaceBar role={role} platform={platform} name={name} branch={branch} logoUrl={logoUrl} initials={platform?"PO":brandInitials(branding)}/></header>
  <GlassSurface as="aside" className="sidebar" aria-label="Workspace sidebar" style={{ color: "var(--text)" }}>
   <div className="sidebar-navigation"><AppNavigation mode="desktop" role={role}/></div>
   <footer className="sidebar-identity"><AppNavigation mode="desktop" role={role} placement="bottom"/></footer>
  </GlassSurface>
  <AppNavigation mode="mobile" role={role}/>
  <div className="workspace"><main id="main" tabIndex={-1} className="workspace-main">{children}</main></div>
 </div>;
}
