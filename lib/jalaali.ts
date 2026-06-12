import jalaali from "jalaali-js";
import { parseISO } from "date-fns";

export type CalendarMode = "gregorian" | "shamsi";

/** Convert "yyyy-MM-dd" or ISO string to Shamsi "yyyy/MM/dd" */
function isoToShamsi(dateStr: string, separator = "/"): string {
  const d = parseISO(dateStr);
  const { jy, jm, jd } = jalaali.toJalaali(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate()
  );
  return `${jy}${separator}${String(jm).padStart(2, "0")}${separator}${String(jd).padStart(2, "0")}`;
}

/** Short display: MM/DD for either calendar */
export function formatDateShort(dateStr: string, mode: CalendarMode): string {
  if (mode === "shamsi") {
    const d = parseISO(dateStr);
    const { jm, jd } = jalaali.toJalaali(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    );
    return `${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
  }
  // Gregorian
  const d = parseISO(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

/** Long display: full date for tooltip */
export function formatDateLong(dateStr: string, mode: CalendarMode): string {
  if (mode === "shamsi") {
    return isoToShamsi(dateStr);
  }
  // Gregorian – e.g. "Jan 15, 2024"
  const d = parseISO(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Convert a Gregorian Date to Tehran-time ISO date string "yyyy-MM-dd" */
export function todayTehranISO(): string {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" })
  );
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convert a Gregorian "yyyy-MM-dd" to Shamsi "yyyy-MM-dd" for display */
export function gregToShamsiLabel(dateStr: string): string {
  return isoToShamsi(dateStr, "/");
}
