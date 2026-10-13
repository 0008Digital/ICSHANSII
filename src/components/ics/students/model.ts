import {allowedDate,localToday,parseDateOnly} from "../date-only.mjs";
import {demoEnrollmentByStudent,enrollmentSnapshot} from "./lifecycle.mjs";
// Fictional fixtures only. No official identifiers, writes or browser persistence.
export const defaultBatches = ["New General", "Old General", "New Guarantee", "Old Guarantee"] as const;
export const batches = [...defaultBatches, "Weekend Practice (demo custom)"];
export const statuses = ["Active", "Pending", "Inactive"] as const;
export type StudentStatus = typeof statuses[number];
export type StudentDetails = { name: string; fatherName: string; motherName: string; guardianPhone: string; studentPhone: string; address: string; birthDate?:string };
export type AdmissionDraft = StudentDetails & {
 batch: string;
 admissionDate?:string;
 paperRegistrationNumber?:string;
 batchDuration?:string;
 customDurationMonths?:string;
 totalFees?:string;
 amountPaid?:string;
 promisedPaymentDate?:string;
 promiseDateRequested?:boolean;
 // Retained for older local drafts; the compact admission form does not expose them.
 preparingFor?:string; previousQualification?:string; agreedCourseFee?:string; initialPayment?:string; paymentMethod?:string; paymentDate?:string; paymentReference?:string; feeNotes?:string; admissionSource?:string; referralInformation?:string; emergencyContact?:string; internalRemarks?:string; status?:StudentStatus
};
export type DemoStudent = StudentDetails & { id: string; permanentStudentId?:string; batch: string; status: StudentStatus; legacyContactPhone?:string; legacyFatherPhone?:string; legacyMotherPhone?:string; paperRegistrationNumber?:string; batchRollNumber?:string; admissionDate?:string; preparingFor?:string };
export const students: DemoStudent[] = [
 { id: "DEMO-001", name: "Aarav Example", fatherName: "", motherName: "", guardianPhone: "", studentPhone: "", legacyContactPhone: "00000 00001", address: "Example Lane A (fictional)", batch: "New General", batchRollNumber:"101", status: "Active" },
 { id: "DEMO-002", name: "Diya Example", fatherName: "", motherName: "", guardianPhone: "", studentPhone: "", legacyContactPhone: "00000 00002", address: "Example Lane B (fictional)", batch: "Old General", batchRollNumber:"201", status: "Active" },
 { id: "DEMO-003", name: "Kabir Example", fatherName: "", motherName: "", guardianPhone: "", studentPhone: "", legacyContactPhone: "00000 00003", address: "Example Lane C (fictional)", batch: "New Guarantee", batchRollNumber:"301", status: "Pending" },
 { id: "DEMO-004", name: "Meera Example", fatherName: "", motherName: "", guardianPhone: "", studentPhone: "", legacyContactPhone: "00000 00004", address: "Example Lane D (fictional)", batch: "Old Guarantee", batchRollNumber:"401", status: "Inactive" },
 { id: "DEMO-005", name: "Riya Example", fatherName: "", motherName: "", guardianPhone: "", studentPhone: "", legacyContactPhone: "00000 00005", address: "Example Lane E (fictional)", batch: "Weekend Practice (demo custom)", batchRollNumber:"501", status: "Active" },
];
export function groupStudentsByBatch(rows:DemoStudent[]) {
 const grouped=new Map<string,{key:string;label:string;kind:"official"|"custom-demo"|"unassigned-legacy";rows:DemoStudent[]}>();
 for(const student of rows){
  const name=student.batch.trim();
  const official=(defaultBatches as readonly string[]).includes(name);
  const custom=!official&&(batches as readonly string[]).includes(name);
  const key=official||custom?name:"unassigned-legacy";
  const existing=grouped.get(key);
  if(existing)existing.rows.push(student);
  else grouped.set(key,{key,label:official?name:custom?`${name} · custom demo`:"Unassigned / legacy demo",kind:official?"official":custom?"custom-demo":"unassigned-legacy",rows:[student]});
 }
 return [...grouped.values()].sort((a,b)=>{
  const ai=(defaultBatches as readonly string[]).indexOf(a.key),bi=(defaultBatches as readonly string[]).indexOf(b.key);
  if(ai>=0&&bi>=0)return ai-bi;
  if(ai>=0)return -1;if(bi>=0)return 1;
  return a.label.localeCompare(b.label);
 });
}
export function filterStudents(query: string, batch: string, status: string, enrollmentStatus = "", today = localToday()) {
 const q = query.trim().toLowerCase();
 const digits = q.replace(/\D/g, "");
 return students.filter(s => {
  const enrollment = enrollmentSnapshotFor(s.id, today);
  return (!batch || s.batch === batch) && (!status || s.status === status) && (!enrollmentStatus || enrollment.status === enrollmentStatus) &&
   (!q || [s.name,s.id,s.permanentStudentId??"",s.paperRegistrationNumber??"",s.guardianPhone,s.studentPhone,s.legacyContactPhone??"",s.legacyFatherPhone??"",s.legacyMotherPhone??"",s.fatherName,s.motherName,s.batchRollNumber??""].some(value=>value.toLowerCase().includes(q)) ||
    (/^[+\d\s()-]+$/.test(q) && !!digits && [s.guardianPhone,s.studentPhone,s.legacyContactPhone??"",s.legacyFatherPhone??"",s.legacyMotherPhone??""].some(phone=>phone.replace(/\D/g, "").includes(digits))));
 });
}
// Country-specific adapter: later countries must add explicit rules rather than accepting arbitrary digits.
export function normalizeMobile(input:string,country="IN"):string|null {
 const text=input.trim();
 if(country!=="IN"||!/^\+?[\d ()-]+$/.test(text))return null;
 const digits=text.replace(/\D/g,"");
 const national=digits.length===12&&digits.startsWith("91")?digits.slice(2):digits;
 if(text.startsWith("+")&&!(digits.length===12&&digits.startsWith("91")))return null;
 return /^[6-9]\d{9}$/.test(national)?`+91${national}`:null;
}
export function studentContact(student:DemoStudent) {return student.guardianPhone||student.studentPhone||student.legacyContactPhone||"Not provided";}
export function studentContactLabel(student:DemoStudent) {return student.guardianPhone?"Parent / guardian":student.studentPhone?"Student personal":"Unclassified legacy contact";}
export function validateDetails(value: StudentDetails) {
 const errors: Partial<Record<keyof AdmissionDraft, string>> = {};
 if (value.name.trim().length < 2 || value.name.trim().length > 100) errors.name = "Enter a name between 2 and 100 characters.";
 for(const key of ["fatherName","motherName"] as const) if(value[key].trim().length<2||value[key].trim().length>100) errors[key]=`Enter ${key==="fatherName"?"father's":"mother's"} name between 2 and 100 characters.`;
 if(!/^[6-9]\d{9}$/.test(value.guardianPhone.trim())) errors.guardianPhone="Enter a 10-digit parent / guardian mobile number starting with 6–9.";
 if(value.studentPhone.trim()&&!/^[6-9]\d{9}$/.test(value.studentPhone.trim()))errors.studentPhone="Enter a 10-digit student mobile number starting with 6–9, or leave blank.";
 if (value.address.length > 300) errors.address = "Keep the address within 300 characters.";
 if(value.birthDate && !allowedDate(value.birthDate,"1900-01-01",localToday())) errors.birthDate="Choose a valid date of birth, from 1900 through today.";
 return errors;
}
export function validateAdmission(value: AdmissionDraft) {
 const errors = validateDetails(value);
 const registrationNumber=(value.paperRegistrationNumber??"").trim();
 if(registrationNumber.length<1||registrationNumber.length>40)errors.paperRegistrationNumber="Enter the Registration Number recorded by the office (1–40 characters).";
 if(!value.admissionDate)errors.admissionDate="Choose an admission date for this preview.";
 else if(!allowedDate(value.admissionDate,"1900-01-01",localToday()))errors.admissionDate="Choose a valid admission preview date, from 1900 through today.";
 if(value.birthDate && value.admissionDate && parseDateOnly(value.birthDate) && parseDateOnly(value.admissionDate) && value.admissionDate<value.birthDate)errors.admissionDate="Admission date cannot precede date of birth.";
 if (!batches.includes(value.batch)) errors.batch = "Choose a batch from the approved demo catalogue.";
 const duration=value.batchDuration??"";
 if(!["1","2","3","6","12","custom"].includes(duration))errors.batchDuration="Choose a batch duration.";
 if(duration==="custom"&&(!/^\d{1,3}$/.test(value.customDurationMonths??"")||Number(value.customDurationMonths)<1||Number(value.customDurationMonths)>120))errors.customDurationMonths="Enter a custom duration from 1 to 120 months.";
 for(const key of ["totalFees","amountPaid"] as const){const amount=value[key]??"";if(!amount||parseMoneyMinor(amount)===null)errors[key]=`${key==="totalFees"?"Total Fees":"Amount Paid"} must be a non-negative amount with up to two decimal places.`;}
 const total=parseMoneyMinor(value.totalFees??""),paid=parseMoneyMinor(value.amountPaid??"");
 if(total!==null&&paid!==null&&paid>total)errors.amountPaid="Amount Paid cannot exceed Total Fees.";
 if(paid!==null&&paid>0){
  if(!value.paymentMethod||!( ["Cash","UPI","Bank Transfer","Card","Other"] as const).includes(value.paymentMethod as "Cash"|"UPI"|"Bank Transfer"|"Card"|"Other"))errors.paymentMethod="Choose the payment mode for the amount noted.";
  if(value.paymentMethod&&value.paymentMethod!=="Cash"&&!(value.paymentReference??"").trim())errors.paymentReference="Enter the transaction reference for this payment mode.";
  if(value.paymentReference&&value.paymentReference.length>100)errors.paymentReference="Keep the transaction reference within 100 characters.";
  if(!value.paymentDate||!allowedDate(value.paymentDate,"1900-01-01",localToday()))errors.paymentDate="Choose a valid date for this unconfirmed payment note.";
 }
 const remaining=total!==null&&paid!==null&&paid<=total?total-paid:null;
 if((remaining??0)>0&&value.promiseDateRequested&&!value.promisedPaymentDate)errors.promisedPaymentDate="Choose a promised payment date.";
 if((remaining??0)>0&&value.promisedPaymentDate&&!allowedDate(value.promisedPaymentDate,value.admissionDate||localToday(),"2100-12-31"))errors.promisedPaymentDate="Choose a date on or after admission.";
 if(value.status&&!statuses.includes(value.status))errors.status="Choose an available student status.";
 return errors;
}

export function parseMoneyMinor(value:string):number|null {
 if(!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(value))return null;
 const [whole,fraction=""]=value.split(".");
 return Number(whole)*100+Number(fraction.padEnd(2,"0"));
}
export function admissionPaymentFieldState(amountInput:string){const amount=parseMoneyMinor(amountInput);return {visible:true,disabled:amount===null||amount<=0,referenceRequired:amount!==null&&amount>0};}
export function formatMoneyMinor(value:number):string{return `₹${Math.floor(value/100).toLocaleString("en-IN")}.${String(value%100).padStart(2,"0")}`;}

export function enrollmentSnapshotFor(studentId:string,today=localToday()) {
 const enrollment=demoEnrollmentByStudent[studentId as keyof typeof demoEnrollmentByStudent];
 return enrollment ? enrollmentSnapshot(enrollment,today) : {status:"Unavailable",daysRemaining:null,eligibleForRenewal:false};
}

// All overview figures are calculated from the same fictional directory and
// enrollment fixtures used by Students and Batches. Fee data does not exist.
export function studentOverview(today=localToday()) {
 const enrollmentRows=Object.entries(demoEnrollmentByStudent).map(([id,enrollment])=>({id,...enrollment,status:enrollmentSnapshot(enrollment,today).status}));
 const activeBatchNames=new Set(enrollmentRows.filter(row=>["Active","Expiring Soon"].includes(row.status)).map(row=>row.batch));
 return {
  activeStudents:students.filter(student=>student.status==="Active").length,
  inactiveStudents:students.filter(student=>student.status==="Inactive").length,
  totalEnrollments:enrollmentRows.length,
  feeDueCases:null as number|null,
  expiringSoon:enrollmentRows.filter(row=>row.status==="Expiring Soon").length,
  expiredEnrollments:enrollmentRows.filter(row=>row.status==="Expired").length,
  activeBatches:activeBatchNames.size,
 };
}
