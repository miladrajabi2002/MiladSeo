"use client";

import { createContext, useContext, useState } from "react";
import type { CalendarMode } from "@/lib/jalaali";

interface CalendarContextValue {
  calendar: CalendarMode;
  setCalendar: (mode: CalendarMode) => void;
}

const CalendarContext = createContext<CalendarContextValue>({
  calendar: "gregorian",
  setCalendar: () => undefined,
});

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [calendar, setCalendar] = useState<CalendarMode>("gregorian");

  return (
    <CalendarContext.Provider value={{ calendar, setCalendar }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  return useContext(CalendarContext);
}
