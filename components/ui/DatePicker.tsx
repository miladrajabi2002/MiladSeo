"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import jalaali from "jalaali-js";
import type { CalendarMode } from "@/lib/jalaali";

// ── Shamsi ──────────────────────────────────────────────────────────────────
const J_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
const J_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]; // Sat → Fri

// ── Gregorian ────────────────────────────────────────────────────────────────
const G_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const G_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]; // Mon → Sun

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseGreg(v: string): { gy: number; gm: number; gd: number } {
  if (!v) {
    const d = new Date();
    return { gy: d.getFullYear(), gm: d.getMonth() + 1, gd: d.getDate() };
  }
  const [gy, gm, gd] = v.split("-").map(Number);
  return { gy, gm, gd };
}

function daysInGregMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate(); // m is 1-based; Date auto-adjusts
}
function firstDowGreg(y: number, m: number) {
  const js = new Date(y, m - 1, 1).getDay(); // 0=Sun … 6=Sat
  return (js + 6) % 7; // Mo=0 … Su=6
}

function daysInJalMonth(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalaali.isLeapJalaaliYear(jy) ? 30 : 29;
}
function firstDowJal(jy: number, jm: number) {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, 1);
  const js = new Date(gy, gm - 1, gd).getDay();
  return (js + 1) % 7; // Sat=0 … Fri=6
}

// ── Component ─────────────────────────────────────────────────────────────────
interface DatePickerProps {
  /** Always a Gregorian "yyyy-MM-dd" string */
  value: string;
  onChange: (v: string) => void;
  mode: CalendarMode;
  required?: boolean;
}

export default function DatePicker({ value, onChange, mode, required }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { gy, gm, gd } = parseGreg(value);
  const jalVal = jalaali.toJalaali(gy, gm, gd);

  const initView = () =>
    mode === "shamsi"
      ? { year: jalVal.jy, month: jalVal.jm }
      : { year: gy, month: gm };

  const [view, setView] = useState(initView);

  // Reset view when mode switches
  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current !== mode) {
      prevMode.current = mode;
      setView(initView());
    }
  }); // runs every render but only updates when mode actually changed

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const prevMonth = () =>
    setView((v) =>
      v.month === 1 ? { year: v.year - 1, month: 12 } : { ...v, month: v.month - 1 }
    );
  const nextMonth = () =>
    setView((v) =>
      v.month === 12 ? { year: v.year + 1, month: 1 } : { ...v, month: v.month + 1 }
    );

  const handleSelect = (day: number) => {
    let iso: string;
    if (mode === "shamsi") {
      const g = jalaali.toGregorian(view.year, view.month, day);
      iso = `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
    } else {
      iso = `${view.year}-${String(view.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    onChange(iso);
    setOpen(false);
  };

  const isShamsi = mode === "shamsi";
  const totalDays = isShamsi
    ? daysInJalMonth(view.year, view.month)
    : daysInGregMonth(view.year, view.month);
  const startOffset = isShamsi
    ? firstDowJal(view.year, view.month)
    : firstDowGreg(view.year, view.month);
  const monthNames = isShamsi ? J_MONTHS : G_MONTHS;
  const dayNames = isShamsi ? J_DAYS : G_DAYS;

  // Display value
  const display = isShamsi
    ? `${jalVal.jy}/${String(jalVal.jm).padStart(2, "0")}/${String(jalVal.jd).padStart(2, "0")}`
    : `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;

  // Which day is selected in the current view
  const selectedDay = isShamsi
    ? jalVal.jy === view.year && jalVal.jm === view.month
      ? jalVal.jd
      : null
    : gy === view.year && gm === view.month
    ? gd
    : null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger input-look */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg border bg-bg-card px-3 py-2 text-xs text-text-primary transition-all ${
          open
            ? "border-accent-blue ring-2 ring-accent-blue/10"
            : "border-border-base hover:border-accent-blue/40"
        }`}
      >
        <span dir="ltr" className="tabular-nums font-medium">
          {display}
        </span>
        <CalendarDays size={13} className="shrink-0 text-text-muted" />
      </button>

      {/* Calendar popup */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-border-base bg-bg-card p-3 shadow-card-hover">
          {/* Nav header */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-text-primary">
              {monthNames[view.month - 1]}{" "}
              <span dir="ltr" className="tabular-nums">
                {view.year}
              </span>
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day name headers */}
          <div className="mb-1 grid grid-cols-7">
            {dayNames.map((d) => (
              <div
                key={d}
                className="py-0.5 text-center text-[10px] font-semibold text-text-muted"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`gap-${i}`} />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`flex items-center justify-center rounded-lg py-1.5 text-xs transition-colors ${
                    isSelected
                      ? "bg-accent-blue font-bold text-white"
                      : "text-text-primary hover:bg-bg-secondary"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 border-t border-border-base pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                onChange(iso);
                setOpen(false);
              }}
              className="text-[10px] font-medium text-accent-blue hover:underline"
            >
              {isShamsi ? "امروز" : "Today"}
            </button>
          </div>
        </div>
      )}

      {/* Hidden native input for form required validation */}
      {required && (
        <input type="hidden" value={value} required />
      )}
    </div>
  );
}
