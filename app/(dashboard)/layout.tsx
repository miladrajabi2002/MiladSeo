"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { CalendarProvider } from "@/contexts/CalendarContext";
import { DensityProvider } from "@/contexts/DensityContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <CalendarProvider>
      <DensityProvider>
        <div className="flex min-h-screen bg-bg-secondary">
          <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header onOpenMobileMenu={() => setMobileOpen(true)} />
            <main className="flex-1 p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
          </div>
        </div>
      </DensityProvider>
    </CalendarProvider>
  );
}
