"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Density = "compact" | "comfortable" | "spacious";

interface DensityContextValue {
  density: Density;
  setDensity: (d: Density) => void;
  /** Tailwind padding classes for a table cell at the current density. */
  cellPadding: string;
}

const PADDING: Record<Density, string> = {
  compact: "px-3 py-1.5",
  comfortable: "px-4 py-3",
  spacious: "px-5 py-4",
};

const STORAGE_KEY = "table-density";

const DensityContext = createContext<DensityContextValue>({
  density: "comfortable",
  setDensity: () => undefined,
  cellPadding: PADDING.comfortable,
});

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<Density>("comfortable");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Density | null;
    if (saved === "compact" || saved === "comfortable" || saved === "spacious") {
      setDensityState(saved);
    }
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    window.localStorage.setItem(STORAGE_KEY, d);
  }, []);

  return (
    <DensityContext.Provider value={{ density, setDensity, cellPadding: PADDING[density] }}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  return useContext(DensityContext);
}
