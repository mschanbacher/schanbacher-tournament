// Time / display formatting utilities

export function formatTipoff(tipoff) {
  if (!tipoff) return { day: "", time: "" };
  const d = new Date(tipoff);
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? "p" : "a";
  h = h % 12 || 12;
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return { day: days[d.getDay()], time: h + ":" + (m < 10 ? "0" : "") + m + ampm };
}

export function formatClock(detail) {
  if (!detail) return "";
  if (detail.toLowerCase() === "halftime" || detail.toLowerCase() === "half" || detail.toLowerCase().includes("end of")) return "Half";
  const timeMatch = detail.match(/(\d+:\d+)/);
  if (timeMatch) return timeMatch[1];
  return detail.slice(0, 8);
}

export function formatPeriod(detail) {
  if (!detail) return "";
  if (detail.toLowerCase() === "halftime" || detail.toLowerCase() === "half" || detail.toLowerCase().includes("end of")) return "Half";
  if (detail.toLowerCase().includes("2nd")) return "2nd";
  if (detail.toLowerCase().includes("1st")) return "1st";
  if (detail.toLowerCase().includes("ot")) return "OT";
  return "";
}
