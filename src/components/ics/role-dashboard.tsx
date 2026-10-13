"use client";
"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import {PageHeading} from "./page-heading";
import {GlassSurface} from "./glass";
import {Icon} from "./icon";
import {dashboardSummaries,DEMO_WORKSPACE,type WorkspaceRole} from "./workspace-roles";
import { students, enrollmentSnapshotFor } from "./students/model";
import { localToday } from "./date-only.mjs";
import { useWorkspaceRolePreview } from "./workspace-role-preview";
import { DashboardCharts } from "./dashboard-charts";
const subscribeToday=(listener:()=>void)=>{window.addEventListener("focus",listener);return()=>window.removeEventListener("focus",listener);};
const currentLocalToday=()=>localToday(),serverToday=()=>"";
// Shared presentation only: no role/session inference, private records or fabricated metrics.
export function RoleDashboard({role:explicitRole}:{role?:WorkspaceRole}={}) {
 const preview=useWorkspaceRolePreview();const role=explicitRole??preview.role??DEMO_WORKSPACE.role;
 const today=useSyncExternalStore(subscribeToday,currentLocalToday,serverToday);
 const renewals=role==="admin"||role==="manager";
 const snapshots=today?students.map(student=>enrollmentSnapshotFor(student.id,today)):[];
 const expiring=snapshots.filter(item=>item.status==="Expiring Soon").length;
 const expired=snapshots.filter(item=>item.status==="Expired").length;
 return <><PageHeading title="Dashboard"/><div className="dashboard-layout"><dl className="dashboard-summaries" aria-label="Operational summary">
 {dashboardSummaries[role].map(summary=><GlassSurface key={summary.label} className="dashboard-summary"><dt><Icon name={summary.icon}/><span>{summary.label}</span></dt><dd><span aria-hidden="true">—</span><span className="sr-only">Unavailable</span></dd></GlassSurface>)}
 </dl>{renewals&&<GlassSurface as="section" className="dashboard-renewal-insights" aria-labelledby="renewal-insights-title"><div className="section-heading"><h2 id="renewal-insights-title">Enrollment renewals</h2><span>DEMO FIXTURES · NOT LIVE</span></div><dl><div><dt>Students expiring soon</dt><dd>{today?expiring:"—"}</dd><Link href="/students?enrollment=Expiring%20Soon">Review demo enrollments</Link></div><div><dt>Expired enrollments</dt><dd>{today?expired:"—"}</dd><Link href="/students?enrollment=Expired">Review demo enrollments</Link></div><div><dt>Renewals due</dt><dd>{today?expiring+expired:"—"}</dd><Link href="/students?enrollment=Expiring%20Soon">Open Students</Link></div><div><dt>Renewals completed</dt><dd>No demo history</dd></div><div><dt>Pending renewal payments</dt><dd>No demo payments</dd></div></dl><p>These date calculations use fictional fixtures for interface preview. No operational counts, payment totals or renewal history are connected.</p></GlassSurface>}<DashboardCharts role={role}/><GlassSurface as="section" className="dashboard-activity" aria-labelledby="recent-activity-title"><h2 id="recent-activity-title">Recent Activity</h2><p>No activity available yet.</p></GlassSurface></div></>;
}
