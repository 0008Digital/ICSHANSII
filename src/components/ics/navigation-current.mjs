/** A section link owns the active state instead of its base dashboard route. */
export function isCurrentNavigationHref(href, pathname, hash, hrefs) {
 const [path, anchor] = href.split("#");
 if (pathname !== path && !(path !== "/" && pathname.startsWith(`${path}/`))) return false;
 if (anchor) return hash === `#${anchor}`;
 if (hrefs.some(entry => entry?.startsWith(`${path}#`))) return hash === "";
 return true;
}

const dockLabels = {
 "teacher-dashboard": "Dashboard",
 "assigned-students": "Students",
 attendance: "Attendance",
 homework: "Homework",
 "developer-console": "Console",
 "bug-reports": "Reports",
 "application-errors": "Errors",
 "system-health": "Health",
 "student-home": "Home",
 "student-batch": "Batch",
 "student-attendance": "Attendance",
 "student-results": "Results",
};

/** Compact dock copy; the full module title remains the link's accessible name. */
export function mobileNavigationLabel(entry) {
 return {label: dockLabels[entry.id] ?? entry.label, accessibleLabel: entry.label};
}
