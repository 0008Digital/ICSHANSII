import type { Metadata } from "next";
import { StudentPortal } from "@/components/ics/student-portal";

export const metadata: Metadata = { title: "Student Home" };
export default function Page(){return <StudentPortal/>;}
