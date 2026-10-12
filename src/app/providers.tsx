"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { GlassSystemProvider, type GlassAppearancePreference } from "@/vendor/open-glass-ui/dist/index.js";

const AppearanceContext = createContext<{
  appearance: GlassAppearancePreference;
  setAppearance: (value: GlassAppearancePreference) => void;
} | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  // The first client render matches SSR; upstream resolves system appearance after hydration.
  const [appearance, setAppearance] = useState<GlassAppearancePreference>("system");
  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance }}>
      <GlassSystemProvider design="liquid" renderer="auto" motion="system"
        theme={{ appearance, className: "app-theme", theme: { preset: "neutral" } }}>
        {children}
      </GlassSystemProvider>
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance requires Providers");
  return context;
}
