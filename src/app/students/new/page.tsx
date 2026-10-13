import type { Metadata } from "next";
import { PageHeading } from "@/components/ics/page-heading";
import { StudentForm } from "@/components/ics/students/student-form";
export const metadata: Metadata = { title: "Add Student" };
export default function Page() { return <div className="content-container content-container--form"><PageHeading title="Add Student"/><StudentForm/></div>; }
