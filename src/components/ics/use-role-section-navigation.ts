"use client";
import {useEffect, useSyncExternalStore} from "react";
import {navigateRoleSection, subscribeSectionLocation} from "./section-navigation.mjs";
import {workspaceRoleLanding, type WorkspaceRole} from "./workspace-role-model";

const currentSection=()=>window.location.hash.slice(1),serverSection=()=>"";
export function useRoleSection(){
 return useSyncExternalStore(subscribeSectionLocation,currentSection,serverSection);
}

// AppNavigation's always-mounted mobile instance is the single event owner,
// including on desktop. No navigation timers or pending section requests.
export function useRoleSectionNavigation(role:WorkspaceRole, owner:boolean) {
 useEffect(()=>{
  if(!owner || role==="admin" || role==="manager")return;
  const landing=workspaceRoleLanding(role);
  const click=(event:MouseEvent)=>{
   const anchor=event.target instanceof Element?event.target.closest<HTMLAnchorElement>("a[href]"):null;
   if(anchor?.closest("nav, .command-results, .student-visual-card"))navigateRoleSection(event,anchor,window,document,landing);
  };
  document.addEventListener("click",click,true);
  return()=>document.removeEventListener("click",click,true);
 },[role,owner]);
}
