// Fictional, internally consistent preview metrics. Replace at the service boundary later.
export const studentPreview = Object.freeze({
  fees: Object.freeze({ totalMinor: 1000000, paidMinor: 700000 }),
  attendance: Object.freeze({ present: 42, absent: 5, leave: 3 }),
  homework: Object.freeze({ completed: 8, assigned: 10 }),
  tests: Object.freeze([{ label: "Mathematics", score: 82 }, { label: "Science", score: 76 }, { label: "English", score: 88 }]),
});
export const dashboardPreview = Object.freeze({
  admin: Object.freeze({ enrollment: Object.freeze([{label:"Aug",value:12,tone:"blue"},{label:"Sep",value:18,tone:"violet"},{label:"Oct",value:16,tone:"teal"}]), attendance: Object.freeze([{label:"Aug",value:88,tone:"green"},{label:"Sep",value:91,tone:"green"},{label:"Oct",value:86,tone:"green"}]), financial: Object.freeze([{label:"Aug",income:65000,expenses:28000,outstanding:25000},{label:"Sep",income:75000,expenses:31000,outstanding:20000},{label:"Oct",income:80000,expenses:35000,outstanding:18000}]) }),
  manager: Object.freeze({ admissions: Object.freeze([{label:"Mon",value:2,tone:"blue"},{label:"Tue",value:4,tone:"violet"},{label:"Wed",value:3,tone:"teal"},{label:"Thu",value:5,tone:"blue"}]), renewals: Object.freeze([{label:"Due soon",value:3,tone:"amber"},{label:"Expired",value:1,tone:"red"},{label:"Completed",value:2,tone:"green"}]) }),
  teacher: Object.freeze({ homework: Object.freeze([{label:"Assigned",value:12,tone:"blue"},{label:"Completed",value:9,tone:"green"}]), performance:Object.freeze([{label:"Mathematics",value:82,tone:"blue"},{label:"Science",value:76,tone:"violet"},{label:"English",value:88,tone:"teal"}]) }),
});
export const studentChartSegments=Object.freeze({fees:Object.freeze([{label:"Paid",value:70,tone:"green"},{label:"Pending",value:30,tone:"amber"}]),attendance:Object.freeze([{label:"Present",value:84,tone:"green"},{label:"Absent",value:10,tone:"red"},{label:"Leave",value:6,tone:"blue"}])});
export function percentageSegments(items) {
 const valid=items.filter(item=>Number.isFinite(item.value)&&item.value>0);
 const total=valid.reduce((sum,item)=>sum+item.value,0);
 if(total<=0)return [];
 let offset=0;
 return valid.map(item=>{const value=item.value/total*100;const result={...item,percent:value,offset};offset+=value;return result;});
}
// A chart fill must stay inside its reserved track, including unavailable/invalid data.
export function chartFraction(value, maximum = 100) {
 if (!Number.isFinite(value) || !Number.isFinite(maximum) || maximum <= 0) return 0;
 return Math.min(1, Math.max(0, value / maximum));
}
export function severityCounts(reports) {
 const levels=["Critical","High","Medium","Low"];
 return levels.map(level=>({label:level,value:reports.filter(report=>report.severity===level).length,tone:level.toLowerCase()}));
}
export function percent(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0 || part < 0) return null;
  return Math.min(100, Math.round((part / total) * 100));
}
export function studentProgress(data = studentPreview) {
  const { totalMinor, paidMinor } = data.fees;
  const paid = percent(paidMinor, totalMinor);
  const attendanceTotal = data.attendance.present + data.attendance.absent + data.attendance.leave;
  return {
    paidPercent: paid,
    remainingMinor: totalMinor >= paidMinor ? totalMinor - paidMinor : 0,
    attendancePercent: percent(data.attendance.present, attendanceTotal),
    attendanceTotal,
    homeworkPercent: percent(data.homework.completed, data.homework.assigned),
  };
}
