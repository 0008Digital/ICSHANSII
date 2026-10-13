// Date-only enrollment helpers. All demo dates are centre-local calendar dates (YYYY-MM-DD).
export const DEFAULT_EXPIRY_WARNING_DAYS = 30;
const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const dayNumber = (value) => Date.parse(`${value}T00:00:00Z`) / 86400000;
export function addDaysDateOnly(date, days) {
 if(!validDate(date)||!Number.isInteger(days))return "";
 return new Date(Date.parse(`${date}T00:00:00Z`)+days*86400000).toISOString().slice(0,10);
}

export function validateBatchPeriod(start, end) {
  if (!validDate(start) || !validDate(end)) return { valid: false, error: "Enter valid start and end dates." };
  if (end < start) return { valid: false, error: "End date cannot precede start date." };
  return { valid: true, error: "" };
}
export function validateCustomBatch({ name, startDate, endDate, capacity = "" }) {
 const errors={};
 if(typeof name!=="string"||name.trim().length<2||name.trim().length>80)errors.name="Enter a batch name between 2 and 80 characters.";
 const dates=validateBatchPeriod(startDate,endDate);if(!dates.valid)errors.endDate=dates.error;
 if(capacity!==""&&!/^[1-9]\d{0,3}$/.test(String(capacity)))errors.capacity="Capacity must be a positive whole number or left blank.";
 return errors;
}

export function enrollmentSnapshot({ startDate, endDate, status = "Active" }, today, warningDays = DEFAULT_EXPIRY_WARNING_DAYS) {
  if (!validDate(today) || !validDate(startDate) || !validDate(endDate) || !validateBatchPeriod(startDate, endDate).valid) return { status: "Invalid", daysRemaining: null, eligibleForRenewal: false };
  const remaining = dayNumber(endDate) - dayNumber(today);
  if (["Completed", "Left"].includes(status)) return { status, daysRemaining: remaining, eligibleForRenewal: false };
  if (["Transferred", "Cancelled"].includes(status)) return { status, daysRemaining: remaining, eligibleForRenewal: false };
  if (today < startDate) return { status: "Upcoming", daysRemaining: remaining, eligibleForRenewal: false };
  if (remaining < 0) return { status: "Expired", daysRemaining: remaining, eligibleForRenewal: true };
  if (remaining <= warningDays) return { status: "Expiring Soon", daysRemaining: remaining, eligibleForRenewal: true };
  return { status: "Active", daysRemaining: remaining, eligibleForRenewal: false };
}

export function enrollmentDisplayStatus(status) {
 if(status==="Expiring Soon")return "Renewal Due";
 if(status==="Expired")return "Expired Enrollment";
 return status;
}

// Periods are inclusive date-only ranges. An adjacent next-day renewal does not overlap.
export function enrollmentPeriodsOverlap(a, b) {
  if (!validateBatchPeriod(a?.startDate, a?.endDate).valid || !validateBatchPeriod(b?.startDate, b?.endDate).valid) return false;
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

export function validateRenewal(next, history = [], today = new Date().toISOString().slice(0, 10)) {
  const errors = {};
  if (!next?.batch) errors.batch = "Choose an approved batch.";
  if (next?.currentBatch && next.batch !== next.currentBatch && next.authorizedBatchChange !== true) errors.batch = "Changing batch requires an explicit authorized transfer grant.";
  const dates = validateBatchPeriod(next?.startDate, next?.endDate);
  if (!dates.valid) errors.endDate = dates.error;
  if (next?.startDate < today) errors.startDate = "Renewal cannot start before today.";
  if (history.some((period) => enrollmentPeriodsOverlap(next, period))) errors.overlap = "This validity period overlaps an existing enrollment period.";
  const fee = String(next?.fee ?? "").trim();
  if (fee && !/^\d{1,8}(?:\.\d{1,2})?$/.test(fee)) errors.fee = "Enter a non-negative amount with up to two decimal places.";
  return errors;
}

export function addMonthsDateOnly(date, months) {
  if (!validDate(date) || !Number.isInteger(months)) return "";
  const [year, month, day] = date.split("-").map(Number);
  const targetMonth = month - 1 + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay))).toISOString().slice(0, 10);
}
export function enrollmentEndForDuration(startDate, months) {
 const anniversary=addMonthsDateOnly(startDate,months);
 return validDate(anniversary)?new Date(Date.parse(`${anniversary}T00:00:00Z`)-86400000).toISOString().slice(0,10):"";
}

// Renewal is due on the anniversary after a duration. Enrollment periods are
// inclusive, so their final day is the previous calendar day. When the source
// date is a month-end, the anniversary clamps to the target month's last day.
export function renewalDueDateForDuration(startDate, months) {
 return addMonthsDateOnly(startDate,months);
}

export const demoEnrollmentByStudent = {
  "DEMO-001": { startDate: "2026-01-01", endDate: "2026-12-31", batch: "New General", rollNumber: "Not issued" },
  "DEMO-002": { startDate: "2025-08-01", endDate: "2026-10-20", batch: "Old General", rollNumber: "Not issued" },
  "DEMO-003": { startDate: "2026-09-01", endDate: "2026-10-25", batch: "New Guarantee", rollNumber: "Not issued" },
  "DEMO-004": { startDate: "2025-06-01", endDate: "2026-08-31", batch: "Old Guarantee", rollNumber: "Not issued" },
  "DEMO-005": { startDate: "2026-10-01", endDate: "2027-03-31", batch: "Weekend Practice (demo custom)", rollNumber: "Not issued" },
};
