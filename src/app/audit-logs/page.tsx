import type { Metadata } from "next";
import { ManagementPage } from "@/components/ics/management-page";
export const metadata: Metadata={title:"Audit Logs"};
export default function Page(){return <ManagementPage section="audit-logs"/>;}
