"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { BRANDING_TENANT_ID, DEFAULT_BRANDING, createCentreBrandingStore, parseCentreBranding, validateCentreBranding, validateBrandLogoFile, type CentreBranding } from "./branding";
import { deleteBrandLogo, readBrandLogo, writeBrandLogo } from "./branding-storage";

const noSubscribe = () => () => {};

type ApplyBrandingOptions = { logoFile?: File | null; removeLogo?: boolean };
type BrandingContextValue = { branding: CentreBranding; logoUrl: string; storageIssue: string; applyBranding: (value: CentreBranding, options?: ApplyBrandingOptions) => Promise<string | null> };
const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => typeof window === "undefined" ? null : createCentreBrandingStore(window));
  const branding = useSyncExternalStore(store?.subscribe ?? noSubscribe, store?.getSnapshot ?? (() => DEFAULT_BRANDING), () => DEFAULT_BRANDING);
  const [storedLogo, setStoredLogo] = useState<{ logoId: string; url: string; issue: string }>({ logoId: "", url: "", issue: "" });
  const { logoId, tenantId } = branding;
  const logoUrl = storedLogo.logoId === logoId ? storedLogo.url : "";
  const storageIssue = storedLogo.logoId === logoId ? storedLogo.issue : "";

  useEffect(() => {
    let disposed = false;
    let url = "";
    if (!logoId) return;
    void readBrandLogo(window, tenantId, logoId).then(blob => {
      if (disposed) return;
      if (!blob) { setStoredLogo({ logoId, url: "", issue: "The saved logo is unavailable in this browser. Remove it or choose a new file." }); return; }
      url = URL.createObjectURL(blob); setStoredLogo({ logoId, url, issue: "" });
    }).catch(() => { if (!disposed) setStoredLogo({ logoId, url: "", issue: "Local logo storage is unavailable. The default mark is shown." }); });
    return () => { disposed = true; if (url) URL.revokeObjectURL(url); };
  }, [logoId, tenantId]);

  const value = useMemo<BrandingContextValue>(() => ({ branding, logoUrl, storageIssue, applyBranding: async (draft, options = {}) => {
    if (!store) return "Local branding storage is unavailable.";
    const next = parseCentreBranding(draft, BRANDING_TENANT_ID);
    if (Object.keys(validateCentreBranding(next)).length) return "Check the centre name and branch name.";
    const previousLogoId = branding.logoId;
    let nextLogoId = previousLogoId;
    let createdLogoId = "";
    if (options.logoFile) {
      const issue = await validateBrandLogoFile(options.logoFile);
      if (issue) return issue;
      createdLogoId = globalThis.crypto?.randomUUID?.() ?? `logo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      try { await writeBrandLogo(window, next.tenantId, createdLogoId, options.logoFile); nextLogoId = createdLogoId; }
      catch { return "The logo could not be saved in this browser. Check available local storage and try again."; }
    } else if (options.removeLogo) nextLogoId = "";
    const saved = store.save({ ...next, logoId: nextLogoId });
    if (!saved) {
      if (createdLogoId) void deleteBrandLogo(window, next.tenantId, createdLogoId).catch(() => undefined);
      return "Branding could not be saved in local browser storage.";
    }
    if (previousLogoId && previousLogoId !== nextLogoId) void deleteBrandLogo(window, next.tenantId, previousLogoId).catch(() => undefined);
    return null;
  } }), [branding, logoUrl, storageIssue, store]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) throw new Error("useBranding requires BrandingProvider");
  return context;
}
