import type { Metadata } from "next";
import { ManagementPage } from "@/components/ics/management-page";

export const metadata: Metadata = { title: "Homework" };

export default function Page() {
  return <ManagementPage section="homework" />;
}
