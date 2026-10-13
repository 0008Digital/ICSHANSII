import { test } from "node:test";
import assert from "node:assert/strict";
import { BRANDING_TENANT_ID, DEFAULT_BRANDING, MAX_BRAND_LOGO_BYTES, brandAccentInk, brandInitials, brandingStorageKey, createCentreBrandingStore, parseCentreBranding, validateBrandLogoFile, validateBrandLogoMetadata, validateCentreBranding } from "../src/components/ics/branding/branding.ts";

test("branding defaults and parser remain scoped to the current demo centre", () => {
  assert.equal(DEFAULT_BRANDING.tenantId, BRANDING_TENANT_ID);
  const parsed = parseCentreBranding({ tenantId: "another-centre", displayName: "  Hansi Learning  ", logoId: "../unsafe" });
  assert.equal(parsed.tenantId, BRANDING_TENANT_ID);
  assert.equal(parsed.displayName, "Hansi Learning");
  assert.equal(parsed.logoId, "");
  assert.equal(parsed.branchName, DEFAULT_BRANDING.branchName);
});

test("branding validation requires readable centre and branch names", () => {
  const empty = { ...DEFAULT_BRANDING, displayName: "   ", branchName: "" };
  assert.deepEqual(validateCentreBranding(empty), { displayName: "Enter a centre name.", branchName: "Enter a branch name." });
  assert.deepEqual(validateCentreBranding({ ...DEFAULT_BRANDING, shortName: "A name that is too long" }), { shortName: "Use 12 characters or fewer." });
  assert.deepEqual(validateCentreBranding({ ...DEFAULT_BRANDING, brandAccent: "red" }), { brandAccent: "Choose a valid six-digit hex colour." });
});

test("branding draft store applies locally, restores after refresh and isolates tenant keys", () => {
  const values = new Map(); const events = new Map();
  const browser = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }, addEventListener: (name, callback) => events.set(name, callback), removeEventListener: name => events.delete(name) };
  const store = createCentreBrandingStore(browser); let updates = 0;
  const stop = store.subscribe(() => updates++);
  assert.equal(store.save({ ...DEFAULT_BRANDING, displayName: "Hansi Learning Centre" }), true);
  assert.equal(store.getSnapshot().displayName, "Hansi Learning Centre");
  assert.equal(createCentreBrandingStore(browser).getSnapshot().displayName, "Hansi Learning Centre");
  assert.equal(createCentreBrandingStore(browser, "another-centre").getSnapshot().displayName, DEFAULT_BRANDING.displayName);
  assert.notEqual(brandingStorageKey(), brandingStorageKey("another-centre"));
  browser.localStorage.setItem(brandingStorageKey(), JSON.stringify({ ...DEFAULT_BRANDING, displayName: "Updated in another tab" }));
  events.get("storage")({ key: brandingStorageKey() });
  assert.equal(store.getSnapshot().displayName, "Updated in another tab");
  assert.equal(updates, 2); stop(); assert.equal(events.size, 0);
});

test("branding storage failures reject Apply without replacing the live draft", () => {
  const browser = { localStorage: { getItem: () => null, setItem: () => { throw new Error("quota"); } }, addEventListener() {}, removeEventListener() {} };
  const store = createCentreBrandingStore(browser);
  assert.equal(store.save({ ...DEFAULT_BRANDING, displayName: "Not stored" }), false);
  assert.equal(store.getSnapshot().displayName, DEFAULT_BRANDING.displayName);
});

test("logo input is limited to small PNG, JPG and WebP files with matching MIME", () => {
  assert.equal(MAX_BRAND_LOGO_BYTES, 1_000_000);
  assert.equal(validateBrandLogoMetadata({ name: "centre.webp", type: "image/webp", size: 128_000 }), null);
  assert.match(validateBrandLogoMetadata({ name: "centre.svg", type: "image/svg+xml", size: 500 }), /PNG, JPG or WebP/);
  assert.match(validateBrandLogoMetadata({ name: "centre.jpg", type: "image/png", size: 500 }), /PNG, JPG or WebP/);
  assert.match(validateBrandLogoMetadata({ name: "centre.png", type: "image/png", size: 1_000_001 }), /smaller than 1 MB/);
});

test("logo bytes must match the declared image type", async () => {
  const validPng = new File([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], "centre.png", { type: "image/png" });
  const mislabeled = new File(["not an image"], "centre.png", { type: "image/png" });
  assert.equal(await validateBrandLogoFile(validPng), null);
  assert.match(await validateBrandLogoFile(mislabeled), /does not contain a supported image/);
});

test("brand mark initials and accent text contrast are deterministic", () => {
  assert.equal(brandInitials({ ...DEFAULT_BRANDING, shortName: "Hansi Centre" }), "HC");
  assert.equal(brandAccentInk("#ffffff"), "#111827");
  assert.equal(brandAccentInk("#172b22"), "#ffffff");
});
