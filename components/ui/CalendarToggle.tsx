"use client";

import { useCalendar } from "@/contexts/CalendarContext";

export default function CalendarToggle() {
  const { calendar, setCalendar } = useCalendar();
  const isShamsi = calendar === "shamsi";

  return (
    <div className="flex rounded-lg border border-border-base bg-bg-secondary p-0.5 text-xs font-semibold">
      <button
        type="button"
        onClick={() => setCalendar("gregorian")}
        className={`rounded-md px-3 py-1 transition-colors ${
          !isShamsi
            ? "bg-accent-blue text-white shadow-sm"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        Gregorian
      </button>
      <button
        type="button"
        onClick={() => setCalendar("shamsi")}
        className={`rounded-md px-3 py-1 transition-colors ${
          isShamsi
            ? "bg-accent-blue text-white shadow-sm"
            : "text-text-secondary hover:text-text-primary"
        }`}
      >
        Shamsi
      </button>
    </div>
  );
}
