"use client";
import Link from "next/link";
import { GlassSurface } from "./glass";
import { PageHeading } from "./page-heading";
import { teacherDashboardSections } from "./teacher-dashboard-model.mjs";
import { useRoleSection } from "./use-role-section-navigation";
export function TeacherDashboard(){
 const section=useRoleSection();
 const selected=teacherDashboardSections.find(item=>item.id===section);
 return <div className="content-container teacher-dashboard"><PageHeading title={selected?.title??"Teacher Dashboard"}/><p className="demo-banner"><strong>TEACHER PREVIEW</strong> Assignments and rosters are not connected.</p><div className="teacher-preview-grid">{teacherDashboardSections.map(({id,title,detail})=><section key={id} id={id} data-role-section hidden={!!selected&&id!==selected.id} aria-labelledby={`${id}-title`}><GlassSurface className="teacher-preview-card"><h2 id={`${id}-title`}>{title}</h2><p>{detail}</p></GlassSurface></section>)}</div><nav className="teacher-preview-links" aria-label="Teacher tools"><Link href="/attendance">Rapid Attendance</Link><Link href="/homework">Homework</Link><Link href="/tests-results">Tests &amp; Results</Link><Link href="/chatrooms">Chatrooms</Link></nav></div>;
}
