"use client";
import {motion} from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useMobileViewport } from "./use-mobile-viewport";
import { Popover, useGlassTheme } from "@/vendor/open-glass-ui/dist/index.js";
import { useAppearance } from "@/app/providers";
import {roleFeatures,DEMO_WORKSPACE,type WorkspaceRole,type RoleFeature} from "./workspace-roles";
import { Icon } from "./icon";
import { GlassSurface } from "./glass";
import { useAppMotionReduced } from "@/app/providers";
import { useWorkspaceRolePreview } from "./workspace-role-preview";
import { isCurrentNavigationHref, mobileNavigationLabel } from "./navigation-current.mjs";
import {subscribeSectionLocation} from "./section-navigation.mjs";
import {useRoleSectionNavigation} from "./use-role-section-navigation";
const subscribe=()=>()=>{};
const clientSnapshot=()=>true,serverSnapshot=()=>false;
const currentHash=()=>window.location.hash,serverHash=()=>"";
const MotionLink=motion.create(Link);
const primary=["/","/students","/batches","/attendance"];
const moreOrder=["/fees","/ledger","/staff","/audit-logs","/tests-results","/homework","/ics-updates","/settings"];
const studentDockIds=["student-home","student-batch","student-attendance","student-results"];
const teacherDockIds=["teacher-dashboard","assigned-students","attendance","homework"];
const ownerDockIds=["developer-console","bug-reports","application-errors","system-health"];
export function AppNavigation({mode,role=DEMO_WORKSPACE.role,placement="main"}:{mode:"desktop"|"mobile";role?:WorkspaceRole;placement?:"main"|"bottom"}) {
 const pathname=usePathname();
 const hash=useSyncExternalStore(subscribeSectionLocation,currentHash,serverHash);
 useRoleSectionNavigation(role,mode==="mobile");
 const navigation=roleFeatures(role);const indicator=useId();
 const reduced=useAppMotionReduced();
 const dock=useRef<HTMLElement>(null);
 const [selection,setSelection]=useState<{x:number;width:number}|null>(null);
 const mounted=useSyncExternalStore(subscribe,clientSnapshot,serverSnapshot);
 const {tokens,appearance}=useGlassTheme();
 useMobileViewport(mode==="mobile");
 const {userId}=useWorkspaceRolePreview();
 const moreScope=`${userId}:${role}:${pathname}:${hash}`;
 const [moreState,setMoreState]=useState({scope:"",open:false});
 const moreOpen=moreState.scope===moreScope&&moreState.open;
 // Next can commit a cross-route hash removal after this render. Capture the
 // actual location at interaction time so the first More click stays open.
 const setMoreOpen=(open:boolean)=>setMoreState({scope:role==="admin"||role==="manager"?moreScope:`${userId}:${role}:${window.location.pathname}:${window.location.hash}`,open});
 const {settings}=useAppearance();
 useEffect(()=>{
  const desktop=window.matchMedia("(min-width: 768px)");
  const closeOnDesktop=()=>{if(desktop.matches)setMoreState(current=>({...current,open:false}));};
  desktop.addEventListener("change",closeOnDesktop);
  return()=>desktop.removeEventListener("change",closeOnDesktop);
 },[]);
 const student=role==="student";
 const current=(href:string)=>isCurrentNavigationHref(href,pathname,hash,navigation.map(entry=>entry.href));
 const mobilePrimary=student?navigation.filter(entry=>studentDockIds.includes(entry.id)):role==="teacher"?navigation.filter(entry=>teacherDockIds.includes(entry.id)):role==="platform-owner"?navigation.filter(entry=>ownerDockIds.includes(entry.id)):navigation.filter(entry=>entry.href!==null&&primary.includes(entry.href));
 const secondary=navigation.filter(entry=>entry.href!==null&&!mobilePrimary.some(primaryEntry=>primaryEntry.id===entry.id));
 if(!student)secondary.sort((a,b)=>moreOrder.indexOf(a.href!.split("#")[0])-moreOrder.indexOf(b.href!.split("#")[0]));
 const selectedMore=moreOpen||secondary.some(entry=>entry.href!==null&&current(entry.href));
 const mobilePrimaryHrefs=mobilePrimary.map(entry=>entry.href!);
 const activeIndex=moreOpen?mobilePrimary.length:Math.max(0,mobilePrimaryHrefs.findIndex(href=>current(href)));
 const selectedIndex=selectedMore?mobilePrimary.length:activeIndex;
 useLayoutEffect(()=>{
  const root=dock.current;if(!root)return;
  const measure=()=>{const target=root.querySelectorAll<HTMLElement>(":scope > a, :scope > .ogui-disclosure")[selectedIndex];if(target)setSelection({x:target.offsetLeft-6,width:target.offsetWidth});};
  measure();const observer=new ResizeObserver(measure);observer.observe(root);
  return()=>observer.disconnect();
 },[selectedIndex,mounted,mode,mobilePrimary.length]);
 const item=(entry:RoleFeature,mobile=false)=>entry.href===null?<span key={entry.id} className="nav-unavailable" aria-disabled="true"><Icon name={entry.icon}/><span>{entry.label}<small>Planned</small></span></span>:mobile||mode==="mobile"?<Link key={entry.id} href={entry.href} aria-label={mobile?mobileNavigationLabel(entry).accessibleLabel:undefined} aria-current={current(entry.href)&&(!mobile||!moreOpen)?"page":undefined} onClick={()=>setMoreOpen(false)}><Icon name={entry.icon}/><span>{mobile?mobileNavigationLabel(entry).label:entry.label}</span></Link>:<MotionLink key={entry.id} href={entry.href} aria-current={current(entry.href)?"page":undefined} whileHover={reduced?undefined:{x:2}} whileTap={reduced?undefined:{scale:.99}} transition={{duration:.14}}>
 {current(entry.href)&&<motion.span className="sidebar-active-capsule" aria-hidden="true" layoutId={`${indicator}-active`} initial={false} transition={reduced?{duration:0}:{type:"spring",stiffness:520,damping:44,mass:.8}}/>}<Icon name={entry.icon}/><span>{entry.label}</span></MotionLink>;
 if(mode==="desktop")return <nav className={`desktop-navigation ${placement==="bottom"?"desktop-navigation--bottom":""}`} aria-label={placement==="bottom"?"Workspace settings":"Main navigation"}>{placement==="bottom"?navigation.filter(entry=>entry.group==="Bottom").map(entry=>item(entry)):( ["Overview","Academics","Operations"] as const).map(group=><section className="sidebar-nav-group" key={group} aria-label={group}><h2>{group}</h2>{navigation.filter(entry=>entry.group===group).map(entry=>item(entry))}</section>)}</nav>;
 return mounted&&(role==="admin"||role==="manager"||role==="student"||role==="teacher"||role==="platform-owner")?createPortal(<>
  <GlassSurface ref={dock} as="nav" className="ics-mobile-dock" data-ogui-appearance={appearance} aria-label={student?"Student portal navigation":"Mobile navigation"} style={{...tokens,color:"var(--text)","--dock-selection":selectedIndex} as CSSProperties}>
   {selection&&<motion.span className="ics-dock-selection" aria-hidden="true" initial={false} animate={{x:selection.x,width:selection.width}} transition={reduced?{duration:0}:{type:"spring",stiffness:520,damping:44,mass:.8}}/>}
   {mobilePrimary.map(entry=>item(entry,true))}
   <Popover label={student?"More student sections":"More navigation"} open={moreOpen} onOpenChange={setMoreOpen} placement="end" focusOnOpen="first" material={settings.material} trigger={<button type="button" className="mobile-more-trigger" data-active={selectedMore?"true":"false"}><Icon name="more"/><span>More</span></button>}>
    <nav className="ics-more-menu ics-more-destinations" aria-label={student?"More student sections":"More destinations"}>{secondary.map(entry=>item(entry))}</nav>
   </Popover>
  </GlassSurface>
 </>,document.body):null;
}
