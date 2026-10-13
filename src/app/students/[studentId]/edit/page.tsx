import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { students } from "@/components/ics/students/model";
import { StudentForm } from "@/components/ics/students/student-form";
import { PageHeading } from "@/components/ics/page-heading";
export const metadata = { title: "Edit student details" };
async function Edit({params}:{params:Promise<{studentId:string}>}) {
 const {studentId}=await params;
 const student=students.find(s=>s.id===studentId);
 if(!student) notFound();
 return <div className="content-container content-container--form"><Link className="text-link back-link" href={`/students/${student.id}`}>← Student profile</Link><PageHeading title="Edit student details" description={`${student.name} · Fictional demo record`}/><StudentForm student={student}/></div>;
}
export default function Page({params}:{params:Promise<{studentId:string}>}) {
 return <Suspense fallback={<p role="status">Loading student details…</p>}><Edit params={params}/></Suspense>;
}
