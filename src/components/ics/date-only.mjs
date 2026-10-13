// Gregorian date-only arithmetic. Never parse YYYY-MM-DD through the local timezone.
export const isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
export const daysInMonth = (year, month) => [31,isLeapYear(year)?29:28,31,30,31,30,31,31,30,31,30,31][month-1] ?? 0;
/** @param {string} value */
export function parseDateOnly(value) {
 const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
 if (!match) return null;
 const [,ys,ms,ds]=match, year=Number(ys), month=Number(ms), day=Number(ds);
 return year>=1 && month>=1 && month<=12 && day>=1 && day<=daysInMonth(year,month) ? {year,month,day} : null;
}
export const dateString = (year,month,day) => `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
/** @param {string} value */
export function utcDate(value) { const p=parseDateOnly(value); if(!p)throw Error('Invalid date-only value'); const d=new Date(0);d.setUTCFullYear(p.year,p.month-1,p.day);d.setUTCHours(12,0,0,0);return d; }
/** @param {string} value @param {number} days */
export function addDays(value,days) {const d=utcDate(value);d.setUTCDate(d.getUTCDate()+days);return dateString(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());}
/** @param {string} value @param {number} months */
export function addMonths(value,months) {const p=parseDateOnly(value);if(!p)throw Error('Invalid date-only value');const n=p.year*12+p.month-1+months,y=Math.floor(n/12),m=(n%12+12)%12+1;return dateString(y,m,Math.min(p.day,daysInMonth(y,m)));}
/** @param {string} value @param {string} min @param {string} max */
export function allowedDate(value,min,max) {return !!parseDateOnly(value)&&value>=min&&value<=max;}
export function localToday() {const d=new Date();return dateString(d.getFullYear(),d.getMonth()+1,d.getDate());}
/** @param {string} value */
export function displayDate(value) {const p=parseDateOnly(value);return p?`${String(p.day).padStart(2,'0')} ${MONTHS[p.month-1]} ${p.year}`:'';}
export const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

/** @param {string} value @returns {(string|null)[]} */
export function monthGrid(value) {
 const p=parseDateOnly(value);if(!p)throw Error('Invalid calendar month');
 const start=utcDate(dateString(p.year,p.month,1));start.setUTCDate(start.getUTCDate()-start.getUTCDay());
 return Array.from({length:42},(_,index)=>{const day=new Date(start.getTime());day.setUTCDate(day.getUTCDate()+index);const year=day.getUTCFullYear();return year>=1&&year<=9999?dateString(year,day.getUTCMonth()+1,day.getUTCDate()):null;});
}

/** Number of complete calendar rows needed to include every day of the displayed month. */
export function monthWeekCount(value) {
 const p=parseDateOnly(value);if(!p)throw Error('Invalid calendar month');
 return Math.ceil((utcDate(dateString(p.year,p.month,1)).getUTCDay()+daysInMonth(p.year,p.month))/7);
}

/** Preserve the day when changing calendar month/year, then apply inclusive bounds. */
export function calendarMonthDate(value,year,month,min,max) {
 const current=parseDateOnly(value);
 if(!current||!Number.isInteger(year)||year<1||year>9999||!Number.isInteger(month)||month<1||month>12)throw Error('Invalid calendar selection');
 const next=dateString(year,month,Math.min(current.day,daysInMonth(year,month)));
 return next<min?min:next>max?max:next;
}
