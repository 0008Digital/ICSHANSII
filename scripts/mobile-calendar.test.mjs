import {test} from "node:test";
import assert from "node:assert/strict";
import {monthGrid,monthWeekCount,parseDateOnly,daysInMonth} from "../src/components/ics/date-only.mjs";
test("compact calendars use four, five or six rows without losing leap days",()=>{
 assert.equal(monthWeekCount("2026-02-01"),4);assert.equal(monthWeekCount("2024-02-01"),5);assert.equal(monthWeekCount("2020-08-01"),6);
 assert.throws(()=>monthWeekCount("2025-02-29"),/Invalid/);
});
test("every date remains reachable in compact grids, including Gregorian boundaries",()=>{
 for(const year of [1,1900,2000,2024,2026,2100,9999])for(let month=1;month<=12;month++){
  const date=`${String(year).padStart(4,"0")}-${String(month).padStart(2,"0")}-01`;
  const days=monthGrid(date).slice(0,monthWeekCount(date)*7).filter(day=>day&&parseDateOnly(day).month===month);
  assert.equal(days.length,daysInMonth(year,month));assert.equal(parseDateOnly(days.at(-1)).day,daysInMonth(year,month));
 }
});
