"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { demoIdentityForRole, parseDemoIdentity, roleForDemoIdentity, type DemoIdentityId, type WorkspaceRole } from "./workspace-role-model";
import { DEMO_IDENTITY_STORAGE_KEY, DEFAULT_SETTINGS, readUserAppearance, syncAppearanceCookie } from "@/app/theme-preference";

const ROLE_KEY = "ics-hansi-demo-workspace-role-v1";
const CHANGE_EVENT = "ics-hansi:demo-role-change";
let memoryIdentity:DemoIdentityId="demo-centre-admin";
let memoryIdentityOverride:DemoIdentityId|null=null;
const serverIdentity = (id: DemoIdentityId) => () => id;
function readIdentity(): DemoIdentityId {
 if(memoryIdentityOverride)return memoryIdentityOverride;
 try {
  const current = parseDemoIdentity(window.localStorage.getItem(DEMO_IDENTITY_STORAGE_KEY));
  if (current) { memoryIdentity=current; return current; }
  const role = window.localStorage.getItem(ROLE_KEY);
  memoryIdentity=demoIdentityForRole(role === "platform-owner" || role === "manager" || role === "teacher" || role === "student" ? role : "admin");
  return memoryIdentity;
 } catch { return memoryIdentity; }
}
function subscribe(listener: () => void) {
 window.addEventListener("storage", listener);
 window.addEventListener(CHANGE_EVENT, listener);
 return () => { window.removeEventListener("storage", listener); window.removeEventListener(CHANGE_EVENT, listener); };
}
type RolePreviewContextValue = { role: WorkspaceRole; userId: DemoIdentityId; setRole: (role: WorkspaceRole) => void; setIdentity: (identity: DemoIdentityId) => void };
const RolePreviewContext = createContext<RolePreviewContextValue | null>(null);

export function WorkspaceRolePreviewProvider({ children, initialUserId = "demo-centre-admin" }: { children: ReactNode; initialUserId?: DemoIdentityId }) {
 const userId = useSyncExternalStore(subscribe, readIdentity, serverIdentity(initialUserId));
 const role = roleForDemoIdentity(userId);
 const setIdentity = (next: DemoIdentityId) => {
  memoryIdentity=next;
  try {
   window.localStorage.setItem(DEMO_IDENTITY_STORAGE_KEY, next);
   window.localStorage.setItem(ROLE_KEY, roleForDemoIdentity(next));
   syncAppearanceCookie(window, readUserAppearance(window, next, DEFAULT_SETTINGS), undefined, next);
   memoryIdentityOverride=null;
  } catch { memoryIdentityOverride=next; /* The local preview still switches in memory when browser storage is blocked. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
 };
 const setRole = (next: WorkspaceRole) => setIdentity(demoIdentityForRole(next));
 return <RolePreviewContext.Provider value={{ role, userId, setRole, setIdentity }}>{children}</RolePreviewContext.Provider>;
}

export function useWorkspaceRolePreview() {
 const value = useContext(RolePreviewContext);
 if (!value) throw new Error("useWorkspaceRolePreview requires WorkspaceRolePreviewProvider");
 return value;
}
