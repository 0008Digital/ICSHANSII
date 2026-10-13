import { parseDateOnly } from "../date-only.mjs";

export const paymentModes = ["Cash", "UPI", "Bank Transfer", "Card", "Other"];

export function remainingFeeMinor(totalFeeMinor, paidMinor) {
 if (!Number.isSafeInteger(totalFeeMinor) || totalFeeMinor < 0 || !Number.isSafeInteger(paidMinor) || paidMinor < 0 || paidMinor > totalFeeMinor) return null;
 return totalFeeMinor - paidMinor;
}

export function feeStatus(balanceMinor, promisedPaymentDate, today) {
 if (!Number.isSafeInteger(balanceMinor) || balanceMinor < 0 || !parseDateOnly(today)) return "Unavailable";
 if (balanceMinor === 0) return "Paid";
 if (promisedPaymentDate && parseDateOnly(promisedPaymentDate) && today > promisedPaymentDate) return "Expired Fees";
 return "Pending";
}

export function daysOverdue(promisedPaymentDate, today) {
 if (!parseDateOnly(promisedPaymentDate) || !parseDateOnly(today) || today <= promisedPaymentDate) return 0;
 return Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${promisedPaymentDate}T00:00:00Z`)) / 86400000);
}

export function validatePaymentPreview({ amountMinor, balanceMinor, paymentDate, paymentMode, reference = "", promisedPaymentDate = "", today }) {
 const errors = {};
 if (!Number.isSafeInteger(balanceMinor) || balanceMinor <= 0) errors.balance = "A connected outstanding balance is required for a payment preview.";
 if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) errors.amount = "Enter a payment amount greater than zero.";
 else if (Number.isSafeInteger(balanceMinor) && amountMinor > balanceMinor) errors.amount = "Payment cannot exceed the outstanding balance.";
 if (!paymentModes.includes(paymentMode)) errors.paymentMode = "Choose a payment mode.";
 if (!parseDateOnly(paymentDate) || paymentDate > today) errors.paymentDate = "Choose a valid payment date no later than today.";
 if (paymentMode && paymentMode !== "Cash" && !reference.trim()) errors.reference = "Enter the transaction reference for this payment mode.";
 if (reference.length > 100) errors.reference = "Keep the transaction reference within 100 characters.";
 if (promisedPaymentDate && (!parseDateOnly(promisedPaymentDate) || promisedPaymentDate < today)) errors.promisedPaymentDate = "Choose today or a future promised payment date.";
 return errors;
}

export function summarizeFees(totalFeeMinor, payments = []) {
 if (!Number.isSafeInteger(totalFeeMinor) || totalFeeMinor < 0) return { totalFeeMinor: null, totalPaidMinor: null, remainingMinor: null };
 const totalPaidMinor = payments.reduce((sum, payment) => sum + (Number.isSafeInteger(payment.amountMinor) && payment.amountMinor >= 0 ? payment.amountMinor : 0), 0);
 return { totalFeeMinor, totalPaidMinor, remainingMinor: remainingFeeMinor(totalFeeMinor, totalPaidMinor) };
}

/**
 * Future immutable payment event contract. Receipt and actor values must only
 * be populated by a trusted authorized backend; demo UI never creates events.
 */
export function paymentHistoryRow(payment) {
 return {
  permanentStudentId: payment.permanentStudentId ?? "",
  enrollmentReference: payment.enrollmentReference ?? "",
  amountMinor: payment.amountMinor,
  paymentDate: payment.paymentDate,
  recordedAt: payment.recordedAt,
  paymentMode: payment.paymentMode,
  transactionReference: payment.transactionReference ?? "",
  receiptNumber: payment.receiptNumber ?? "",
  recordedBy: payment.recordedBy ?? "",
  correctionOf: payment.correctionOf ?? "",
  reversalOf: payment.reversalOf ?? "",
 };
}
