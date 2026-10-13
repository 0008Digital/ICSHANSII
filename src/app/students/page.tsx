import type { Metadata } from "next";
import { PageHeading } from "@/components/ics/page-heading";
import { StudentDirectory } from "@/components/ics/student-directory";
export const metadata: Metadata = { title: "Students" };
export default function Page() {
 return <><PageHeading title="Students"/><StudentDirectory/></>;
}
