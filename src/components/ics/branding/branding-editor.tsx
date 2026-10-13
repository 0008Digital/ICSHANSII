"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties } from "react";
import { brandAccentInk, brandInitials, validateBrandLogoFile, validateCentreBranding, type BrandingErrors, type CentreBranding } from "./branding";
import { useBranding } from "./branding-provider";
import { ColorPicker } from "../color-picker";

export function BrandingEditor() {
  const { branding, logoUrl, storageIssue, applyBranding } = useBranding();
  const key = JSON.stringify(branding);
  return <BrandingEditorForm key={key} branding={branding} logoUrl={logoUrl} storageIssue={storageIssue} applyBranding={applyBranding}/>;
}

function BrandingEditorForm({ branding, logoUrl, storageIssue, applyBranding }: { branding: CentreBranding; logoUrl: string; storageIssue: string; applyBranding: ReturnType<typeof useBranding>["applyBranding"] }) {
  const [draft, setDraft] = useState(branding);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [errors, setErrors] = useState<BrandingErrors & { logo?: string }>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const logoPreview = useMemo(() => logoFile ? URL.createObjectURL(logoFile) : "", [logoFile]);
  useEffect(() => () => { if (logoPreview) URL.revokeObjectURL(logoPreview); }, [logoPreview]);

  const change = (field: keyof CentreBranding, value: string) => {
    setDraft(current => ({ ...current, [field]: value })); setMessage("");
    setErrors(current => ({ ...current, [field]: undefined }));
  };

  async function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
    if (!file) return;
    const issue = await validateBrandLogoFile(file);
    if (issue) { setLogoFile(null); setErrors(current => ({ ...current, logo: issue })); return; }
    setErrors(current => ({ ...current, logo: undefined })); setLogoFile(file); setRemoveLogo(false); setMessage("Logo preview ready. Apply to save it on this device.");
  }

  async function apply() {
    const nextErrors = validateCentreBranding(draft); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setMessage("Correct the highlighted fields before applying."); return; }
    setBusy(true); setMessage("");
    const issue = await applyBranding(draft, { logoFile, removeLogo });
    setBusy(false);
    if (issue) { setMessage(issue); return; }
    setLogoFile(null); setRemoveLogo(false); setMessage("Applied to this centre preview on this device. No backend record was changed.");
  }

  const previewUrl = logoPreview || (!removeLogo ? logoUrl : "");
  const previewStyle = { "--brand-preview-accent": draft.brandAccent || "var(--accent)", "--brand-preview-ink": draft.brandAccent ? brandAccentInk(draft.brandAccent) : "var(--accent-ink)" } as CSSProperties;

  return <section className="branding-settings" aria-labelledby="branding-title">
    <h2 id="branding-title">Centre branding</h2>
    <p className="branding-scope">Centre Admin preview · Current demo centre only. Changes are stored on this device and are not saved to Supabase, shared with other devices or authorized by a real sign-in.</p>
    <div className="branding-editor">
      <form className="branding-fields" onSubmit={event => { event.preventDefault(); void apply(); }} noValidate>
        <label htmlFor="brand-centre-name">Centre display name<input id="brand-centre-name" maxLength={80} required value={draft.displayName} aria-invalid={!!errors.displayName} aria-describedby={errors.displayName ? "brand-centre-name-error" : undefined} onChange={event => change("displayName", event.currentTarget.value)}/>{errors.displayName && <span id="brand-centre-name-error" className="field-error">{errors.displayName}</span>}</label>
        <label htmlFor="brand-branch-name">Branch display name<input id="brand-branch-name" maxLength={80} required value={draft.branchName} aria-invalid={!!errors.branchName} aria-describedby={errors.branchName ? "brand-branch-name-error" : undefined} onChange={event => change("branchName", event.currentTarget.value)}/>{errors.branchName && <span id="brand-branch-name-error" className="field-error">{errors.branchName}</span>}</label>
        <label htmlFor="brand-short-name">Optional short name<input id="brand-short-name" maxLength={12} value={draft.shortName} aria-invalid={!!errors.shortName} aria-describedby={errors.shortName ? "brand-short-name-error" : undefined} onChange={event => change("shortName", event.currentTarget.value)}/>{errors.shortName && <span id="brand-short-name-error" className="field-error">{errors.shortName}</span>}</label>
        <div className="branding-accent-field"><ColorPicker label="Brand mark accent" description="Optional · does not change the app accent" value={draft.brandAccent || "#7896ff"} onChange={value => change("brandAccent", value)}/><button type="button" className="secondary-action" onClick={() => change("brandAccent", "")}>Use application accent</button></div>
        <label className="branding-logo-field" htmlFor="brand-logo">Logo <span className="branding-optional">PNG, JPG or WebP · up to 1 MB · stays in this browser</span><input id="brand-logo" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={event => void chooseLogo(event)}/>{errors.logo && <span className="field-error">{String(errors.logo)}</span>}</label>
        <div className="branding-actions"><button type="submit" disabled={busy}>{busy ? "Applying…" : "Apply branding"}</button><button type="button" className="secondary-action" disabled={busy} onClick={() => { setDraft(branding); setLogoFile(null); setRemoveLogo(false); setErrors({}); setMessage("Draft reset to the branding currently applied on this device."); }}>Reset draft</button>{(logoFile || branding.logoId) && <button type="button" className="secondary-action" disabled={busy} onClick={() => { setLogoFile(null); setRemoveLogo(true); setMessage("Logo removal is in the draft. Apply branding to confirm it."); }}>Remove logo</button>}</div>
        <p className="branding-message" role="status" aria-live="polite">{message || storageIssue || "Preview your draft first. Apply updates this device-local demo only."}</p>
      </form>
      <aside className="branding-preview" aria-label="Centre branding preview">
        <span className="branding-preview-label">Preview</span>
        <div className="branding-preview-identity" style={previewStyle}>
          {previewUrl ? <Image src={previewUrl} width={48} height={48} alt="" unoptimized className="branding-preview-logo"/> : <span className="brand-symbol branding-preview-mark" aria-hidden="true">{brandInitials(draft)}</span>}
          <span><strong>{draft.displayName || "Centre name"}</strong><small>{draft.branchName || "Branch name"}</small></span>
        </div>
        <p>The sidebar and workspace header use applied branding for this browser.</p>
      </aside>
    </div>
  </section>;
}
