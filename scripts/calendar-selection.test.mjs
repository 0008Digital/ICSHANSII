import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calendarMonthDate} from '../src/components/ics/date-only.mjs';

test('DOB year selection preserves the day, handles leap years and clamps bounds',()=>{
 for(const year of [1990,2005,2010])assert.equal(calendarMonthDate('2026-10-15',year,10,'1900-01-01','2026-10-13'),`${year}-10-15`);
 assert.equal(calendarMonthDate('2000-02-29',2005,2,'1900-01-01','2026-10-13'),'2005-02-28');
 assert.equal(calendarMonthDate('2000-02-29',2004,2,'1900-01-01','2026-10-13'),'2004-02-29');
 assert.equal(calendarMonthDate('2026-01-31',2026,2,'1900-01-01','2026-10-13'),'2026-02-28');
 assert.equal(calendarMonthDate('2026-10-15',2026,10,'1900-01-01','2026-10-13'),'2026-10-13');
 assert.equal(calendarMonthDate('2026-01-01',1900,1,'1900-01-15','2026-10-13'),'1900-01-15');
});

test('calendar selection supports Gregorian extremes and rejects invalid targets',()=>{
 assert.equal(calendarMonthDate('2000-12-31',9999,12,'0001-01-01','9999-12-31'),'9999-12-31');
 assert.equal(calendarMonthDate('2000-01-31',1,2,'0001-01-01','9999-12-31'),'0001-02-28');
 for(const [year,month] of [[0,1],[10000,1],[2000,0],[2000,13],[2000.5,1]])assert.throws(()=>calendarMonthDate('2000-01-01',year,month,'0001-01-01','9999-12-31'));
});
