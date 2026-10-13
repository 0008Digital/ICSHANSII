export type WorkspaceRole = "platform-owner" | "admin" | "manager" | "teacher" | "student";
const workspaceRoles: readonly WorkspaceRole[] = ["platform-owner", "admin", "manager", "teacher", "student"];
export function parseWorkspaceRole(value: string | null): WorkspaceRole { return workspaceRoles.includes(value as WorkspaceRole) ? value as WorkspaceRole : "admin"; }
export const DEMO_IDENTITIES = [
 { id: "demo-platform-owner", role: "platform-owner", label: "Developer / Owner" },
 { id: "demo-centre-admin", role: "admin", label: "Centre Admin" },
 { id: "demo-manager", role: "manager", label: "Manager" },
 { id: "demo-teacher", role: "teacher", label: "Teacher / Staff" },
 { id: "demo-student-a", role: "student", label: "Student A" },
 { id: "demo-student-b", role: "student", label: "Student B" },
] as const;
export type DemoIdentityId = typeof DEMO_IDENTITIES[number]["id"];
export function parseDemoIdentity(value: string | null): DemoIdentityId | null {
 return DEMO_IDENTITIES.some(identity => identity.id === value) ? value as DemoIdentityId : null;
}
export function demoIdentityForRole(role: WorkspaceRole): DemoIdentityId {
 return DEMO_IDENTITIES.find(identity => identity.role === role)!.id;
}
export function roleForDemoIdentity(id: DemoIdentityId): WorkspaceRole {
 return DEMO_IDENTITIES.find(identity => identity.id === id)!.role;
}
export function workspaceRoleLanding(role: WorkspaceRole) {
 if (role === "platform-owner") return "/developer";
 if (role === "student") return "/student-portal";
 if (role === "teacher") return "/teacher-dashboard";
 return "/";
}
