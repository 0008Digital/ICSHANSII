export const chatRoles = ["admin", "manager", "teacher", "student"];
export const permissionKeys = ["chatrooms", "batchRooms", "staffRoom", "announcements", "studentSupport", "studentSend", "studentRead", "teacherSend", "teacherRead", "attachments", "reactions", "roomCreation", "moderation"];
export const defaultChatPermissions = Object.freeze({
  access: Object.freeze({ admin: true, manager: false, teacher: false, student: false }),
  features: Object.freeze({ chatrooms: true, batchRooms: true, staffRoom: true, announcements: true, studentSupport: false, studentSend: false, studentRead: false, teacherSend: false, teacherRead: false, attachments: false, reactions: true, roomCreation: false, moderation: true }),
  grants: Object.freeze({
    admin: Object.freeze({ chatrooms:true,batchRooms:true,staffRoom:true,announcements:true,studentSupport:true,studentSend:true,studentRead:true,teacherSend:true,teacherRead:true,attachments:false,reactions:true,roomCreation:true,moderation:true }),
    manager: Object.freeze({ chatrooms:true,batchRooms:true,staffRoom:true,announcements:true,studentSupport:true,studentSend:false,studentRead:true,teacherSend:true,teacherRead:true,attachments:false,reactions:true,roomCreation:false,moderation:true }),
    teacher: Object.freeze({ chatrooms:true,batchRooms:true,staffRoom:false,announcements:true,studentSupport:false,studentSend:false,studentRead:false,teacherSend:true,teacherRead:true,attachments:false,reactions:true,roomCreation:false,moderation:false }),
    student: Object.freeze({ chatrooms:true,batchRooms:true,staffRoom:false,announcements:true,studentSupport:false,studentSend:false,studentRead:true,teacherSend:false,teacherRead:false,attachments:false,reactions:true,roomCreation:false,moderation:false }),
  }),
});
export function permissionFor(room, key, defaults = defaultChatPermissions, overrides = {}, role) {
  const value = role ? overrides[room]?.[role]?.[key] : overrides[room]?.[key];
  if (typeof value === "boolean") return value;
  if (role && typeof defaults.grants?.[role]?.[key] === "boolean") return defaults.grants[role][key];
  return Boolean(defaults.features[key]);
}
export function canAccessChat(role, room, defaults = defaultChatPermissions, overrides = {}) {
  if (!chatRoles.includes(role) || !defaults.access[role] || !permissionFor(room.id, "chatrooms", defaults, overrides, role)) return false;
  if (!permissionFor(room.id, room.permissionKey, defaults, overrides, role)) return false;
  if (role === "student" && (!permissionFor(room.id, "studentRead", defaults, overrides, role) || room.type === "staff")) return false;
  if (role === "teacher" && !permissionFor(room.id, "teacherRead", defaults, overrides, role)) return false;
  if (room.type === "batch" && (role === "student" || role === "teacher") && !room.assignedPreview) return false;
  return true;
}
const rules = [
  { category: "Threat", severity: "high", pattern: /\b(kill you|shoot you|bomb threat)\b/i },
  { category: "Sexual content", severity: "high", pattern: /\b(explicit sexual content|send nudes)\b/i },
  { category: "Harassment", severity: "high", pattern: /\b(i will bully you|target you every day)\b/i },
  { category: "Abusive language", severity: "medium", pattern: /\b(fuck you|go to hell)\b/i },
  { category: "Hate speech", severity: "high", pattern: /\b(racial slur|hate group)\b/i },
];
export function moderateMessage(input) {
  const text = String(input ?? "").trim();
  if (!text) return { action: "allow", category: null, severity: null };
  if (text.length > 1500) return { action: "hold", category: "Message length", severity: "low" };
  if (/(.{4,})\1{3,}/i.test(text)) return { action: "hold", category: "Repeated spam", severity: "low" };
  const match = rules.find(rule => rule.pattern.test(text));
  return match ? { action: match.severity === "high" ? "block" : "hold", category: match.category, severity: match.severity } : { action: "allow", category: null, severity: null };
}
export const demoMessages = Object.freeze([
  { id: "msg-1", room: "new-general", sender: "Aarav Example", role: "Student", text: "Could you share the revision topic list for Friday?", time: "09:12" },
  { id: "msg-2", room: "new-general", sender: "Ms. Meera Example", role: "Teacher", text: "We will review chapters 3 and 4 in class.", time: "09:18" },
  { id: "msg-3", room: "announcements", sender: "Centre Admin Example", role: "Admin", text: "This is a fictional notice preview. No announcement has been delivered.", time: "10:05" },
]);
