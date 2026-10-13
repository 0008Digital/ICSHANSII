export const BRANDING_STORAGE_KEY = "ics-hansi.branding.v1";
export const BRANDING_TENANT_ID = "ics-hansi-demo";
export const MAX_BRAND_LOGO_BYTES = 1_000_000;

export type CentreBranding = {
  tenantId: string;
  displayName: string;
  branchName: string;
  shortName: string;
  brandAccent: string;
  logoId: string;
};

export const DEFAULT_BRANDING: CentreBranding = {
  tenantId: BRANDING_TENANT_ID,
  displayName: "ICS Coaching Centre",
  branchName: "Hansi Branch",
  shortName: "ICS",
  brandAccent: "",
  logoId: "",
};

export type BrandingErrors = Partial<Record<"displayName" | "branchName" | "shortName" | "brandAccent", string>>;

export function brandingStorageKey(tenantId = BRANDING_TENANT_ID): string {
  return `${BRANDING_STORAGE_KEY}.${encodeURIComponent(tenantId)}`;
}

export function parseCentreBranding(value: unknown, tenantId = BRANDING_TENANT_ID): CentreBranding {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const text = (key: string, fallback: string, max: number) =>
    typeof input[key] === "string" ? input[key].trim().slice(0, max) : fallback;
  return {
    tenantId,
    displayName: text("displayName", DEFAULT_BRANDING.displayName, 80) || DEFAULT_BRANDING.displayName,
    branchName: text("branchName", DEFAULT_BRANDING.branchName, 80) || DEFAULT_BRANDING.branchName,
    shortName: text("shortName", DEFAULT_BRANDING.shortName, 12),
    brandAccent: typeof input.brandAccent === "string" && /^#[0-9a-f]{6}$/i.test(input.brandAccent) ? input.brandAccent : "",
    logoId: typeof input.logoId === "string" && /^[\w-]{1,80}$/.test(input.logoId) ? input.logoId : "",
  };
}

export function validateCentreBranding(value: CentreBranding): BrandingErrors {
  const errors: BrandingErrors = {};
  if (!value.displayName.trim()) errors.displayName = "Enter a centre name.";
  else if (value.displayName.trim().length > 80) errors.displayName = "Use 80 characters or fewer.";
  if (!value.branchName.trim()) errors.branchName = "Enter a branch name.";
  else if (value.branchName.trim().length > 80) errors.branchName = "Use 80 characters or fewer.";
  if (value.shortName.trim().length > 12) errors.shortName = "Use 12 characters or fewer.";
  if (value.brandAccent && !/^#[0-9a-f]{6}$/i.test(value.brandAccent)) errors.brandAccent = "Choose a valid six-digit hex colour.";
  return errors;
}

export function createCentreBrandingStore(browser: {
  localStorage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void };
  addEventListener: (name: string, listener: (event: { key: string | null }) => void) => void;
  removeEventListener: (name: string, listener: (event: { key: string | null }) => void) => void;
}, tenantId = BRANDING_TENANT_ID) {
  const key = brandingStorageKey(tenantId);
  let current = { ...DEFAULT_BRANDING, tenantId };
  const listeners = new Set<() => void>();
  const read = () => {
    try { current = parseCentreBranding(JSON.parse(browser.localStorage.getItem(key) ?? "{}"), tenantId); }
    catch { current = { ...DEFAULT_BRANDING, tenantId }; }
  };
  read();
  const notify = () => listeners.forEach(listener => listener());
  const onStorage = (event: { key: string | null }) => {
    if (event.key !== key && event.key !== null) return;
    read(); notify();
  };
  return {
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      if (!listeners.size) browser.addEventListener("storage", onStorage);
      listeners.add(listener);
      return () => { listeners.delete(listener); if (!listeners.size) browser.removeEventListener("storage", onStorage); };
    },
    save(value: CentreBranding) {
      const next = parseCentreBranding(value, tenantId);
      if (Object.keys(validateCentreBranding(next)).length) return false;
      try { browser.localStorage.setItem(key, JSON.stringify(next)); current = next; notify(); return true; }
      catch { return false; }
    },
  };
}

export function validateBrandLogoMetadata(file: Pick<File, "name" | "type" | "size">): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const accepted: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
  if (!extension || !accepted[extension] || file.type !== accepted[extension]) return "Choose a PNG, JPG or WebP image.";
  if (!file.size || file.size > MAX_BRAND_LOGO_BYTES) return "Logo images must be smaller than 1 MB.";
  return null;
}

export async function validateBrandLogoFile(file: File): Promise<string | null> {
  const metadataError = validateBrandLogoMetadata(file);
  if (metadataError) return metadataError;
  try {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const png = file.type === "image/png" && bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
    const jpeg = file.type === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = file.type === "image/webp" && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
    if (!png && !jpeg && !webp) return "That file does not contain a supported image.";
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file);
      const valid = bitmap.width > 0 && bitmap.height > 0 && bitmap.width <= 4096 && bitmap.height <= 4096;
      bitmap.close();
      if (!valid) return "Logo images must be no larger than 4096 × 4096 pixels.";
    }
    return null;
  } catch {
    return "The image could not be decoded. Choose another file.";
  }
}

export function brandInitials(value: CentreBranding): string {
  const source = value.shortName.trim() || value.displayName;
  return source.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase().slice(0, 3) || "ICS";
}

export function brandAccentInk(hex: string): "#ffffff" | "#111827" {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#111827";
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.42 ? "#111827" : "#ffffff";
}
