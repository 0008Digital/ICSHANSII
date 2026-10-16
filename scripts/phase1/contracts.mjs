// Independent expectations for the working centre panels. Changes need review;
// do not regenerate these from the application registry under test.
export const centreRoutes = [
  ['Dashboard', '/'], ['Students', '/students'], ['Batches', '/batches'],
  ['Attendance', '/attendance'], ['Tests & Results', '/tests-results'],
  ['Homework', '/homework'], ['Fees', '/fees'], ['Ledger', '/ledger'],
  ['Staff', '/staff'], ['Audit Logs', '/audit-logs'],
  ['ICS Updates', '/ics-updates'], ['Chatrooms', '/chatrooms'], ['Settings', '/settings'],
];
export const routesFor = role => centreRoutes.filter(([, href]) => role === 'admin' || !['/ledger', '/audit-logs'].includes(href));
export const roleLabels = {admin: 'Centre Admin', manager: 'Manager'};
export const sizes = {desktop: {width: 1440, height: 900}, mobile320: {width: 320, height: 740}};
export const isApprovedBaseline = href => href !== '/settings';
export const detailRoutes = [
  ['Add Student', '/students/new'],
  ['Aarav Example', '/students/DEMO-001'],
  ['Edit student details', '/students/DEMO-001/edit'],
];
