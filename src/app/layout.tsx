import type { Metadata } from "next";
import "./globals.css";
import "@/vendor/open-glass-ui/dist/styles.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ICS Hansi · OpenGlass",
  description: "An independent OpenGlass interface preview for ICS Hansi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
