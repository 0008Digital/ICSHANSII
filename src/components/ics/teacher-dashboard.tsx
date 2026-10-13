import Link from "next/link";
import { GlassSurface } from "./glass";
import { PageHeading } from "./page-heading";
import { teacherDashboardSections } from "./teacher-dashboard-model.mjs";
export function TeacherDashboard(){return <div className="content-container teacher-dashboard"><PageHeading title="Teacher Dashboard"/><p className="demo-banner"><strong>TEACHER PREVIEW</strong> Assignments and rosters are not connected.</p><div className="teacher-preview-grid">{teacherDashboardSections.map(({id,title,detail})=><GlassSurface as="section" key={id} id={id} className="teacher-preview-card" aria-labelledby={`${id}-title`}><h2 id={`${id}-title`}>{title}</h2><p>{detail}</p></GlassSurface>)}</div><nav className="teacher-preview-links" aria-label="Teacher tools"><Link href="/attendance">Rapid Attendance</Link><Link href="/homework">Homework</Link><Link href="/tests-results">Tests &amp; Results</Link><Link href="/chatrooms">Chatrooms</Link></nav></div>;}
