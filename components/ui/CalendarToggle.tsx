"use client";

import { useCalendar } from "@/contexts/CalendarContext";

export default function CalendarToggle() {
  const { calendar, setCalendar } = useCalendar();
  const isShamsi = calendar === "shamsi";

  return (
    <button
      type="button"
      onClick={() => setCalendar(isShamsi ? "gregorian" : "shamsi")}
      title={isShamsi ? "Switch to Gregorian calendar" : "Switch to Shamsi calendar"}
      className="relative flex h-[30px] w-[68px] items-center rounded-full border border-border-base bg-bg-secondary p-0.5 transition-colors"
      aria-pressed={isShamsi}
    >
      {/* sliding pill */}
      <span
        className={`absolute top-0.5 h-[22px] w-[30px] rounded-full bg-accent-blue shadow transition-all duration-300 ${
          isShamsi ? "right-0.5 left-auto" : "left-0.5"
        }`}
      />
      {/* labels */}
      <span
        className={`relative z-10 flex-1 text-center text-[10px] font-bold transition-colors duration-200 ${
          !isShamsi ? "text-white" : "text-text-muted"
        }`}
      >
        AD
      </span>
      <span
        className={`relative z-10 flex-1 text-center text-[10px] font-bold transition-colors duration-200 ${
          isShamsi ? "text-white" : "text-text-muted"
        }`}
      >
        ش
      </span>
    </button>
  );
}
