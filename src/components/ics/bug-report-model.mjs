const categories = ["Interface", "Accessibility", "Performance", "Other"];
export function validateBugReport(value) {
 const errors = {};
 const title = String(value.title ?? "").trim();
 const happened = String(value.happened ?? "").trim();
 const expected = String(value.expected ?? "").trim();
 const steps = String(value.steps ?? "").trim();
 if (title.length < 4 || title.length > 120) errors.title = "Use 4–120 characters.";
 if (happened.length < 8 || happened.length > 2000) errors.happened = "Use 8–2,000 characters.";
 if (expected.length < 8 || expected.length > 2000) errors.expected = "Use 8–2,000 characters.";
 if (!categories.includes(value.category)) errors.category = "Choose a valid category.";
 if (steps.length > 2000) errors.steps = "Keep steps within 2,000 characters.";
 if (value.attachment && (!/^image\/(png|jpeg|webp)$/.test(value.attachment.type) || value.attachment.size > 5_000_000)) errors.attachment = "Choose a PNG, JPG or WebP image under 5 MB.";
 return errors;
}
