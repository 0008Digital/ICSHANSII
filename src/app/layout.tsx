import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "@/components/ics/appearance/upstream-scene.css";
import "@/vendor/open-glass-ui/dist/styles.css";
import "@/components/ics/mobile-layout.css";
import "@/components/ics/settings-layout.css";
import "@/components/ics/interaction-motion.css";
import "@/components/ics/saas-layout.css";
import {createGlassTheme} from "@/vendor/open-glass-ui/dist/core.js";
import type {CSSProperties} from "react";
import {cookies} from "next/headers";
import { APPEARANCE_COOKIE,readAppearanceCookie,createThemeBootstrap } from "./theme-preference";
import { AppShell } from "@/components/ics/shell";
import { Providers } from "./providers";
import "@/components/ics/branding/brand-system.css";
import "@/components/ics/workspace-bar.css";
import "@/components/ics/demo-workspaces.css";
import { DEFAULT_BRANDING } from "@/components/ics/branding/branding";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  title: { default: `Dashboard · ${DEFAULT_BRANDING.displayName}`, template: `%s · ${DEFAULT_BRANDING.displayName}` },
  description: `${DEFAULT_BRANDING.displayName} management workspace. Backend not connected.`,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initial=readAppearanceCookie((await cookies()).get(APPEARANCE_COOKIE)?.value);
  const palette=createGlassTheme(initial.resolved,{preset:initial.settings.accent==="periwinkle"?"cobalt":initial.settings.accent,contrast:"high",...(initial.settings.customAccent?{accent:initial.settings.customAccent}:{})});
  const rootStyle={colorScheme:initial.resolved,"--accent":palette.accent,"--accent-ink":palette.accentInk,"--wash":palette.accentSoft,"--ics-focus":palette.focus} as CSSProperties;
  return <html lang="en" className={`${geist.variable} ${spaceGrotesk.variable}`} data-appearance={initial.resolved} data-user-motion={initial.settings.animationPreference} style={rootStyle} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: createThemeBootstrap(initial) }} /></head><body><Providers initialSettings={initial.settings} initialUserId={initial.userId} defaultAppearance={initial.resolved}><AppShell>{children}</AppShell></Providers></body></html>;
}
