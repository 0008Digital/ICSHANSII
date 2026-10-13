"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { activeSettingsSection, settingsSectionsForRole, settingsSectionFromHash } from "./settings-navigation.mjs";
import { useWorkspaceRolePreview } from "./workspace-role-preview";


export function SettingsHeading() {
 const {role}=useWorkspaceRolePreview();const available=settingsSectionsForRole(role);
 const [offset,setOffset]=useState<number>();
 const [active,setActive]=useState("appearance");
 useEffect(()=>{
  // The workspace bar is a top-level, full-width sibling of the sidebar/workspace.
  // Querying the old nested header leaves the sticky section bar at its fallback
  // offset and lets it collide with the global navbar.
  const header=document.querySelector(".global-workspace-header");
  if(!header)return;
  const heading=document.querySelector(".settings-heading");
  const measure=()=>{const height=header.getBoundingClientRect().height;setOffset(height);const sectionOffset=height+(heading?.getBoundingClientRect().height??48)+16;document.documentElement.style.setProperty("--settings-preview-offset",`${sectionOffset}px`);document.documentElement.style.setProperty("--settings-section-offset",`${sectionOffset}px`);};
  const observer=new ResizeObserver(measure);
  measure();observer.observe(header);if(heading)observer.observe(heading);
  return()=>{observer.disconnect();document.documentElement.style.removeProperty("--settings-preview-offset");document.documentElement.style.removeProperty("--settings-section-offset");};
 },[]);
 useEffect(()=>{
  const sections=available.map(id=>document.getElementById(`${id}-title`)).filter((node):node is HTMLElement=>!!node);
  const heading=document.querySelector<HTMLElement>(".settings-heading");
  let requested:string|null=null;
  const syncHash=()=>{const selected=settingsSectionFromHash(window.location.hash);const active=available.includes(selected)?selected:"appearance";setActive(active);requested=available.some(section=>window.location.hash===`#${section}-title`)?active:null;};
  const update=()=>{
   const threshold=(document.querySelector(".global-workspace-header")?.getBoundingClientRect().height??0)+(heading?.getBoundingClientRect().height??48)+34;
   if(requested)return;
   const atBottom=Math.ceil(window.scrollY+window.innerHeight)>=document.documentElement.scrollHeight-2;
   setActive(activeSettingsSection(sections.map(section=>({id:section.id,top:section.getBoundingClientRect().top})),threshold,window.innerHeight,atBottom));
  };
  const clearRequested=()=>{requested=null;};
  const finishScroll=()=>{if(!requested)return;const destination=sections.find(section=>section.id===`${requested}-title`);const threshold=(document.querySelector(".global-workspace-header")?.getBoundingClientRect().height??0)+(heading?.getBoundingClientRect().height??48)+34;if(destination&&destination.getBoundingClientRect().bottom>threshold)setActive(requested);else update();requested=null;};
  const keyIntent=(event:KeyboardEvent)=>{if(["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," "].includes(event.key)&&!event.altKey&&!event.ctrlKey&&!event.metaKey)clearRequested();};
  const onClick=(event:MouseEvent)=>{const target=event.target;if(!(target instanceof Element))return;const link=target.closest<HTMLAnchorElement>(".settings-heading nav a[href^='#']");if(!link)return;const section=settingsSectionFromHash(link.hash);requested=section;setActive(section);};
  const hashChanged=()=>{syncHash();};
  const manual=()=>{requested=null;};
  window.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update);window.addEventListener("hashchange",hashChanged);window.addEventListener("popstate",hashChanged);window.addEventListener("scrollend",finishScroll);window.addEventListener("wheel",manual,{passive:true});window.addEventListener("touchstart",manual,{passive:true});window.addEventListener("keydown",keyIntent);document.addEventListener("click",onClick,true);
  syncHash();update();
  return()=>{window.removeEventListener("scroll",update);window.removeEventListener("resize",update);window.removeEventListener("hashchange",hashChanged);window.removeEventListener("popstate",hashChanged);window.removeEventListener("scrollend",finishScroll);window.removeEventListener("wheel",manual);window.removeEventListener("touchstart",manual);window.removeEventListener("keydown",keyIntent);document.removeEventListener("click",onClick,true);};
 },[available]);
 return <header className="settings-heading" style={{"--settings-header-offset":offset===undefined?undefined:`${offset}px`,color:"var(--text)"} as CSSProperties}>
  <h1>Settings</h1><nav aria-label="Settings sections"><a href="#appearance-title" aria-current={active==="appearance"?"location":undefined}>Appearance</a>{available.includes("branding")&&<a href="#branding-title" aria-current={active==="branding"?"location":undefined}>Branding</a>}</nav>
 </header>;
}

