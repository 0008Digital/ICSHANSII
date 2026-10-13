import type { ReactNode } from "react";
import { students } from "@/components/ics/students/model";
export function generateStaticParams() { return students.map(student=>({studentId:student.id})); }
export default function Layout({children}:{children:ReactNode}) { return children; }
