export function lookupAttendanceRoster(roster, input) {
 const query=String(input??"").trim().toLocaleLowerCase();
 if(!query)return {matches:[],kind:"empty",duplicate:false};
 const numeric=/^\d+$/.test(query);
 const matches=roster.filter(student=>numeric
  ?String(student.batchRollNumber??"").trim()===query
  :`${student.name} ${student.id}`.toLocaleLowerCase().includes(query));
 return {matches,kind:numeric?"roll":"text",duplicate:numeric&&matches.length>1};
}
