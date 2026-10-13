import { Suspense } from "react";
import { notFound } from "next/navigation";
import { students } from "@/components/ics/students/model";
import { StudentProfile } from "@/components/ics/students/student-profile";
export const metadata = { title: "Student profile" };
async function Profile({params}:{params:Promise<{studentId:string}>}) {
 const {studentId}=await params;
 const student=students.find(s=>s.id===studentId);
 if(!student) notFound();
 return <StudentProfile student={student}/>;
}
export default function Page({params}:{params:Promise<{studentId:string}>}) {
 return <Suspense fallback={<p role="status">Loading student profile…</p>}><Profile params={params}/></Suspense>;
}
