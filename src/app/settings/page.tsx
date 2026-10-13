import type { Metadata } from "next";
import { ManagementPage } from "@/components/ics/management-page";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <ManagementPage section="settings" />;
}
