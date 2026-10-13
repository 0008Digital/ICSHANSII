import type { Metadata } from "next";
import { ManagementPage } from "@/components/ics/management-page";

export const metadata: Metadata = { title: "Staff" };

export default function Page() {
  return <ManagementPage section="staff" />;
}
