import type { Metadata } from "next";
import { ManagementPage } from "@/components/ics/management-page";

export const metadata: Metadata = { title: "ICS Updates" };

export default function Page() {
  return <ManagementPage section="ics-updates" />;
}
