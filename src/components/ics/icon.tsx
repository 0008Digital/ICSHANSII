const paths: Record<string, string> = {
 "chevron-down": "M6 9l6 6 6-6",
 "chevron-left": "M15 6l-6 6 6 6",
 "chevron-right": "M9 6l6 6-6 6",
 search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16 M21 21l-4.35-4.35",
 plus: "M12 5v14 M5 12h14",
 download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
 dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
 students: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4",
 batches: "M3 5h7l2 2h9v13H3z", fees: "M4 3h16v18l-4-2-4 2-4-2-4 2z M8 8h8 M8 12h6",
 ledger: "M4 4h16v16H4z M8 8h8 M8 12h3 M8 16h5 M15 12h1",
 audit: "M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5 M3 7V3h4 M17 3h4v4",
 attendance: "M7 3v4 M17 3v4 M3 10h18 M3 5h18v16H3z M8 15l3 3 5-5",
 staff: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 21v-2a6 6 0 0 1 6-5h4a6 6 0 0 1 6 5v2",
 tests: "M8 3H4v18h16V3h-4 M8 2h8v4H8z M8 11h8 M8 16h5",
 homework: "M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3z M12 6v16",
 updates: "M4 4h16v13H9l-5 4z M8 8h8 M8 12h5",
 settings: "M4 7h16 M4 17h16 M8 4v6 M16 14v6", more: "M4 6h16 M4 12h16 M4 18h16",
 chat: "M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 20l1.2-4.2A8.5 8.5 0 1 1 21 11.5z M8 11h.01 M12 11h.01 M16 11h.01",
 bug: "M8 8 6 6 M16 8l2-2 M9 3h6l2 4H7z M12 7v14 M5 11H3 M21 11h-2 M5 16H3 M21 16h-2 M7 10h10v7a5 5 0 0 1-10 0z",
 shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z M9 12l2 2 4-4",
};
export function Icon({ name }: { name: string }) {
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.dashboard} /></svg>;
}
