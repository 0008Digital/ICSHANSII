export function validateAssessment({subject, testDate, maximumMarks, students}, marks, absentIds = []) {
 const errors={};
 if(typeof subject!=="string"||subject.trim().length<2||subject.trim().length>80)errors.subject="Enter a subject between 2 and 80 characters.";
 const parsedDate=typeof testDate==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(testDate)?new Date(`${testDate}T00:00:00Z`):null;
 if(!parsedDate||Number.isNaN(parsedDate.valueOf())||parsedDate.toISOString().slice(0,10)!==testDate)errors.testDate="Choose a valid test date.";
 const maximum=Number(maximumMarks);
 if(!Number.isFinite(maximum)||maximum<=0||maximum>10000)errors.maximumMarks="Maximum marks must be greater than zero and no more than 10,000.";
 const absent=new Set(absentIds);
 for(const student of students){
  if(absent.has(student.id))continue;
  const value=String(marks[student.id]??"").trim();
  if(!value){errors[`mark:${student.id}`]=`Enter marks for ${student.name} or mark the student absent.`;continue;}
  if(!/^(?:0|[1-9]\d{0,3})(?:\.\d{1,2})?$/.test(value)||Number(value)>maximum)errors[`mark:${student.id}`]=`Enter a valid score from 0 to ${maximum} for ${student.name}.`;
 }
 return errors;
}

export function rankAssessmentPreview(students, marks, absentIds = []) {
 const absent=new Set(absentIds);
 const ranked=students.filter(student=>!absent.has(student.id)&&String(marks[student.id]??"").trim()!=="")
  .map(student=>({studentId:student.id,name:student.name,marks:Number(marks[student.id])}))
  .sort((a,b)=>b.marks-a.marks||a.name.localeCompare(b.name));
 let previous=null,rank=0;
 const withRanks=ranked.map((row,index)=>{if(previous!==row.marks)rank=index+1;previous=row.marks;return {...row,rank};});
 return {ranked:withRanks,absent:students.filter(student=>absent.has(student.id)),notMarked:students.filter(student=>!absent.has(student.id)&&String(marks[student.id]??"").trim()==="")};
}

// Weekly rankings are only meaningful when the same published tests exist for
// each student. Unsaved previews and incomplete records are excluded.
export function weeklyLeaderboardAvailability(tests,roster=[]) {
 if(!Array.isArray(tests)||tests.length===0)return {available:false,reason:"No published results are connected for this week."};
 if(tests.some(test=>test.status!=="published"))return {available:false,reason:"Unpublished or incomplete results cannot be ranked."};
 if(tests.some(test=>!test.id||!Number.isFinite(Number(test.maximumMarks))||Number(test.maximumMarks)<=0))return {available:false,reason:"Every published test needs a valid maximum mark before percentages can be compared."};
 if(new Set(tests.map(test=>test.id)).size!==tests.length)return {available:false,reason:"Duplicate test records cannot be ranked."};
 const testIds=new Set(tests.map(test=>test.id));
 const studentSets=new Map();
 for(const test of tests){
  if(!Array.isArray(test.results)||test.results.length===0)return {available:false,reason:"No published result rows are connected for every test."};
  const seen=new Set();
  for(const result of test.results){
  if(!result.studentId)return {available:false,reason:"A result is missing its student reference."};
  if(seen.has(result.studentId))return {available:false,reason:"Duplicate student results cannot be ranked."};
  seen.add(result.studentId);
  if(!result.absent&&(!Number.isFinite(Number(result.marks))||Number(result.marks)<0||Number(result.marks)>Number(test.maximumMarks)))return {available:false,reason:"Invalid marks cannot be ranked."};
  const set=studentSets.get(result.studentId)??new Set();set.add(test.id);studentSets.set(result.studentId,set);
  }
 }
 if([...studentSets.values()].some(set=>set.size!==testIds.size))return {available:false,reason:"Students do not have results for the same complete set of published tests."};
 if(roster.some(student=>!studentSets.has(student.id)))return {available:false,reason:"The complete batch roster is not represented in the published test set."};
 return {available:true,reason:"Percentages are averaged across the same complete published test set. Students absent from any test are omitted; equal averages share competition rank."};
}

export function rankWeeklyPreview(tests,students=[]) {
 const availability=weeklyLeaderboardAvailability(tests,students);
 if(!availability.available)return {...availability,ranked:[]};
 const byStudent=new Map();
 for(const test of tests)for(const result of test.results??[]){
  const current=byStudent.get(result.studentId)??{studentId:result.studentId,name:result.name??students.find(student=>student.id===result.studentId)?.name??result.studentId,percentages:[],absent:false};
  if(result.absent)current.absent=true;
  else current.percentages.push(Number(result.marks)/Number(test.maximumMarks)*100);
  byStudent.set(result.studentId,current);
 }
 const ranked=[...byStudent.values()].filter(student=>!student.absent&&student.percentages.length===tests.length)
  .map(student=>({...student,percentage:Math.round(student.percentages.reduce((sum,value)=>sum+value,0)/student.percentages.length*1_000_000)/1_000_000}))
  .sort((a,b)=>b.percentage-a.percentage||a.name.localeCompare(b.name));
 let previous=null,rank=0;
 return {...availability,ranked:ranked.map((student,index)=>{if(previous!==student.percentage)rank=index+1;previous=student.percentage;return {...student,rank};})};
}
