export function normalizeHexColor(value){return /^#[\da-f]{6}$/i.test(String(value))?String(value).toLowerCase():null;}
