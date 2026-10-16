"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { GlassSurface } from "./glass";
import { PageHeading } from "./page-heading";
import { useWorkspaceRolePreview } from "./workspace-role-preview";
import { DEMO_IDENTITIES } from "./workspace-role-model";
import { chartFraction, percentageSegments, studentChartSegments, studentPreview, studentProgress } from "./analytics-model.mjs";
import { useAppMotionReduced, useAppearance } from "@/app/providers";
import { useRoleSection } from "./use-role-section-navigation";

const sections=[
 {id:"batch",title:"Classes & Batch",text:"New General · timetable not connected."},
 {id:"attendance",title:"Attendance",text:"Sample attendance only."},
 {id:"results",title:"Tests & Results",text:"Published results not connected."},
 {id:"fees",title:"Fees",text:"Personal fees and payments not connected."},
 {id:"profile",title:"Profile",text:"Verified profile details require secure sign-in."},
 {id:"homework",title:"Homework",text:"Assignments not connected."},
 {id:"updates",title:"ICS Updates",text:"No notices or timetables published."},
];
function Ring({value,label,detail,segments}:{value:number|null;label:string;detail:string;segments:readonly {label:string;value:number;tone:string}[]}){
 const reduced=useAppMotionReduced();const {settings}=useAppearance();const radius=38,circumference=2*Math.PI*radius;const chart: {label:string;value:number;percent:number;offset:number;tone:string}[]=percentageSegments(segments);const off=settings.animationPreference==="off";const animate=settings.animationPreference==="full"&&!reduced;
 return <div className="student-progress-ring"><svg viewBox="0 0 100 100" role="img" aria-label={`${label}: ${value===null?"Not available":`${value}%`}`}><circle className="student-ring-track" cx="50" cy="50" r={radius}/>{chart.map((segment,index)=><motion.circle key={segment.label} className="student-ring-segment" data-tone={segment.tone} cx="50" cy="50" r={radius} transform="rotate(-90 50 50)" strokeDashoffset={-circumference*segment.offset/100} initial={animate?{strokeDasharray:`0 ${circumference}`} : false} animate={{strokeDasharray:`${circumference*segment.percent/100} ${circumference}`}} transition={{duration:off?0:(animate?0.78:0.16),delay:animate?index*.06:0,ease:[.22,1,.36,1]}} aria-hidden="true"/> )}</svg><span className="student-ring-copy"><strong>{value===null?"—":`${value}%`}</strong><small>{label}</small></span><span className="sr-only">{detail} {segments.map(item=>`${item.label} ${item.value}%`).join(", ")}.</span></div>;
}
export function StudentPortal(){
 const section=useRoleSection();const selected=sections.find(item=>item.id===section);
 const {userId}=useWorkspaceRolePreview();const identityLabel=DEMO_IDENTITIES.find(identity=>identity.id===userId)?.label;
 const progress=studentProgress();const reduced=useAppMotionReduced();const {settings}=useAppearance();const off=settings.animationPreference==="off";const full=settings.animationPreference==="full"&&!reduced;const barDuration=off?0:(full?0.7:0.16);
 return <div className="student-portal content-container">
  <PageHeading title={selected?.title??"Student Home"}/>
  <p className="demo-banner"><strong>FICTIONAL PREVIEW</strong> Sample data only. Your private records are not connected.</p>
  <nav className="student-portal-nav" aria-label="Student portal sections">{sections.map(item=><a key={item.id} href={`#${item.id}`} aria-current={selected?.id===item.id?"page":undefined}>{item.title}</a>)}<Link href="/chatrooms">Chatrooms</Link><Link href="/settings">Help &amp; Settings</Link></nav>
  <div hidden={!!selected} className="student-home-content">
  <GlassSurface className="student-portal-welcome"><span>STUDENT WORKSPACE · DEMO</span><h2>Good morning, {identityLabel}</h2><p>Sample student · New General · Enrollment not connected.</p></GlassSurface>
  <section className="student-portal-overview" aria-label="Student progress preview">
   <article className="student-visual-card"><header><h2>Fees</h2><span>DEMO DATA</span></header><Ring value={progress.paidPercent} label="Paid" detail={`Total ₹${(studentPreview.fees.totalMinor/100).toLocaleString("en-IN")}; paid ₹${(studentPreview.fees.paidMinor/100).toLocaleString("en-IN")}; remaining ₹${(progress.remainingMinor/100).toLocaleString("en-IN")}.`} segments={studentChartSegments.fees}/><div className="student-chart-legend">{studentChartSegments.fees.map(item=><span key={item.label} data-tone={item.tone}><i aria-hidden="true"/>{item.label} {item.value}%</span>)}</div><dl><div><dt>Total</dt><dd>₹{(studentPreview.fees.totalMinor/100).toLocaleString("en-IN")}</dd></div><div><dt>Paid</dt><dd>₹{(studentPreview.fees.paidMinor/100).toLocaleString("en-IN")}</dd></div><div><dt>Remaining</dt><dd>₹{(progress.remainingMinor/100).toLocaleString("en-IN")}</dd></div></dl><p>No payment or receipt is recorded.</p></article>
   <article className="student-visual-card"><header><h2>Attendance</h2><span>DEMO DATA</span></header><Ring value={progress.attendancePercent} label="Present" detail={`${studentPreview.attendance.present} present, ${studentPreview.attendance.absent} absent, ${studentPreview.attendance.leave} leave.`} segments={studentChartSegments.attendance}/><div className="student-chart-legend">{studentChartSegments.attendance.map(item=><span key={item.label} data-tone={item.tone}><i aria-hidden="true"/>{item.label} {item.value}%</span>)}</div><dl><div><dt>Present</dt><dd>{studentPreview.attendance.present}</dd></div><div><dt>Absent</dt><dd>{studentPreview.attendance.absent}</dd></div><div><dt>Leave</dt><dd>{studentPreview.attendance.leave}</dd></div></dl><p>Sample attendance totals, not a real register.</p></article>
   <article className="student-visual-card"><header><h2>Homework</h2><span>DEMO DATA</span></header><div className="student-bar-value"><span>Completion</span><strong>{progress.homeworkPercent}%</strong></div><div className="student-progress-track" role="img" aria-label={`Homework completion ${progress.homeworkPercent}%`}><motion.span data-tone="green" style={{width:"100%",transformOrigin:"left center"}} initial={full?{scaleX:0}:false} animate={{scaleX:chartFraction(progress.homeworkPercent)}} transition={{duration:barDuration}}/></div><p>{studentPreview.homework.completed} of {studentPreview.homework.assigned} fictional tasks complete.</p><Link href="/student-portal#homework">View homework</Link></article>
   <article className="student-visual-card"><header><h2>Recent tests</h2><span>DEMO DATA</span></header><ul className="student-test-bars">{studentPreview.tests.map((test,index)=><li key={test.label}><span>{test.label}</span><span className="student-progress-track" role="img" aria-label={`${test.label} sample score ${test.score}%`}><motion.span data-tone={(["blue","violet","teal"] as const)[index%3]} style={{width:"100%",transformOrigin:"left center"}} initial={full?{scaleX:0}:false} animate={{scaleX:chartFraction(test.score)}} transition={{duration:barDuration,delay:full?index*.04:0}}/></span><strong>{test.score}%</strong></li>)}</ul><p>Sample scores · assessments not connected.</p></article>
  </section>
  </div>
  <div className="student-portal-grid">{sections.map(item=><div id={item.id} data-role-section hidden={!!selected&&item.id!==selected.id} key={item.id}><section className="student-portal-card" aria-labelledby={`${item.id}-heading`}><div><h2 id={`${item.id}-heading`}>{item.title}</h2><span>Not connected</span></div><p>{item.text}</p></section></div>)}</div>
  <p className="section-footnote">Private student records require secure sign-in. Figures shown here are sample data.</p>
 </div>;
}
